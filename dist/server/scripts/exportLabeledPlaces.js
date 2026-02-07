"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportLabeledPlaces = exportLabeledPlaces;
require("dotenv/config");
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const config_1 = require("../config");
const database_1 = require("../database");
const PLACES_COLLECTION = 'places';
const OUTPUT_FILE = path_1.default.join(config_1.paths.rootDir, 'training-data', 'places-training-data.json');
async function exportLabeledPlaces() {
    await (0, database_1.connectToDatabase)(config_1.MONGODB_URI, config_1.MONGODB_DB_NAME);
    const db = (0, database_1.getDatabase)();
    const places = await db
        .collection(PLACES_COLLECTION)
        .find({
        status: 'labeled',
        category: { $type: 'string', $ne: '' },
        text: { $type: 'string', $ne: '' }
    }, { projection: { text: 1, category: 1, _id: 0 } })
        .sort({ text: 1 })
        .toArray();
    const payload = places.map((place) => ({
        text: typeof place.text === 'string' ? place.text.trim() : '',
        category: typeof place.category === 'string' ? place.category.trim() : ''
    }));
    const lines = payload.map((item) => `  ${JSON.stringify(item)}`);
    const serialized = `[\n${lines.join(',\n')}\n]\n`;
    await promises_1.default.mkdir(path_1.default.dirname(OUTPUT_FILE), { recursive: true });
    await promises_1.default.writeFile(OUTPUT_FILE, serialized, 'utf8');
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
    }
    catch (error) {
        console.error('Failed to export labeled places.', error);
        process.exitCode = 1;
    }
    finally {
        try {
            await (0, database_1.disconnectFromDatabase)();
        }
        catch (disconnectError) {
            console.error('Failed to cleanly disconnect from database.', disconnectError);
        }
    }
}
if (require.main === module) {
    main();
}
