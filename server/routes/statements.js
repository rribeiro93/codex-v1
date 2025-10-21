const express = require('express');
const {
  handleCreateStatement,
  handleGetSummary,
  handleGetTransactions
} = require('../controllers/statementsController');

const router = express.Router();

router.post('/', handleCreateStatement);
router.get('/summary', handleGetSummary);
router.get('/transactions', handleGetTransactions);

module.exports = router;
