import { Router } from 'express';
import {
  handleCreateStatement,
  handleGetSummary,
  handleGetTransactions
} from '../controllers/statementsController';

const router = Router();

router.post('/', handleCreateStatement);
router.get('/summary', handleGetSummary);
router.get('/transactions', handleGetTransactions);

export default router;
