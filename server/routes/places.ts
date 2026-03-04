import { Router } from 'express';
import { handleUpdateSinglePlaceCategory } from '../controllers/place/placesController';

const router = Router();

router.put('/categories/single', handleUpdateSinglePlaceCategory);

export default router;
