import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Result from './Result/Result';
import restaurantService from '../../services/restaurant';

const Results = () => {
    const [searchParams] = useSearchParams();
    const name = searchParams.get('name');
    const location = searchParams.get('location');
    const longitude = Number(searchParams.get('longitude'));
    const latitude = Number(searchParams.get('latitude'));
    const { data, isLoading, error } = useQuery(
        ['businesses', name, location, longitude, latitude], 
        () => restaurantService.getBusinesses(name, location, longitude, latitude),
        { staleTime: Infinity}
    );

    if (isLoading) {
        return <div>Loading...</div>
    } else if (error) {
        return <div>Something went wrong...</div>
    }

    return (
        <main>
            <h2>Results</h2>
            <ul>
                {data?.businesses.map((business) => <Result key={business.id} business={business} />)}
            </ul>
        </main> 
    )
}

export default Results