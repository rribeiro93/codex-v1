const express = require('express');
const { handleUpdateSinglePlaceCategory } = require('../controllers/placesController');

const router = express.Router();

router.put('/categories/single', handleUpdateSinglePlaceCategory);

module.exports = router;
