const baseURL = 'http://localhost:3000/api/business';

interface data {
    businesses: Business[]
}

interface Business {
    id: string,
    name: string,
    image_url: string,
    rating: number,
    price: string,
    location: {
        display_address: string[],
    },
    distance: number
}

const getBusinesses = async (name: string | null, location: string | null, longitude: number | null, latitude: number | null) => {
    if (location === null) {
        const res = await fetch(baseURL+`/search?name=${name}&longitude=${longitude}&latitude=${latitude}`);
        return await res.json() as data;
    } else {
        const res = await fetch(baseURL+`/search?name=${name}&location=${location}`);
        return await res.json() as data;
    }
}

export default { getBusinesses }