const express = require('express');
const {
  handleGetPlaces,
  handleUpdatePlaceCategories
} = require('../controllers/placesController');

const router = express.Router();

router.get('/', handleGetPlaces);
router.put('/categories', handleUpdatePlaceCategories);

module.exports = router;
