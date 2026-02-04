import { Router } from 'express';
import {
  handleGetCategories,
  handleCreateCategory,
  handleUpdateCategory,
  handleDeleteCategory
} from '../controllers/categoriesController';

const router = Router();

router.get('/', handleGetCategories);
router.post('/', handleCreateCategory);
router.put('/:id', handleUpdateCategory);
router.delete('/:id', handleDeleteCategory);

export default router;
