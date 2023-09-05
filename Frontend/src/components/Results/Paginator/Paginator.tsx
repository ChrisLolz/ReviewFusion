import { useSearchParams } from 'react-router-dom';
import './Paginator.css';

const Paginator = ( { total }: {total: number} ) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const offset = Number(searchParams.get('offset'));

    const handlePage = (move: number) => () => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('offset', String(offset + move));
        setSearchParams(newSearchParams);
    }

    const handleLast = () => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('offset', String(total));
        setSearchParams(newSearchParams);
    }

    const handleFirst = () => {
        const newSearchParams = new URLSearchParams(searchParams.toString());
        newSearchParams.set('offset', String(0));
        setSearchParams(newSearchParams);
    }

    return (
        <div id='paginator'>
            <button className="first-last" onClick={handleFirst}>&laquo;</button>
            {offset >= 20 && <button id="skip-prev-page" onClick={handlePage(-20)}>{offset / 10 - 1}</button>}
            {offset >= 10 && <button id="prev-page" onClick={handlePage(-10)}>{offset / 10}</button>}
            <button id="current-page">{offset / 10 + 1}</button>
            {offset < total - 10 && <button id="next-page" onClick={handlePage(10)}>{offset / 10 + 2}</button>}
            {offset < total - 20 && <button id="skip-next-page" onClick={handlePage(20)}>{offset / 10 + 3}</button>}
            <button className="first-last" onClick={handleLast}>&raquo;</button>
        </div>
    )
}

export default Paginator