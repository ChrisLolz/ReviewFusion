import './Homepage.css'

const Homepage = () => {
    return(
        <main>
            <h2>View restaurant reviews from multiple sources in one search</h2>
            <div id='search-bar'>
                <input id='restaurant' type='text' placeholder='Restaurants'/>
                <input id='location' type='text' placeholder='Location'/>
                <button id='search-button'>Search</button>
            </div>
        </main>
    )
}

export default Homepage