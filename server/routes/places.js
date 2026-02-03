const express = require('express');
const {
  handleGetPlaces,
  handleUpdatePlaceCategories,
  handleUpdateSinglePlaceCategory
} = require('../controllers/placesController');

const router = express.Router();

router.get('/', handleGetPlaces);
router.put('/categories', handleUpdatePlaceCategories);
router.put('/categories/single', handleUpdateSinglePlaceCategory);

module.exports = router;
