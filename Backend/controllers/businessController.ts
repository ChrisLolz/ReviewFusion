import { Request, Response } from 'express';
import Business from '../models/business';
import Review from '../models/review';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import mongoose from 'mongoose';
import randUserAgent from 'rand-user-agent';

puppeteer.use(StealthPlugin());

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
    id: string,
    name: string,
    image_url: string,
    photos: string[],
    rating: number,
    review_count: number,
    price: string,
    location: {
        display_address: string[]
        address1: string;
        city: string;
    },
    categories: {
        alias: string,
        title: string,
    }[],
    display_phone: string,
    ratings: Record<string, {rating: number, count: number}>,
}

interface YelpResponse {
    businesses: YelpBusiness[],
    total: number,
}

interface yelpApi {
    pagination: {
        resultsPerPage: number;
        startResult: number;
        totalResults: number;
    }
    reviews: yelpReview[];
}

interface yelpReview {
    id: string;
    user: {
        markupDisplayName: string;
    }
    comment: {
        text: string;
    }
    localizedDate: string;
    rating: number;
    photos: {
        src: string;
        link: string;
        altText: string;
        caption: string;
    }[]
}

export const search = async (req: Request<unknown, unknown, unknown, {name: string, longitude: number, latitude: number, location: number, offset: number}>, res: Response) => {
    const name = req.query.name;
    const longitude = req.query.longitude || "";
    const latitude = req.query.latitude || "";
    const location = req.query.location || "";
    const offset = req.query.offset > 990 ? 990 : req.query.offset;
    const response = await axios.get<YelpResponse>(api+`/businesses/search?locale=en_CA&location=${location}&longitude=${longitude}&latitude=${latitude}&term=${name}&sort_by=best_match&limit=10&offset=${offset}`, options);
    for (let i=0; i<response.data.businesses.length; i++) {
        const business = response.data.businesses[i];
        const databaseBusiness = await Business.findOne({yelpId: business.id});
        if (databaseBusiness && (Date.now() - databaseBusiness.lastUpdated.getTime()) < 604800000) {
            business.id = databaseBusiness._id.toString();
            business.rating = databaseBusiness.rating;
            business.review_count = databaseBusiness.review_count;
            business.ratings = databaseBusiness.ratings;
        } else {
            const newBusiness = await Business.findById(databaseBusiness?._id) ?? await addBusiness(business);
            newBusiness.lastUpdated = new Date();
            business.id = newBusiness._id.toString();
            business.ratings = { Yelp: {rating: business.rating, count: business.review_count} };
            newBusiness.ratings = { Yelp: {rating: business.rating, count: business.review_count} };

            const search = await axios.get<string>(`https://google.com/search?q=${business.name.replace('&', 'and')} ${business.location.address1}&num=20&gbv=1`, {
                headers: {
                    'Accept-Encoding': 'gzip, deflate, br',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
                    'Language': 'en-US,en;q=0.9'
                }
            });
            const $ = cheerio.load(search.data);

            if (Number($('div.BNeawe.tAd8D.AP7Wnd span.oqSTJd').text()) !== 0) {
                const rating = Number($('div.BNeawe.tAd8D.AP7Wnd span.oqSTJd').text());
                const count = Number($('div.BNeawe.tAd8D.AP7Wnd span:nth-child(6)').text().replace(/[^0-9]/g, ''));
                business.ratings.Google = { rating: rating, count: count };
                newBusiness.ratings.Google = { rating: rating, count: count };
            }

            $('div.Gx5Zad.fP1Qef.xpd.EtOod.pkphOe').each((i, el) => {
                if ($(el).find('a').attr('href')?.includes('/Restaurant_Review')) {
                    if (Number($(el).find('span.oqSTJd').text()) !== 0) {
                        const rating = Number($(el).find('span.oqSTJd').text());
                        const count = Number($(el).find('span:nth-child(6)').text().replace(/[^0-9]/g, ''));
                        business.ratings.Tripadvisor = { rating: rating, count: count };
                        newBusiness.ratings.Tripadvisor = { rating: rating, count: count };
                    }
                }
            });
            business.review_count = Object.values(business.ratings).reduce((acc, key) => acc + key.count, 0);
            business.rating = Number(Object.values(business.ratings).reduce((acc, key) => acc + key.rating * key.count, 0) / business.review_count);
            business.rating = Math.round(business.rating * 10) / 10;
            newBusiness.rating = business.rating;
            newBusiness.review_count = business.review_count;
            newBusiness.categories = business.categories.map(category => category.title);
            await newBusiness.save();
            //Google search is done synchronously and is delayed to avoid getting blocked
            setTimeout(() => {}, Math.random() * (5000-3000+1) + 3000);
        }
    }
    response.data.total = response.data.total > 990 ? 990 : response.data.total;
    res.status(201).json(response.data);
};

