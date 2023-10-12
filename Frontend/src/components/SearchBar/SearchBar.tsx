import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import './SearchBar.css'

const SearchBar = () => {
    const navigate = useNavigate();
    const url = useLocation();
    const [searchParams] = useSearchParams();
    const [userCoords, setUserCoords] = useState<{latitude: number, longitude: number } | undefined>(undefined);
    const [location, setLocation] = useState<string>('');
    const [restaurant, setRestaurant] = useState<string>('');

    useEffect(() => {
        if (url.pathname === '/' || url.pathname.includes('/business/')) {
            (async () => {
                const result = await navigator.permissions.query({name:'geolocation'});
                if (result.state === 'denied' || result.state === 'prompt') {
                    const response = await fetch('http://ip-api.com/json/')
                    const data = await response.json() as { lat: number, lon: number, city: string, region: string };
                    setLocation(data.city+", "+data.region);
                }
                const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject);
                });
                if (result.state === 'granted'){
                    setUserCoords(userCoords => ({
                        ...userCoords,
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    }));
                    setLocation("Current Location");
                }
            })().catch((error) => {
                console.log(error);
            });
        } else {
            setLocation(searchParams.get('location') ?? '');
            setRestaurant(searchParams.get('name') ?? '');
            if (searchParams.get('location') === null) {
                setUserCoords(userCoords => ({
                    ...userCoords,
                    latitude: Number(searchParams.get('latitude')),
                    longitude: Number(searchParams.get('longitude')),
                }));
                setLocation('Current Location');
            }
        }
    }, [url.pathname, searchParams]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (location === 'Current Location' && userCoords) {
            navigate(`/search?name=${restaurant}&longitude=${userCoords.longitude}&latitude=${userCoords.latitude}&offset=0`);
        } else {
            navigate(`/search?name=${restaurant}&location=${location}&offset=0`);
        }
    }

    return (
        <form id='search-bar' onSubmit={handleSubmit}>
            <input id='restaurant' 
                type='text' 
                placeholder='Restaurants' 
                autoComplete='off' 
                onFocus={e => {e.target.select()}}
                onChange={e => {setRestaurant(e.target.value)}}
                value={restaurant}
            />
            <input id='location' 
                type='text' 
                placeholder='Location' 
                autoComplete='off' 
                onFocus={e => {e.target.select()}} 
                onChange={e => {setLocation(e.target.value)}} 
                value={location}
            />
            <button id='search-button'>Search</button>
        </form>
    )
}

export default SearchBar