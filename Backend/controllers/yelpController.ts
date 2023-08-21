import { Request, Response } from 'express';
import Business from '../models/business';
import Review from '../models/review';

export const getYelpBusinesses = async (req: Request, res: Response) => {
    const businesses = await Business.find({"ratings.source": "Yelp"});
    res.status(200).json(businesses);
};

export const getAllYelpReviews = async (req: Request, res: Response) => {
    const reviews = await Review.find({"source": "Yelp"});
    res.json(reviews);
    res.status(200).json(reviews);
};

export const getBusinessYelpReviews = async (req: Request<{id: string}>, res: Response) => {
    const businessId = req.params.id;
    const reviews = await Review.find({"business": businessId, "source": "Yelp"});
    res.status(200).json(reviews);
};

export const getBusinessYelpRating = async (req: Request<{id: string}>, res: Response) => {
    const businessId = req.params.id;
    const yelpRating = await Business.findOne({"_id": businessId, "ratings.source": "Yelp"}, {"ratings.$": 1});
    if (!yelpRating) {
        res.status(404).json("Business not found");
        return;
    }
    res.status(200).json(yelpRating.ratings[0].rating);
};