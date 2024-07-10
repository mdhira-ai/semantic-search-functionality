'use client'
import { searchProducts } from '@/utils/mylangchain';
import { useState } from 'react';

export default function Home() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);

    const handleSearch = async () => {
        // try {
        //     const searchResults = await searchProducts(query);
        //     setResults(searchResults.map((result) => ({ ...result })));
        // } catch (error) {
        //     console.error('Error searching products:', error);
        // }
    };

    return (
        <div>
            <h1>Semantic Search</h1>
            <input
                className='text-black'
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products"
            />
            <button onClick={handleSearch}>Search</button>
            <ul>
                {results?.map((result: any) => (
                    <li key={result.id}>
                        <h2>{result.product_name}</h2>
                        <p>{result.description}</p>
                    </li>
                ))}
            </ul>
        </div>
    );
}
