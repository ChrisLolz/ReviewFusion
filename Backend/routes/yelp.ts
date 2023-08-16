import { Router, Request, Response } from 'express';
import asyncHandler from 'express-async-handler';
import * as yelpController from '../controllers/yelpController';

const router = Router();

router.get('/getBusinessID', asyncHandler (async (req: Request, res: Response) => {
    const params = req.body as yelpController.businessParams;
    const businessID = await yelpController.getBusinessID(params);
    res.send(businessID);
}));

router.get('/getReviews/:id' , asyncHandler (async (req: Request, res: Response) => {
    const id = req.params.id;
    const reviews = await yelpController.getReviews(id);
    res.send(reviews);
}));

export default router;