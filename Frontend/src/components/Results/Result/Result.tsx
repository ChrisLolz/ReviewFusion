import './Result.css'

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
    distance: number,
    ratings: Record<string, {rating: number, count: number}>;
}

const Result = ( { business }: {business: Business} ) => {

    return (
        <li className='result'>
            <img src={business.image_url} alt={business.name} />
            <div className='businessContent'>
                <h3>{business.name}</h3>
                <div className='rating'>
                    <div className='stars'>
                        <div className='empty-stars'/>
                        <div className='full-stars' style={{width: `${business.rating / 5 * 100}%`}}/>
                    </div>
                    <div className="average"> Average: {business.rating} stars</div>
                    <div className='yelp-rating'>Yelp: {business.ratings.Yelp.rating} stars &#40;{business.ratings.Yelp.count}&#41;</div>
                    {business.ratings.Google && <div className='google-rating'>Google: {business.ratings.Google.rating} stars &#40;{business.ratings.Google.count}&#41;</div>}
                    {business.ratings.Tripadvisor && <div className='tripadvisor-rating'>TripAdvisor: {business.ratings.Tripadvisor.rating} stars &#40;{business.ratings.Tripadvisor.count}&#41;</div>}
                </div>
                <div className='price'>{business.price}</div>
                <div className='location'>{business.location.display_address.join(', ')}</div>
                <div className='distance'>{(business.distance / 1609.344).toFixed(2)} miles</div>
            </div>
        </li>
    )
}

export default Result