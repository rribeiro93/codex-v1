#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const tf = require('@tensorflow/tfjs-node');

const {
  MONGODB_URI,
  MONGODB_DB_NAME
} = require('../config');
const {
  connectToDatabase,
  getDatabase,
  disconnectFromDatabase
} = require('../database');
const { normalizePlace } = require('../utils/placeNormalizer');
const { sanitizeTransaction } = require('../utils/statements');

const SOURCE_COLLECTION = 'statements';
const DESTINATION_COLLECTION = 'statements_categorized';
const TRAINING_DATA_PATH = path.resolve(__dirname, '..', '..', 'training-data', 'places-training-data.json');

async function loadTrainingSamples() {
  const raw = await fs.readFile(TRAINING_DATA_PATH, 'utf8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    throw new Error('Training data must be an array of { text, category } entries.');
  }

  const samples = data
    .map((entry) => {
      if (!entry || typeof entry.text !== 'string' || typeof entry.category !== 'string') {
        return null;
      }
      const normalizedText = normalizePlace(entry.text);
      const normalizedCategory = entry.category.trim();
      if (!normalizedText || !normalizedCategory) {
        return null;
      }
      return {
        text: normalizedText.toUpperCase(),
        category: normalizedCategory
      };
    })
    .filter(Boolean);

  if (!samples.length) {
    throw new Error('No valid training samples were found.');
  }

  return samples;
}

function buildCharIndex(samples) {
  const chars = new Set();
  for (const sample of samples) {
    for (const char of sample.text) {
      chars.add(char);
    }
  }

  const sortedChars = Array.from(chars).sort();
  const index = {};
  sortedChars.forEach((char, idx) => {
    index[char] = idx + 1; // Reserve 0 for padding / unknown.
  });

  return {
    index,
    size: sortedChars.length + 1
  };
}

function determineSequenceLength(samples) {
  const maxLength = samples.reduce((acc, sample) => Math.max(acc, sample.text.length), 0);
  // Keep the sequence reasonably small while covering most inputs.
  return Math.min(Math.max(maxLength, 16), 64);
}

function encodeText(text, charIndex, sequenceLength) {
  const encoded = new Array(sequenceLength).fill(0);
  const upperText = text.toUpperCase();
  const limit = Math.min(upperText.length, sequenceLength);

  for (let i = 0; i < limit; i += 1) {
    const char = upperText[i];
    const mapped = charIndex[char];
    if (typeof mapped === 'number') {
      encoded[i] = mapped;
    }
  }

  return encoded;
}

function encodeDataset(samples, charIndex, sequenceLength, labelIndex) {
  const inputs = samples.map((sample) => encodeText(sample.text, charIndex, sequenceLength));
  const labels = samples.map((sample) => {
    const label = labelIndex[sample.category];
    if (typeof label !== 'number') {
      throw new Error(`Missing label index for category "${sample.category}".`);
    }
    return label;
  });

  return { inputs, labels };
}

function buildLabelIndex(samples) {
  const labelIndex = {};
  const indexLabel = {};

  samples.forEach((sample) => {
    if (!(sample.category in labelIndex)) {
      const idx = Object.keys(labelIndex).length;
      labelIndex[sample.category] = idx;
      indexLabel[idx] = sample.category;
    }
  });

  return { labelIndex, indexLabel, size: Object.keys(labelIndex).length };
}

function buildModel(vocabSize, sequenceLength, numClasses) {
  const model = tf.sequential();
  model.add(
    tf.layers.embedding({
      inputDim: vocabSize,
      outputDim: 32,
      inputLength: sequenceLength
    })
  );
  model.add(tf.layers.globalAveragePooling1d());
  model.add(tf.layers.dense({ units: 32, activation: 'relu' }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(0.01),
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy']
  });

  return model;
}

async function trainModel(model, inputs, labels, sequenceLength) {
  const xs = tf.tensor2d(inputs, [inputs.length, sequenceLength], 'int32');
  const ys = tf.tensor1d(labels, 'float32');

  const validationSplit = inputs.length >= 5 ? 0.2 : 0;

  await model.fit(xs, ys, {
    epochs: 80,
    shuffle: true,
    verbose: 0,
    validationSplit
  });

  xs.dispose();
  ys.dispose();
}

