import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import * as tf from '@tensorflow/tfjs-node';
import { MONGODB_DB_NAME, MONGODB_URI } from '../config';
import { connectToDatabase, getDatabase, disconnectFromDatabase } from '../database';
import { normalizePlace } from '../utils/placeNormalizer';
import { sanitizeTransaction } from '../utils/statements';
import type { CsvTransaction } from '../../src/shared/types';

const SOURCE_COLLECTION = 'statements';
const DESTINATION_COLLECTION = 'statements_categorized';
const TRAINING_DATA_PATH = path.resolve(__dirname, '..', '..', 'training-data', 'places-training-data.json');

type TrainingSample = {
  text: string;
  category: string;
};

type LabelIndex = Record<string, number>;

type CharIndex = Record<string, number>;

type CategorizedTransaction = CsvTransaction & { categoryStatus?: string };

async function loadTrainingSamples(): Promise<TrainingSample[]> {
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
    .filter((value): value is TrainingSample => Boolean(value));

  if (!samples.length) {
    throw new Error('No valid training samples were found.');
  }

  return samples;
}

function buildCharIndex(samples: TrainingSample[]): { index: CharIndex; size: number } {
  const chars = new Set<string>();
  for (const sample of samples) {
    for (const char of sample.text) {
      chars.add(char);
    }
  }

  const sortedChars = Array.from(chars).sort();
  const index: CharIndex = {};
  sortedChars.forEach((char, idx) => {
    index[char] = idx + 1; // Reserve 0 for padding / unknown.
  });

  return {
    index,
    size: sortedChars.length + 1
  };
}

function determineSequenceLength(samples: TrainingSample[]): number {
  const maxLength = samples.reduce((acc, sample) => Math.max(acc, sample.text.length), 0);
  return Math.min(Math.max(maxLength, 16), 64);
}

function encodeText(text: string, charIndex: CharIndex, sequenceLength: number) {
  const encoded = new Array<number>(sequenceLength).fill(0);
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

function encodeDataset(
  samples: TrainingSample[],
  charIndex: CharIndex,
  sequenceLength: number,
  labelIndex: LabelIndex
) {
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

function buildLabelIndex(samples: TrainingSample[]) {
  const labelIndex: LabelIndex = {};
  const indexLabel: Record<number, string> = {};

  samples.forEach((sample) => {
    if (!(sample.category in labelIndex)) {
      const idx = Object.keys(labelIndex).length;
      labelIndex[sample.category] = idx;
      indexLabel[idx] = sample.category;
    }
  });

  return { labelIndex, indexLabel, size: Object.keys(labelIndex).length };
}

function buildModel(vocabSize: number, sequenceLength: number, numClasses: number) {
  const model = tf.sequential();

  model.add(
    tf.layers.embedding({
      inputDim: vocabSize,
      outputDim: 32,
      inputLength: sequenceLength
    })
  );
  model.add(tf.layers.flatten());
  model.add(tf.layers.dense({ units: 64, activation: 'relu' }));
  model.add(tf.layers.dropout({ rate: 0.2 }));
  model.add(tf.layers.dense({ units: numClasses, activation: 'softmax' }));

  model.compile({
    optimizer: tf.train.adam(0.005),
    loss: 'sparseCategoricalCrossentropy',
    metrics: ['accuracy']
  });

  return model;
}

async function trainModel(
  model: tf.LayersModel,
  inputs: number[][],
  labels: number[],
  sequenceLength: number
) {
  const xs = tf.tensor2d(inputs, [inputs.length, sequenceLength], 'int32');
  const ys = tf.tensor1d(labels, 'int32');

  await model.fit(xs, ys, {
    epochs: 25,
    batchSize: 32,
    shuffle: true,
    verbose: 0
  });

  xs.dispose();
  ys.dispose();
}

function createPredictor(
  model: tf.LayersModel,
  charIndex: CharIndex,
  sequenceLength: number,
  indexLabel: Record<number, string>
) {
  return (text: string) => {
    const normalizedText = normalizePlace(text);
    if (!normalizedText) {
      return '';
    }

    return tf.tidy(() => {
      const encoded = encodeText(normalizedText, charIndex, sequenceLength);
      const input = tf.tensor2d([encoded], [1, sequenceLength], 'int32');
      const output = model.predict(input) as tf.Tensor;
      const probabilities = output.arraySync() as number[][];
      const scores = probabilities[0] ?? [];

      let bestIndex = 0;
      let bestScore = Number.NEGATIVE_INFINITY;
      for (let i = 0; i < scores.length; i += 1) {
        if (scores[i] > bestScore) {
          bestIndex = i;
          bestScore = scores[i];
        }
      }

      input.dispose();
      output.dispose();

      return indexLabel[bestIndex] ?? '';
    });
  };
}

export async function categorizeStatements() {
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

  for await (const statement of cursor as AsyncIterable<StatementDocument>) {
    processedStatements += 1;

    const transactions = Array.isArray(statement.transactions) ? statement.transactions : [];
    const categorizedList: CategorizedTransaction[] = [];

    for (const transaction of transactions) {
      const sanitized = sanitizeTransaction(transaction);
      if (!sanitized) {
        continue;
      }

      const categorizedTxn: CategorizedTransaction = { ...sanitized };

      processedTransactions += 1;

      const predictedCategory = categorizedTxn.place ? predictCategory(categorizedTxn.place) : '';
      if (predictedCategory) {
        categorizedTxn.category = predictedCategory;
        categorizedTxn.categoryStatus = 'ml';
        categorizedTransactions += 1;
      }

      categorizedList.push(categorizedTxn);
    }

    const now = new Date();
    const categorizedDoc = {
      sourceStatementId: statement._id,
      month: typeof statement.month === 'string' ? statement.month : '',
      fileName: typeof statement.fileName === 'string' ? statement.fileName : '',
      monthName: typeof statement.monthName === 'string' ? statement.monthName : '',
      totalAmount: Number.isFinite(statement.totalAmount) ? (statement.totalAmount as number) : 0,
      totalTransactions: categorizedList.length,
      createdAt: (statement as any).createdAt ?? now,
      sourceCreatedAt: (statement as any).createdAt ?? null,
      sourceUpdatedAt: (statement as any).updatedAt ?? null,
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

interface StatementDocument {
  _id?: string;
  month?: string;
  fileName?: string;
  monthName?: string;
  totalAmount?: number;
  transactions?: CsvTransaction[];
  createdAt?: Date;
  updatedAt?: Date;
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
