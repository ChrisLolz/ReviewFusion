import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import * as yelpController from '../controllers/yelpController';

const router = Router();

router.get('/', asyncHandler(yelpController.getYelpBusinesses));
router.get('/reviews', asyncHandler(yelpController.getAllYelpReviews));
router.get('/reviews/:id', asyncHandler(yelpController.getBusinessYelpReviews));
router.get('/rating/:id', asyncHandler(yelpController.getBusinessYelpRating));

export default router;