const baseURL = 'http://localhost:3000/api/business';

interface data {
    businesses: BusinessResult[],
    total: number
}

interface BusinessResult {
    id: string,
    name: string,
    image_url: string,
    rating: number,
    review_count: number,
    price: string,
    location: {
        display_address: string[],
    },
    categories: {
        alias: string,
        title: string,
    }[],
    phone: string,
    distance: number,
    ratings: Record<string, {rating: number, count: number}>;
}

interface Business {
    lastUpdated: Date;
    yelpId: string;
    name: string;
    address: string;
    city: string;
    image: string;
    images: string[];
    rating: number;
    review_count: number;
    price: string;
    phone: string;
    categories: string[];
    ratings: Record<string, {rating: number, count: number}>
}

interface Review {
    id: string;
    source: string;
    name: string;
    date: string;
    business: string;
    rating: number;
    comment: string;
}

const getBusinesses = async (name: string | null, location: string | null, longitude: number | null, latitude: number | null, offset: number) => {
    const res = await fetch(baseURL+`/search?name=${name}&location=${location}&longitude=${longitude}&latitude=${latitude}&offset=${offset}`, {method: 'POST'});
    return await res.json() as data;
}

const getBusiness = async (id: string) => {
    await fetch(baseURL+`/${id}`, {method: 'POST'}) //add extra info to business
    const res = await fetch(baseURL+`/${id}`); //then send the business info
    return await res.json() as Business;
}

const getReviews = async (id: string): Promise<Review[]> => {
    const res = await fetch(baseURL+`/${id}/reviews`);
    return await res.json() as Review[];
}

export default { getBusinesses, getBusiness, getReviews };