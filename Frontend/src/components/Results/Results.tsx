import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import Result from './Result/Result';
import Filter from './Filter/Filter';
import Paginator from './Paginator/Paginator';
import restaurantService from '../../services/restaurant';
import './Results.css';
import { useEffect } from 'react';

const Results = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const name = searchParams.get('name');
    const location = searchParams.get('location');
    const longitude = Number(searchParams.get('longitude'));
    const latitude = Number(searchParams.get('latitude'));
    const offset = Math.floor(Number(searchParams.get('offset'))/10) * 10;
    
    // Update the offset in the url in case the offset is not a multiple of 10
    useEffect(() => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('offset', String(offset));
        setSearchParams(newSearchParams);
    }, [offset, searchParams, setSearchParams]);

    const { data, isLoading, error } = useQuery(
        ['businesses', name, location, longitude, latitude, offset], 
        () => restaurantService.getBusinesses(name, location, longitude, latitude, offset),
        { staleTime: Infinity, retry: 1 }
    );

    return (
        <main id="results">
            <Filter />
            <section>
                <h2>Results for {location ?? 'Current Location'}</h2>
                {isLoading && <div>Loading...</div>}
                {error instanceof Error && <div>Error: something went wrong</div>}
                {data && <ul>
                    {data.businesses.map((business) => <Result key={business.id} business={business} />)}
                </ul>}
                {data && <Paginator total={data.total}/> }
            </section>
        </main> 
    )
}

export default Results