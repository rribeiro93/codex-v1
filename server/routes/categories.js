const express = require('express');
const {
  handleGetCategories,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory
} = require('../controllers/categoriesController');

const router = express.Router();

router.get('/', handleGetCategories);
router.post('/', handleCreateCategory);
router.put('/:id', handleUpdateCategory);
router.delete('/:id', handleDeleteCategory);

module.exports = router;
