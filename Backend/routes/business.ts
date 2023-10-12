import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import * as businessController from '../controllers/businessController';

const router = Router();

router.get('/', asyncHandler(businessController.getBusinesses));
router.get('/reviews', asyncHandler(businessController.getAllReviews));
router.get('/:id', asyncHandler(businessController.getBusinessById));
router.get('/:id/reviews', asyncHandler(businessController.getReviewsById));
router.get('/:id/ratings', asyncHandler(businessController.getRatings));
router.get('/:id/average', asyncHandler(businessController.getAverageRating));

router.post('/search', asyncHandler(businessController.search));
router.post('/:id/reviews',  asyncHandler(businessController.addReviews));
router.post('/:id', asyncHandler(businessController.addBusinessDetails));

export default router;