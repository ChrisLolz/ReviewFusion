import { Request, Response } from 'express';
import Business from '../models/business';
import Review from '../models/review';
import * as cheerio from 'cheerio';
import * as puppeteer from 'puppeteer';

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        'Authorization': 'Bearer ' + process.env.YELP_API_KEY
    }
};

const api = "https://api.yelp.com/v3";

export interface businessParams {
    name: string;
    location: string;
}

interface YelpBusiness {
    id: string;
    name: string;
    image_url: string;
    location: {
        address1: string;
        city: string;
    }
}

interface YelpResponse {
    businesses: YelpBusiness[];
}

interface yelpApi {
    filters: {
        languageCode: string;
        query: string;
        sortType: string;
    }
    reviewLanguages: {
        code: string;
        count: number;
    }[]
    pagination: {
        resultsPerPage: number;
        startResult: number;
        totalResults: number;
    }
    reviews: yelpReview[];
}

interface yelpReview {
    id: string;
    userId: string;
    user: {
        link: string;
        src: string;
        srcSet: string;
        markupDisplayName: string;
    }
    comment: {
        text: string;
        language: string;
    }
    localizedDate: string;
    rating: number;
    photos: {
        src: string;
        link: string;
        altText: string;
        width: number;
        height: number;
        caption: string;
    }[]
}

export const getBusinesses =  async (req: Request, res: Response) => {
    const businesses = await Business.find({});
    res.status(200).json(businesses);
};

export const getAllReviews = async (req: Request, res: Response) => {
    const reviews = await Review.find({});
    res.status(200).json(reviews);
};

export const getBusinessById = async (req: Request, res: Response) => {
    const business = await Business.findById(req.params.id);
    res.status(200).json(business);
};

export const getReviewsById = async (req: Request, res: Response) => {
    const reviews = await Review.find({business: req.params.id});
    res.status(200).json(reviews);
};

export const getRatings = async (req: Request, res: Response) => {
    const business = await Business.find({_id: req.params.id}, {ratings: 1});
    res.status(200).json(business);
};

export const addBusiness = async (req: Request<unknown, unknown, businessParams>, res: Response) => {
    const name = req.body.name.replace(" ", "%20");
    const location = req.body.location.replace(" ", "%20");
    const URL = api+`/businesses/search?location=${location}&term=${name}&sort_by=best_match&limit=50`;
    const response = await fetch(URL, options);
    const data = await response.json() as YelpResponse;
    const yelpID = data.businesses[0].id;
    const business = new Business({
        name: data.businesses[0].name,
        address: data.businesses[0].location.address1,
        city: data.businesses[0].location.city,
        image: data.businesses[0].image_url,
        rating: [],
        reviews: []
    });
    await business.save();
    const mongoID = business._id.toString();
    const requests = [];
    requests.push(addYelpBusiness(yelpID, mongoID));
    requests.push(addGoogleBusiness(mongoID));
    await Promise.all(requests);
    res.status(200).end();
};

const addYelpBusiness = async (yelpID: string, mongoID: string) => {
    const url = "https://www.yelp.com/biz/"+yelpID+"/review_feed?rl=en&q=&sort_by=relevance_desc&start=";
    const response = await fetch(url+"0", {
        headers: {
            "Accept-Encoding": "*",
        }
    });
    const data = await response.json() as yelpApi;
    const totalReviews = Math.floor(data.pagination.totalResults/10)*10;
    const requests = [];
    for (let i = 10; i <= totalReviews; i+=10) {
        requests.push(fetch(url+i, {
            headers: {
                "Accept-Encoding": "*",
            }
        }).then(response => response.json())); 
    }
    const responses = await Promise.all(requests) as yelpApi[];
    const reviews = data.reviews.concat(...responses.map(response => response.reviews));
    const rating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    const business =  await Business.findById(mongoID);
    if (business === null) {
        return;
    }
    business.ratings.push({
        source: "Yelp",
        rating: rating
    });
    const reviewPromises = reviews.map(async review => {
        const newReview = new Review({
            source: "Yelp",
            name: review.user.markupDisplayName,
            business: business._id,
            rating: review.rating,
            comment: review.comment.text
        });
        await newReview.save();
        business.reviews.push(newReview._id);
    });
    await Promise.all(reviewPromises);
    await business.save();
};

