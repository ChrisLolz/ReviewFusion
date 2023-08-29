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

const Result = ( { business }: {business: Business} ) => {
    return (
        <li>
            <h3>{business.name}</h3>
            <img src={business.image_url} alt={business.name} />
            <p>{business.rating} stars</p>
            <p>{business.price}</p>
            <p>{business.location.display_address.join(', ')}</p>
            <p>{business.distance} meters away</p>
        </li>
    )
}

export default Result