import './Result.css'

interface Business {
    id: string,
    name: string,
    image_url: string,
    rating: number,
    price: string,
    location: {
        display_address: string[],
    },
    distance: number,
    googleRating: number,
    tripAdvisorRating: number
}

const Result = ( { business }: {business: Business} ) => {
    return (
        <li className='result'>
            <img src={business.image_url} alt={business.name} />
            <div className='businessContent'>
                <h3>{business.name}</h3>
                <div className='rating'>
                    <div className='yelpRating'>Yelp: {business.rating} stars</div>
                    {business.googleRating && <div className='googleRating'>Google: {business.googleRating} stars</div>}
                    {business.tripAdvisorRating && <div className='tripAdvisorRating'>TripAdvisor: {business.tripAdvisorRating} stars</div>}
                </div>
                <div className='price'>{business.price}</div>
                <div className='location'>{business.location.display_address.join(', ')}</div>
                <div className='distance'>{(business.distance / 1609.344).toFixed(2)} miles</div>
            </div>
        </li>
    )
}

export default Result