const addGoogleBusiness = async (mongoID: string) => {
    const business =  await Business.findById(mongoID);
    if (business === null) {
        return;
    }
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(`https://www.google.com/search?q=${business.name} ${business.address}`);
    const featureID = await page.$eval('a[data-fid]', el => el.getAttribute('data-fid'));
    let reviewCount = await page.evaluate(() => {
        const element = document.querySelector('a[data-sort_by="qualityScore"] span');
        if (element === null) {
            return null;
        }
        const reviewText = element.textContent;
        if (reviewText === null) {
            return null;
        }
        return parseInt(reviewText.replace(/[^0-9]/g, ''));
    });
    await browser.close();
    if (reviewCount === null) {
        return;
    }
    if (reviewCount > 1000) {
        reviewCount = 1000;
    }
    const requests = [];
    for (let i = 0; i < Math.ceil(reviewCount/10); i++) {
        const promise = fetch(`https://www.google.com/async/reviewDialog?async=feature_id:${featureID},review_source:All%20reviews,sort_by:qualityScore,is_owner:false,filter_text:,associated_topic:,next_page_token:${nextPageTokens[i]},async_id_prefix:,_pms:s,_fmt:pc`)
        .then(response => response.text())
        .then(text => {
            const $ = cheerio.load(text);
            const reviewDiv = $('div[class="WMbnJf vY6njf gws-localreviews__google-review"]').toArray();
            const reviewPromises = reviewDiv.map(review => {
                let comment: string;
                if ($(review).find('span[class="review-full-text"]').text() !== "") {
                    comment = $(review).find('span[class="review-full-text"]').text();
                } else {
                    const reviewTextElement = $(review).find('span[data-expandable-section]');
                    reviewTextElement.find('div.k8MTF').remove();
                    comment = reviewTextElement.text().trim();
                }
                const newReview = new Review({
                    source: "Google",
                    name: $(review).find('div[class="TSUbDb"]').text(),
                    business: business._id,
                    rating: $(review).find('span[class="lTi8oc z3HNkc"]').attr('aria-label')?.split(" ")[1] || "",
                    comment: comment
                });
                business.reviews.push(newReview._id);
                return newReview.save();
            });
            return Promise.all(reviewPromises);
        });
        requests.push(promise);
    }
    await Promise.all(requests);
    const reviews = await Review.find({business: business._id, source: "Google"});
    const rating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    business.ratings.push({
        source: "Google",
        rating: rating
    });
    await business.save();
};

