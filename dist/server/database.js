"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectToDatabase = connectToDatabase;
exports.getDatabase = getDatabase;
exports.disconnectFromDatabase = disconnectFromDatabase;
const mongodb_1 = require("mongodb");
let mongoClient = null;
let database = null;
async function connectToDatabase(uri, dbName) {
    if (database) {
        return database;
    }
    const client = new mongodb_1.MongoClient(uri);
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
    mongoClient = null;
    database = null;
}
