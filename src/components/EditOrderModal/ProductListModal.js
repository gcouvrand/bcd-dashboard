import React, { useEffect, useState } from 'react';
import axios from 'axios';

const ProductListModal = ({ onClose, onAdd }) => {
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await axios.get('https://bcd-backend-1ba2057cf6f6.herokuapp.com/products');
                const filteredProducts = response.data.filter(product => product.type !== "ramonage");
                setProducts(filteredProducts);
            } catch (error) {
                console.error('Error fetching products:', error);
            }
        };

        fetchProducts();
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-auto">
            <div className="bg-gray-900 p-6 rounded-lg shadow-xl text-white w-full max-w-2xl space-y-4">
                <h4 className="text-xl font-semibold mb-4">Ajouter un article</h4>
                <div className="max-h-80 overflow-y-auto">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="flex justify-between items-center p-2 bg-gray-800 rounded mb-2 cursor-pointer"
                            onClick={() => onAdd(product)}
                        >
                            <div>
                                <h5 className="font-semibold">{product.name}</h5>
                                <p className="text-sm text-gray-400">{product.price} €</p>
                            </div>
                            <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-1 px-3 rounded transition duration-300 ease-in-out">
                                Ajouter
                            </button>
                        </div>
                    ))}
                </div>
                <button
                    onClick={onClose}
                    className="bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded transition duration-300 ease-in-out w-full"
                >
                    Fermer
                </button>
            </div>
        </div>
    );
};

export default ProductListModal;