function createPredictor(model, charIndex, sequenceLength, indexLabel) {
  return (text) => {
    const normalizedText = normalizePlace(text).toUpperCase();
    if (!normalizedText) {
      return '';
    }

    return tf.tidy(() => {
      const encoded = encodeText(normalizedText, charIndex, sequenceLength);
      const input = tf.tensor2d([encoded], [1, sequenceLength], 'int32');
      const output = model.predict(input);
      const probabilities = output.arraySync()[0];

      let bestIndex = 0;
      let bestScore = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < probabilities.length; i += 1) {
        if (probabilities[i] > bestScore) {
          bestIndex = i;
          bestScore = probabilities[i];
        }
      }

      return indexLabel[bestIndex] ?? '';
    });
  };
}

async function categorizeStatements() {
  const samples = await loadTrainingSamples();

  const { labelIndex, indexLabel, size: numClasses } = buildLabelIndex(samples);
  if (numClasses < 2) {
    throw new Error('At least two distinct categories are required to train the model.');
  }

  const { index: charIndex, size: vocabSize } = buildCharIndex(samples);
  const sequenceLength = determineSequenceLength(samples);
  const { inputs, labels } = encodeDataset(samples, charIndex, sequenceLength, labelIndex);

  const model = buildModel(vocabSize, sequenceLength, numClasses);
  await trainModel(model, inputs, labels, sequenceLength);

  const predictCategory = createPredictor(model, charIndex, sequenceLength, indexLabel);

  await connectToDatabase(MONGODB_URI, MONGODB_DB_NAME);
  const db = getDatabase();
  const statementsCollection = db.collection(SOURCE_COLLECTION);
  const categorizedCollection = db.collection(DESTINATION_COLLECTION);

  const cursor = statementsCollection.find({});
  let processedStatements = 0;
  let processedTransactions = 0;
  let categorizedTransactions = 0;

  // eslint-disable-next-line no-restricted-syntax
  for await (const statement of cursor) {
    processedStatements += 1;

    const transactions = Array.isArray(statement.transactions) ? statement.transactions : [];
    const categorizedList = [];

    for (const transaction of transactions) {
      const sanitized = sanitizeTransaction(transaction);
      if (!sanitized) {
        continue;
      }

      processedTransactions += 1;

      const predictedCategory = sanitized.place ? predictCategory(sanitized.place) : '';
      if (predictedCategory) {
        sanitized.category = predictedCategory;
        sanitized.categoryStatus = 'ml';
        categorizedTransactions += 1;
      }

      categorizedList.push(sanitized);
    }

    const now = new Date();
    const categorizedDoc = {
      sourceStatementId: statement._id,
      month: typeof statement.month === 'string' ? statement.month : '',
      fileName: typeof statement.fileName === 'string' ? statement.fileName : '',
      monthName: typeof statement.monthName === 'string' ? statement.monthName : '',
      totalAmount: Number.isFinite(statement.totalAmount) ? statement.totalAmount : 0,
      totalTransactions: categorizedList.length,
      createdAt: statement.createdAt ?? now,
      sourceCreatedAt: statement.createdAt ?? null,
      sourceUpdatedAt: statement.updatedAt ?? null,
      updatedAt: now,
      categorizedAt: now,
      transactions: categorizedList
    };

    await categorizedCollection.replaceOne(
      { sourceStatementId: statement._id },
      categorizedDoc,
      { upsert: true }
    );
  }

  await disconnectFromDatabase();

  return {
    processedStatements,
    processedTransactions,
    categorizedTransactions
  };
}

async function main() {
  try {
    const result = await categorizeStatements();
    console.log('Categorization completed.');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Failed to categorize statements.', error);
    process.exitCode = 1;
  } finally {
    try {
      await disconnectFromDatabase();
    } catch (disconnectError) {
      console.error('Failed to disconnect from database.', disconnectError);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  categorizeStatements
};
