import { Router } from 'express';
import * as businessController from '../controllers/businessController';

const router = Router();

router.get('/test', businessController.addBusiness);

export default router;