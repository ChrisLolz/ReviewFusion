import { Request, Response } from 'express';
import asyncHandler from 'express-async-handler';

import * as yelpController from '../controllers/yelpController';

export const addBusiness = asyncHandler(async (req: Request, res: Response) => {
    const params = req.body as yelpController.businessParams;

    const businessID = await yelpController.getBusinessID(params);
    const reviews = await yelpController.getReviews(businessID);
    const rating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;

    res.json(rating);
});