import { Router } from 'express';
import {
  handleCreateStatement,
  handleGetCategorySummary,
  handleGetSummary,
  handleGetTransactions
} from '../controllers/statementsController';

const router = Router();

router.post('/', handleCreateStatement);
router.get('/summary', handleGetSummary);
router.get('/category-summary', handleGetCategorySummary);
router.get('/transactions', handleGetTransactions);

export default router;
