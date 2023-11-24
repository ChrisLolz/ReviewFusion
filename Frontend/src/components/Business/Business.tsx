import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import restaurantService from '../../services/restaurant';
import './Business.css';

const Business = () => {
    const id = useParams().id ?? "";

    const {data, isLoading, error} = useQuery(
        ['business', id],
        () => restaurantService.getBusiness(id),
        { staleTime: Infinity, retry: false, refetchOnReconnect: false, refetchOnWindowFocus: false, refetchOnMount: false }
    );

    const {data: reviews, isLoading: isLoadingReviews, error: errorReviews} = useQuery(
        ['reviews', id],
        () => restaurantService.getReviews(id),
        { staleTime: Infinity, retry: false, refetchOnReconnect: false, refetchOnWindowFocus: false, refetchOnMount: false }
    );

    return (
        <main id="business">
            {isLoading && <div>Loading...</div>}
            {error instanceof Error && <div>Error: something went wrong</div>}
            {data && <div>
                <div id="images">
                    {data.images.map((image) => <img key={image} src={image} />)}
                </div>
                <div id='title'>
                        <h1>{data.name}</h1>
                        <div>
                            <div className='stars'>
                                <div className='empty-stars'/>
                                <div className='full-stars' style={{width: `${data.rating / 5 * 100}%`}}/>
                            </div>
                            <span className="average"> {data.rating} &#40;{data.review_count} reviews&#41;</span>
                        </div>
                        <div className='price'>{data.price} {data.categories.map((category, index) => (
                        <span key={index} className='category'> &#8226; {category}</span>
                        ))}</div>
                </div>
                <div>
                    <p>Phone: {data.phone}</p>
                    <p>Address: {data.address}</p>
                </div>
            </div>}
            <div id="reviews">
                <h2>Reviews</h2>
                {isLoadingReviews && <div>Loading...</div>}\
                {errorReviews instanceof Error && <div>Error: something went wrong</div>}
                {reviews && <ul>
                    {reviews.map((review) => <li key={review.id}>
                        <div className='review'>
                            <div className='review-header'>
                                <div className='review-name'>{review.name}</div>
                                <div className='review-date'>{review.date}</div>
                            </div>
                            <div className='review-stars'>
                                <div className='empty-stars'/>
                                <div className='full-stars' style={{width: `${review.rating / 5 * 100}%`}}/>
                            </div>
                            <div className='review-text'>{review.comment}</div>
                        </div>
                    </li>)}
                </ul>}
            </div>
        </main>
    )
};

export default Business