export const addBusinessDetails = async (req: Request, res: Response) => {
    const business = await Business.findById(req.params.id);
    if (business === null) {
        res.status(404).end();
        return;
    }
    if (business.images.length > 0) { //Don't need to add images if they already exist
        res.status(201).end();
        return;
    }
    const response = await axios.get<YelpBusiness>(api+`/businesses/${business.yelpId}`, options);
    business.images.push(...response.data.photos);
    await business.save();
    res.status(201).end();
};

export const getBusinesses =  async (req: Request, res: Response) => {
    const businesses = await Business.find({});
    res.status(200).json(businesses);
};

export const getAllReviews = async (req: Request, res: Response) => {
    const source = req.query.source;
    const query = source ? {source: source} : {};
    const reviews = await Review.find(query);
    res.status(200).json(reviews);
};

export const getBusinessById = async (req: Request, res: Response) => {
    const business = await Business.findById(req.params.id);
    res.status(200).json(business);
};

export const getReviewsById = async (req: Request, res: Response) => {
    const source = req.query.source;
    const query = source ? {business: req.params.id, source: source} : {business: req.params.id};
    const reviews = await Review.find(query);
    res.status(200).json(reviews);
};

export const getRatings = async (req: Request, res: Response) => {
    const source = req.query.source;
    const query = source ? {"_id": req.params.id, "ratings.source": source} : {"_id": req.params.id};
    const property = source ? {"ratings.$": 1} : {"ratings": 1};
    const business = await Business.find(query, property);
    res.status(200).json(business);
};

export const getAverageRating = async (req: Request, res: Response) => {
    const businessId = new mongoose.Types.ObjectId(req.params.id);
    const average = await Business.aggregate([
        {$match: {"_id": businessId}},
        {$unwind: "$ratings"},
        {$group: {
            _id: "$_id", 
            average: {$avg: "$ratings.rating"}
        }}
    ]);
    res.status(200).json(average[0].average);
};

export const addReviews = async (req: Request, res: Response) => {
    const business = await Business.findById(req.params.id);
    if (business === null) {
        res.status(404).end();
        return;
    }
    const requests = [];
    requests.push(addYelpBusiness(business?.yelpId, req.params.id));
    requests.push(addGoogleBusiness(req.params.id));
    requests.push(addTripAdvisorBusiness(req.params.id));
    await Promise.all(requests);
    res.status(201).end();
};

const addBusiness = async (yelpBusiness: YelpBusiness) => {
    const business = new Business({
        lastUpdated: new Date(),
        yelpId: yelpBusiness.id,
        name: yelpBusiness.name,
        address: yelpBusiness.location.address1,
        city: yelpBusiness.location.city,
        image: yelpBusiness.image_url,
        price: yelpBusiness.price,
        phone: yelpBusiness.display_phone,
    });
    await business.save();
    return business;
};

