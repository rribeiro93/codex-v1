"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const placesController_1 = require("../controllers/placesController");
const router = (0, express_1.Router)();
router.put('/categories/single', placesController_1.handleUpdateSinglePlaceCategory);
exports.default = router;
