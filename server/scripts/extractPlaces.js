#!/usr/bin/env node

require('dotenv').config();

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

const STATEMENTS_COLLECTION = 'statements';
const DESTINATION_COLLECTION = 'places';
const BULK_BATCH_SIZE = 500;

async function extractPlaces() {
  await connectToDatabase(MONGODB_URI, MONGODB_DB_NAME);
  const db = getDatabase();

  const statementsCollection = db.collection(STATEMENTS_COLLECTION);
  const placesCollection = db.collection(DESTINATION_COLLECTION);

  const cursor = await statementsCollection.aggregate(
    [
      { $unwind: '$transactions' },
      {
        $group: {
          _id: {
            $toUpper: {
              $trim: {
                input: '$transactions.place'
              }
            }
          },
          transaction: { $first: '$transactions.place' }
        }
      }
    ],
    { allowDiskUse: true }
  );

  const existingPlacesCursor = await placesCollection.find(
    {},
    { projection: { transaction: 1 } }
  );

  const existingPlaces = new Set();
  await existingPlacesCursor.forEach((doc) => {
    if (doc && typeof doc.transaction === 'string') {
      existingPlaces.add(doc.transaction.trim().toUpperCase());
    }
  });

  const queuedOperations = [];
  let insertedCount = 0;
  let skippedCount = 0;
  let totalUnique = 0;

  const flushOperations = async () => {
    if (!queuedOperations.length) {
      return;
    }
    const result = await placesCollection.bulkWrite(queuedOperations, { ordered: false });
    insertedCount += result.insertedCount || 0;
    queuedOperations.length = 0;
  };

  for await (const item of cursor) {
    if (!item || !item._id || !item.transaction || typeof item.transaction !== 'string') {
      continue;
    }

    const upperSource = item.transaction.trim().toUpperCase();
    if (!upperSource) {
      continue;
    }

    totalUnique += 1;

    if (existingPlaces.has(upperSource)) {
      skippedCount += 1;
      continue;
    }

    existingPlaces.add(upperSource);

    queuedOperations.push({
      insertOne: {
        document: {
          text: normalizePlace(item.transaction),
          category: '',
          transaction: item.transaction,
          status: 'pending',
          createdAt: new Date()
        }
      }
    });

    if (queuedOperations.length >= BULK_BATCH_SIZE) {
      await flushOperations();
    }
  }

  await flushOperations();

  return {
    totalUnique,
    insertedCount,
    skippedCount
  };
}

async function main() {
  try {
    const result = await extractPlaces();
    console.log('Place extraction completed:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Failed to extract places from statements.', error);
    process.exitCode = 1;
  } finally {
    try {
      await disconnectFromDatabase();
    } catch (disconnectError) {
      console.error('Failed to cleanly disconnect from database.', disconnectError);
    }
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  extractPlaces
};
