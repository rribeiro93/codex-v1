import { Router } from 'express';
import { handleUpdateSingleTransactionCategory } from '../controllers/transaction/transactionsController';

const router = Router();

router.put('/categories/single', handleUpdateSingleTransactionCategory);

export default router;
