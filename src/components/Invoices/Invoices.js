import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import 'tailwindcss/tailwind.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarAlt, faTimes, faSearch, faFileInvoice } from '@fortawesome/free-solid-svg-icons';

function Invoices() {
    const [invoices, setInvoices] = useState([]);
    const [month, setMonth] = useState('');
    const [day, setDay] = useState('');
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // État pour gérer le filtre

    const monthInputRef = useRef(null);
    const dayInputRef = useRef(null);

    useEffect(() => {
        fetchInvoices();
    }, [month, day, searchText, filter]);

    const fetchInvoices = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('https://bcd-backend-1ba2057cf6f6.herokuapp.com/completedSales', {
                params: {
                    month: month,
                    day: day,
                    search: searchText,
                    filter: filter,
                },
            });
            setInvoices(response.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setError('Erreur lors de la récupération des factures.');
        }
        setLoading(false);
    };

    const clearMonth = (e) => {
        e.stopPropagation();
        setMonth('');
    };

    const clearDay = (e) => {
        e.stopPropagation();
        setDay('');
    };

    const clearSearchText = (e) => {
        e.stopPropagation();
        setSearchText('');
    };

    const handleMonthClick = () => {
        if (monthInputRef.current) {
            monthInputRef.current.focus();
            monthInputRef.current.showPicker();
        }
    };

    const handleDayClick = () => {
        if (dayInputRef.current) {
            dayInputRef.current.focus();
            dayInputRef.current.showPicker();
        }
    };

    const handleFilterChange = (newFilter) => {
        setFilter(newFilter);
    };

    return (
        <div className="min-h-screen bg-gradient-to-r from-blue-50 to-indigo-100 p-8">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <label htmlFor="month" className="block text-lg font-medium text-gray-700 mr-4">Mois:</label>
                            <div className="relative flex items-center cursor-pointer w-48">
                                <input
                                    type="month"
                                    id="month"
                                    ref={monthInputRef}
                                    value={month}
                                    onChange={(e) => setMonth(e.target.value)}
                                    className="p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    onClick={handleMonthClick}
                                />
                                <FontAwesomeIcon icon={faCalendarAlt} className="absolute right-3 text-gray-400 pointer-events-none" />
                                {month && (
                                    <button
                                        onClick={clearMonth}
                                        className="absolute right-8 text-gray-400"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center">
                            <label htmlFor="day" className="block text-lg font-medium text-gray-700 mr-5">Jour:</label>
                            <div className="relative flex items-center cursor-pointer w-48">
                                <input
                                    type="date"
                                    id="day"
                                    ref={dayInputRef}
                                    value={day}
                                    onChange={(e) => setDay(e.target.value)}
                                    className="p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    onClick={handleDayClick}
                                />
                                <FontAwesomeIcon icon={faCalendarAlt} className="absolute right-3 text-gray-400 pointer-events-none" />
                                {day && (
                                    <button
                                        onClick={clearDay}
                                        className="absolute right-8 text-gray-400"
                                    >
                                        <FontAwesomeIcon icon={faTimes} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center mb-4">
                        <label htmlFor="searchText" className="block text-lg font-medium text-gray-700 mr-4">Recherche par nom:</label>
                        <div className="relative flex items-center w-80">
                            <input
                                type="text"
                                id="searchText"
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="Entrez le nom du client"
                                className="p-2 block w-full border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                            <FontAwesomeIcon icon={faSearch} className="absolute right-3 text-gray-400 pointer-events-none" />
                            {searchText && (
                                <button
                                    onClick={clearSearchText}
                                    className="absolute right-8 text-gray-400"
                                >
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="flex justify-center mb-4">
                        <button onClick={() => handleFilterChange('all')} className={`px-4 py-2 mr-2 rounded ${filter === 'all' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700'}`}>Tout</button>
                        <button onClick={() => handleFilterChange('completedDeliveries')} className={`px-4 py-2 mr-2 rounded ${filter === 'completedDeliveries' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700'}`}>Livraisons</button>
                        <button onClick={() => handleFilterChange('completedSweepings')} className={`px-4 py-2 mr-2 rounded ${filter === 'completedSweepings' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700'}`}>Ramonages</button>
                        <button onClick={() => handleFilterChange('completedSales')} className={`px-4 py-2 rounded ${filter === 'completedSales' ? 'bg-indigo-500 text-white' : 'bg-white text-gray-700'}`}>Dépôts</button>
                    </div>
                </div>
                {loading ? (
                    <p className="text-center text-gray-500">Chargement...</p>
                ) : error ? (
                    <p className="text-center text-red-500">{error}</p>
                ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {invoices.length > 0 ? (
                            invoices.map((invoice, index) => (
                                <div key={index} className="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-xl font-bold text-gray-800">{invoice.invoiceNumber}</h3>
                                        <a href={invoice.invoiceURL} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:text-indigo-900">Voir la facture</a>
                                    </div>
                                    <div className="border-t border-gray-200 mt-2 pt-4">
                                        <p className="text-gray-600 mb-2"><strong>Date:</strong> {new Date(invoice.usedDate).toLocaleDateString()}</p>
                                        <p className="text-gray-600 mb-2"><strong>Client:</strong> {invoice.prenom} {invoice.nom}</p>
                                        <p className="text-gray-600 mb-2"><strong>Total payé:</strong> {invoice.cartTotal} €</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500">Aucune facture trouvée pour ce mois.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Invoices;
