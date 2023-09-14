const baseURL = 'http://localhost:3000/api/business';

interface data {
    businesses: Business[],
    total: number
}

interface Business {
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
    distance: number,
    ratings: Record<string, {rating: number, count: number}>;
}

const getBusinesses = async (name: string | null, location: string | null, longitude: number | null, latitude: number | null, offset: number) => {
    const res = await fetch(baseURL+`/search?name=${name}&location=${location}&longitude=${longitude}&latitude=${latitude}&offset=${offset}`);
    return await res.json() as data;
}

export default { getBusinesses }