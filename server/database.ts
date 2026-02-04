import { Db, MongoClient } from 'mongodb';

let mongoClient: MongoClient | null = null;
let database: Db | null = null;

export async function connectToDatabase(uri: string, dbName: string): Promise<Db> {
  if (database) {
    return database;
  }

  const client = new MongoClient(uri);
  await client.connect();
  mongoClient = client;
  database = client.db(dbName);

  return database;
}

export function getDatabase(): Db {
  if (!database) {
    throw new Error('Database connection has not been established.');
  }

  return database;
}

export async function disconnectFromDatabase(): Promise<void> {
  if (!mongoClient) {
    return;
  }

  await mongoClient.close();
  mongoClient = null;
  database = null;
}
