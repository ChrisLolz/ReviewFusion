import './Header.css'

const Header = () => {
    return (
        <header>
            <h1>Review Fusion</h1>
            <nav>
                <button type='button' className='sign-in'>Sign in</button>
                <button type='button' className='sign-up'>Sign up</button>
            </nav>
        </header>
    )
}

export default Header