const addYelpBusiness = async (yelpID: string, mongoID: string) => {
    const business =  await Business.findById(mongoID);
    if (business === null) {
        return;
    }
    const url = "https://www.yelp.com/biz/"+yelpID+"/review_feed?rl=en&q=&sort_by=date_desc&start=";
    const response = await axios.get<yelpApi>(url+"0", {
        headers: {
            "Accept": "application/json",
            "Accept-Encoding": "gzip, deflate, br",
            "Accept-Language": "en-US,en;q=0.9",
            'User-Agent': randUserAgent('desktop')
        }
    });
    const data = response.data;
    const totalReviews = data.pagination.totalResults > 300 ? 300 : data.pagination.totalResults;
    const requests = [];
    for (let i = 0; i < Math.ceil(totalReviews/10); i++) {
        const promise = (async () => {
            const response = await axios<yelpApi>(url+i*10, {
                headers: {
                "Accept": "application/json",
                "Accept-Encoding": "gzip, deflate, br",
                "Accept-Language": "en-US,en;q=0.9",
                'User-Agent': randUserAgent('desktop')
                }
            });
            for (const review of response.data.reviews) {
                const newReview = new Review({
                    source: "Yelp",
                    name: review.user.markupDisplayName,
                    date: review.localizedDate,
                    business: business._id,
                    rating: review.rating,
                    comment: review.comment.text.replace(/\s*<br\s*\/?>\s*/g, '\n')
                });
                await newReview.save();
                business.reviews.push(newReview._id);
            }
        })();
        requests.push(promise);
    }
    await Promise.all(requests);
    const reviews = await Review.find({business: business._id, source: "Yelp"});
    const rating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    business.ratings.Yelp = {rating: rating, count: reviews.length};
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
    if (reviewCount > 300) {
        reviewCount = 300;
    }
    const requests = [];
    for (let i = 0; i < Math.ceil(reviewCount/10); i++) {
        const promise = (async () => {
            const response = await axios.get<string>(`https://www.google.com/async/reviewDialog?async=feature_id:${featureID},review_source:All%20reviews,sort_by:newestFirst,is_owner:false,filter_text:,associated_topic:,next_page_token:${nextPageTokens[i]},async_id_prefix:,_pms:s,_fmt:pc`, {
                headers: {
                    "Accept-Encoding": "gzip, deflate, br",
                    'User-Agent': randUserAgent('desktop')
                }
            });
            const $ = cheerio.load(response.data);
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
                const relativeDate = $(review).find('.dehysf').html() || "";
                const now = new Date();
                const matches = relativeDate.match(/(\w+)\s*(\w+)\s+ago/);
                if (matches) {
                    const quantity = isNaN(parseInt(matches[1])) ? 1 : parseInt(matches[1]);
                    const unit = matches[2];
                    if (unit.includes("second")) {
                        now.setSeconds(now.getSeconds() - quantity);
                    } else if (unit.includes("minute")) {
                        now.setMinutes(now.getMinutes() - quantity);
                    } else if (unit.includes("hour")) {
                        now.setHours(now.getHours() - quantity);
                    } else if (unit.includes("day")) {
                        now.setDate(now.getDate() - quantity);
                    } else if (unit.includes("week")) {
                        now.setDate(now.getDate() - quantity * 7);
                    }
                }
                const timeAgo = now.toLocaleDateString('en-US', {year: '2-digit', month: '2-digit', day: '2-digit'});
                const newReview = new Review({
                    source: "Google",
                    name: $(review).find('div[class="TSUbDb"]').text(),
                    date: timeAgo,
                    business: business._id,
                    rating: $(review).find('span[class="lTi8oc z3HNkc"]').attr('aria-label')?.split(" ")[1] || "",
                    comment: comment.replace(/\s*<br\s*\/?>\s*/g, '\n')
                });
                business.reviews.push(newReview._id);
                return newReview.save();
            });
            return Promise.all(reviewPromises);
        })();
        requests.push(promise);
    }
    await Promise.all(requests);
    const reviews = await Review.find({business: business._id, source: "Google"});
    const rating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    business.ratings.Google = {rating: rating, count: reviews.length};
    await business.save();
};

