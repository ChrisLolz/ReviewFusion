import { Link, useLocation } from 'react-router-dom'
import SearchBar from '../SearchBar/SearchBar';
import './Header.css'

const Header = () => {
    const url = useLocation();

    return (
        <header>
            <h1><Link to="/">Review-Fusion</Link></h1>
            {url.pathname === '/search' && <SearchBar/>}
            <nav>
                <button type='button' id='sign-in'>Sign in</button>
                <button type='button' id='sign-up'>Sign up</button>
            </nav>
        </header>
    )
}

export default Header