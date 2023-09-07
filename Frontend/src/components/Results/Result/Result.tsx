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
    ratings: Record<string, number>;
}

const Result = ( { business }: {business: Business} ) => {
    return (
        <li className='result'>
            <img src={business.image_url} alt={business.name} />
            <div className='businessContent'>
                <h3>{business.name}</h3>
                <div className='rating'>
                    <div id="rating"> Average: {business.rating} stars</div>
                    <div id='yelp-rating'>Yelp: {business.ratings.Yelp} stars</div>
                    {business.ratings.Google && <div id='google-rating'>Google: {business.ratings.Google} stars</div>}
                    {business.ratings.Tripadvisor && <div id='tripadvisor-rating'>TripAdvisor: {business.ratings.Tripadvisor} stars</div>}
                </div>
                <div className='price'>{business.price}</div>
                <div className='location'>{business.location.display_address.join(', ')}</div>
                <div className='distance'>{(business.distance / 1609.344).toFixed(2)} miles</div>
            </div>
        </li>
    )
}

export default Result