import { Router } from 'express';
import {
  handleCreateTransactionMapping,
  handleGetTransactionsCategorySummary,
  handleGetTransactionsByMonth,
  handleGetTransactionsSummary,
  handleImportTransactions,
  handleUpdateTransactionMapping,
  handleUpdateSingleTransactionCategory
} from '../controllers/transaction/transactionsController';

const router = Router();

router.get('/', handleGetTransactionsByMonth);
router.get('/summary', handleGetTransactionsSummary);
router.get('/category-summary', handleGetTransactionsCategorySummary);
router.post('/import', handleImportTransactions);
router.post('/mappings', handleCreateTransactionMapping);
router.put('/mappings/:id', handleUpdateTransactionMapping);
router.put('/categories/single', handleUpdateSingleTransactionCategory);

export default router;