const nextPageTokens = [
    "",
    "CAESBkVnSUlDZw==",
    "CAESBkVnSUlGQQ==",
    "CAESBkVnSUlIZw==",
    "CAESBkVnSUlLQQ==",
    "CAESBkVnSUlNZw==",
    "CAESBkVnSUlQQQ==",
    "CAESBkVnSUlSZw==",
    "CAESBkVnSUlVQQ==",
    "CAESBkVnSUlXZw==",
    "CAESBkVnSUlaQQ==",
    "CAESBkVnSUliZw==",
    "CAESBkVnSUllQQ==",
    "CAESB0VnTUlnZ0U=",
    "CAESB0VnTUlqQUU=",
    "CAESB0VnTUlsZ0U=",
    "CAESB0VnTUlvQUU=",
    "CAESB0VnTUlxZ0U=",
    "CAESB0VnTUl0QUU=",
    "CAESB0VnTUl2Z0U=",
    "CAESB0VnTUl5QUU=",
    "CAESB0VnTUkwZ0U=",
    "CAESB0VnTUkzQUU=",
    "CAESB0VnTUk1Z0U=",
    "CAESB0VnTUk4QUU=",
    "CAESB0VnTUktZ0U=",
    "CAESB0VnTUloQUk=",
    "CAESB0VnTUlqZ0k=",
    "CAESB0VnTUltQUk=",
    "CAESB0VnTUlvZ0k=",
    "CAESB0VnTUlyQUk=",
    "CAESB0VnTUl0Z0k=",
    "CAESB0VnTUl3QUk=",
    "CAESB0VnTUl5Z0k=",
    "CAESB0VnTUkxQUk=",
    "CAESB0VnTUkzZ0k=",
    "CAESB0VnTUk2QUk=",
    "CAESB0VnTUk4Z0k=",
    "CAESB0VnTUlfQUk=",
    "CAESB0VnTUloZ00=",
    "CAESB0VnTUlrQU0=",
    "CAESB0VnTUltZ00=",
    "CAESB0VnTUlwQU0=",
    "CAESB0VnTUlyZ00=",
    "CAESB0VnTUl1QU0=",
    "CAESB0VnTUl3Z00=",
    "CAESB0VnTUl6QU0=",
    "CAESB0VnTUkxZ00=",
    "CAESB0VnTUk0QU0=",
    "CAESB0VnTUk2Z00=",
    "CAESB0VnTUk5QU0=",
    "CAESB0VnTUlfZ00=",
    "CAESB0VnTUlpQVE=",
    "CAESB0VnTUlrZ1E=",
    "CAESB0VnTUluQVE=",
    "CAESB0VnTUlwZ1E=",
    "CAESB0VnTUlzQVE=",
    "CAESB0VnTUl1Z1E=",
    "CAESB0VnTUl4QVE=",
    "CAESB0VnTUl6Z1E=",
    "CAESB0VnTUkyQVE=",
    "CAESB0VnTUk0Z1E=",
    "CAESB0VnTUk3QVE=",
    "CAESB0VnTUk5Z1E=",
    "CAESB0VnTUlnQVU=",
    "CAESB0VnTUlpZ1U=",
    "CAESB0VnTUlsQVU=",
    "CAESB0VnTUluZ1U=",
    "CAESB0VnTUlxQVU=",
    "CAESB0VnTUlzZ1U=",
    "CAESB0VnTUl2QVU=",
    "CAESB0VnTUl4Z1U=",
    "CAESB0VnTUkwQVU=",
    "CAESB0VnTUkyZ1U=",
    "CAESB0VnTUk1QVU=",
    "CAESB0VnTUk3Z1U=",
    "CAESB0VnTUktQVU=",
    "CAESB0VnTUlnZ1k=",
    "CAESB0VnTUlqQVk=",
    "CAESB0VnTUlsZ1k=",
    "CAESB0VnTUlvQVk=",
    "CAESB0VnTUlxZ1k=",
    "CAESB0VnTUl0QVk=",
    "CAESB0VnTUl2Z1k=",
    "CAESB0VnTUl5QVk=",
    "CAESB0VnTUkwZ1k=",
    "CAESB0VnTUkzQVk=",
    "CAESB0VnTUk1Z1k=",
    "CAESB0VnTUk4QVk=",
    "CAESB0VnTUktZ1k=",
    "CAESB0VnTUloQWM=",
    "CAESB0VnTUlqZ2M=",
    "CAESB0VnTUltQWM=",
    "CAESB0VnTUlvZ2M=",
    "CAESB0VnTUlyQWM=",
    "CAESB0VnTUl0Z2M=",
    "CAESB0VnTUl3QWM=",
    "CAESB0VnTUl5Z2M=",
    "CAESB0VnTUkxQWM=",
    "CAESB0VnTUkzZ2M=",
    "CAESB0VnTUk2QWM="
];