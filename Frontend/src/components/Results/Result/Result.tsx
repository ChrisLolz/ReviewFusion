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
    categories: {
        alias: string,
        title: string,
    }[],
    distance: number,
    ratings: Record<string, {rating: number, count: number}>;
}

const Result = ( { business }: {business: Business} ) => {

    return (
        <li className='result'>
            <img src={business.image_url} alt={business.name} />
            <div className='business-content'>
                <h3>{business.name}</h3>
                <div className='rating'>
                    <div>
                        <div className='stars'>
                            <div className='empty-stars'/>
                            <div className='full-stars' style={{width: `${business.rating / 5 * 100}%`}}/>
                        </div>
                        <span className="average"> {business.rating} &#40;{business.review_count}&#41;</span>
                    </div>
                    <div className='price'>{business.price} {business.categories.map((category, index) => (
                        <span key={index} className='category'> &#8226; {category.title}</span>
                    ))}</div>
                    <div className='source'>
                        <img src='https://i.imgur.com/gF0P3T4.png'/> 
                        {business.ratings.Yelp.rating} &#40;{business.ratings.Yelp.count}&#41;
                    </div>
                    {business.ratings.Google && <div className='source'> 
                        <img src='https://i.imgur.com/9DLbDnw.png'/>{business.ratings.Google.rating} &#40;{business.ratings.Google.count}&#41;
                    </div>}
                    {business.ratings.Tripadvisor && <div className='source'>
                        <img src='https://i.imgur.com/5dzgYPt.png'/>
                        {business.ratings.Tripadvisor.rating} &#40;{business.ratings.Tripadvisor.count}&#41;
                    </div>}
                </div>
                <div className='location'>{business.location.display_address.join(', ')}</div>
            </div>
        </li>
    )
}

export default Result