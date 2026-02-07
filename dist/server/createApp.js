"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServerApp = createServerApp;
const express_1 = __importDefault(require("express"));
const react_1 = __importDefault(require("react"));
const server_1 = require("react-dom/server");
const App_1 = __importDefault(require("../src/App"));
const htmlTemplate_1 = require("./htmlTemplate");
const config_1 = require("./config");
const database_1 = require("./database");
const statements_1 = __importDefault(require("./routes/statements"));
const places_1 = __importDefault(require("./routes/places"));
const categories_1 = __importDefault(require("./routes/categories"));
function renderReactApp(url) {
    const markup = (0, server_1.renderToString)(react_1.default.createElement(App_1.default, { url }));
    return (0, htmlTemplate_1.renderDocument)({ markup });
}
async function createServerApp() {
    await (0, database_1.connectToDatabase)(config_1.MONGODB_URI, config_1.MONGODB_DB_NAME);
    const app = (0, express_1.default)();
    app.locals.db = (0, database_1.getDatabase)();
    app.use(express_1.default.json({ limit: '2mb' }));
    app.use('/assets', express_1.default.static(config_1.paths.assetsDir));
    app.use('/api/statements', statements_1.default);
    app.use('/api/places', places_1.default);
    app.use('/api/categories', categories_1.default);
    app.get('*', (req, res) => {
        const html = renderReactApp(req.url);
        res.status(200).send(html);
    });
    return app;
}
