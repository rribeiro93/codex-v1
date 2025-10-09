const { MongoClient } = require('mongodb');

let mongoClient;
let database;

async function connectToDatabase(uri, dbName) {
  if (database) {
    return database;
  }

  const client = new MongoClient(uri);
  await client.connect();
  mongoClient = client;
  database = client.db(dbName);

  return database;
}

function getDatabase() {
  if (!database) {
    throw new Error('Database connection has not been established.');
  }

  return database;
}

async function disconnectFromDatabase() {
  if (!mongoClient) {
    return;
  }

  await mongoClient.close();
  mongoClient = undefined;
  database = undefined;
}

module.exports = {
  connectToDatabase,
  getDatabase,
  disconnectFromDatabase
};
