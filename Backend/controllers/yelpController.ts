import 'dotenv/config';

const options = {
    method: 'GET',
    headers: {
        accept: 'application/json',
        'Authorization': 'Bearer ' + process.env.YELP_API_KEY
    }
};

const api = "https://api.yelp.com/v3";

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

export const getReviews = async (id: string) => {
    const url = "https://www.yelp.com/biz/"+id+"/review_feed?rl=en&q=&sort_by=relevance_desc&start=";
    const response = await fetch(url+"0", {
        headers: {
            "Accept-Encoding": "*",
        }
    }); 
    const data = (await response.json()) as yelpApi;
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
    return reviews;
};

export interface businessParams {
    name: string;
    address1: string;
    city: string;
    state: string;
    country: string;
}

interface Business {
    id: string;
    alias: string;
    name: string;
}

interface BusinessesResponse {
    businesses: Business[];
}


export const getBusinessID = async (params: businessParams) => {
    params.address1 = params.address1.replace(" ", "%20");
    params.city = params.city.replace(" ", "%20");
    const url = api+"/businesses/matches?name="+params.name+"&address1="+params.address1+"&city="+params.city+"&state="+params.state+"&country="+params.country;
    const response = await fetch(url, options);
    const data = await response.json() as BusinessesResponse;
    return data.businesses[0].id;
};