export const addTripAdvisorBusiness = async (mongoID: string) => {
    const business = await Business.findById(mongoID);
    if (!business) {
      return;
    }
    let response = await axios.get<string>("https://www.google.com/search?q="+business.name+" "+business.address+" tripadvisor");
    let $ = cheerio.load(response.data);
    const url = $('div.egMi0.kCrYT').find('a').attr('href')?.split('&')[0].slice(7).replace('.html', '');

    response = await axios.get<string>(url+".html", {
        headers: {
            "Accept-Encoding": "gzip, deflate, br",
            'User-Agent': randUserAgent('desktop'),
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://www.tripadvisor.ca',
        }
    });

    $ = cheerio.load(response.data);
    let reviewCount = parseInt($('.item[data-value="en"]').first().find('span.count').text().replace(/[^0-9]/g, ''));
    if (reviewCount > 300) {
        reviewCount = 300;
    }
    const requests = [];
    const reviewIds: string[] = [];
    for (let i=0; i<Math.ceil(reviewCount/15); i++) {
        const promise = (async () => {
            const response = await axios.get<string>(url+"-or"+i*15+".html", {
                headers: {
                    "Accept-Encoding": "gzip, deflate, br",
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://www.tripadvisor.ca',
                }
            });
            const $ = cheerio.load(response.data);
            reviewIds.push(...$('.review-container').toArray().map(review => $(review).attr('data-reviewid') || ""));
        })();
        requests.push(promise);
    }
    await Promise.all(requests);

    const data = "reviews="+reviewIds.map(id => id).join('%2C');
    
    response = await axios.post<string>("https://www.tripadvisor.ca/OverlayWidgetAjax?Mode=EXPANDED_HOTEL_REVIEWS_RESP&metaReferer=Restaurant_Review", data, {
        headers: {
            "Accept-Encoding": "gzip, deflate, br",
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9',
            'Origin': 'https://www.tripadvisor.ca',
        }
    });
    $ = cheerio.load(response.data);
    const reviewDivs = $('.reviewSelector').toArray();
    const reviewPromises = [];
    for (const reviewDiv of reviewDivs) {
        const promise = (async () => {
            let rating = 0;
            if ($(reviewDiv).find('.ui_bubble_rating.bubble_50').length) {
                rating = 5;
            } else if ($(reviewDiv).find('.ui_bubble_rating.bubble_40').length) {
                rating = 4;
            } else if ($(reviewDiv).find('.ui_bubble_rating.bubble_30').length) {
                rating = 3;
            } else if ($(reviewDiv).find('.ui_bubble_rating.bubble_20').length) {
                rating = 2;
            } else if ($(reviewDiv).find('.ui_bubble_rating.bubble_10').length) {
                rating = 1;
            }
            const date = $(reviewDiv).find('.ratingDate').attr('title') || "";
            const newDate = new Date(date).toLocaleDateString('en-US', {year: '2-digit', month: '2-digit', day: '2-digit'});
            const newReview = new Review({
                source: "TripAdvisor",
                name: $(reviewDiv).find('.info_text.pointer_cursor > div:first-child').text(),
                date: newDate,
                business: business._id,
                rating: rating,
                comment: $(reviewDiv).find('.partial_entry').html()?.replace(/\s*<br\s*\/?>\s*/g, '\n')
            });
            business.reviews.push(newReview._id);
            await newReview.save();
        })();
        reviewPromises.push(promise);
    }
    await Promise.all(reviewPromises);
    const reviews = await Review.find({business: business._id, source: "TripAdvisor"});
    const rating = reviews.reduce((acc, review) => acc + review.rating, 0) / reviews.length;
    business.ratings.TripAdvisor = {rating: rating, count: reviews.length};
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