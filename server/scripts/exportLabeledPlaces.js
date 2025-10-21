#!/usr/bin/env node

require('dotenv').config();

const fs = require('fs/promises');
const path = require('path');
const {
  MONGODB_URI,
  MONGODB_DB_NAME,
  paths
} = require('../config');
const {
  connectToDatabase,
  getDatabase,
  disconnectFromDatabase
} = require('../database');

const PLACES_COLLECTION = 'places';
const OUTPUT_FILE = path.join(paths.rootDir, 'training-data', 'places-training-data.json');

async function exportLabeledPlaces() {
  await connectToDatabase(MONGODB_URI, MONGODB_DB_NAME);
  const db = getDatabase();

  const places = await db
    .collection(PLACES_COLLECTION)
    .find(
      {
        status: 'labeled',
        category: { $type: 'string', $ne: '' },
        text: { $type: 'string', $ne: '' }
      },
      { projection: { text: 1, category: 1, _id: 0 } }
    )
    .sort({ text: 1 })
    .toArray();

  const payload = places.map((place) => ({ text: place.text.trim(), category: place.category.trim() }));

  const lines = payload.map((item) => `  ${JSON.stringify(item)}`);
  const serialized = `[\n${lines.join(',\n')}\n]\n`;

  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.writeFile(OUTPUT_FILE, serialized, 'utf8');

  return {
    exported: payload.length,
    output: OUTPUT_FILE
  };
}

async function main() {
  try {
    const result = await exportLabeledPlaces();
    console.log('Labeled places export completed:');
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('Failed to export labeled places.', error);
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
  exportLabeledPlaces
};
