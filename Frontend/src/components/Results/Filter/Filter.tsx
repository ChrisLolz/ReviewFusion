import './Filter.css'

const Filter = () => {
    return (
        <aside>
            <article id="price">
                <span>💰Price</span>
                <div id="price-buttons">
                    <button>$</button>
                    <button>$$</button>
                    <button>$$$</button>
                    <button>$$$$</button>
                </div>
            </article>
        </aside>
    );
}

export default Filter;