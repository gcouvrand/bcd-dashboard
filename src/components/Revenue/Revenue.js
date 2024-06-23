import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import 'tailwindcss/tailwind.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Enregistrer les composants nécessaires de Chart.js
Chart.register(...registerables);

function Revenue() {
    const [invoices, setInvoices] = useState([]);
    const [estimatedInvoices, setEstimatedInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchInvoices();
        fetchEstimatedInvoices();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('https://bcd-backend-1ba2057cf6f6.herokuapp.com/completedSales');
            setInvoices(response.data);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setError('Erreur lors de la récupération des factures.');
        }
        setLoading(false);
    };

    const fetchEstimatedInvoices = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get('https://bcd-backend-1ba2057cf6f6.herokuapp.com/estimatedRevenue');
            setEstimatedInvoices(response.data);
        } catch (error) {
            console.error('Error fetching estimated invoices:', error);
            setError('Erreur lors de la récupération des factures estimées.');
        }
        setLoading(false);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString + '-01');
        return format(date, 'LLLL yyyy', { locale: fr });
    };

    const getRevenueByMonth = (invoices) => {
        const revenueByMonth = invoices.reduce((acc, invoice) => {
            const date = new Date(invoice.usedDate || invoice.createdAt);
            const month = format(date, 'yyyy-MM');
            acc[month] = (acc[month] || 0) + (invoice.cartTotal || 0);
            return acc;
        }, {});
        return Object.entries(revenueByMonth).sort(([a], [b]) => new Date(a) - new Date(b));
    };

    const getEstimatedRevenueByMonth = (invoices) => {
        const revenueByMonth = invoices.reduce((acc, invoice) => {
            const date = new Date(invoice.deliverySlot.date);
            const month = format(date, 'yyyy-MM');
            acc[month] = (acc[month] || 0) + (invoice.cartTotal || 0);
            return acc;
        }, {});
        return Object.entries(revenueByMonth).sort(([a], [b]) => new Date(a) - new Date(b));
    };

    const getChartData = () => {
        const revenueByMonth = getRevenueByMonth(invoices);
        const estimatedRevenueByMonth = getEstimatedRevenueByMonth(estimatedInvoices);

        const labels = [...new Set([...revenueByMonth.map(([month]) => month), ...estimatedRevenueByMonth.map(([month]) => month)])].sort((a, b) => new Date(a) - new Date(b));

        const actualData = labels.map(label => {
            const data = revenueByMonth.find(([month]) => month === label);
            return data ? data[1] : null;
        });

        const estimatedData = labels.map(label => {
            const data = estimatedRevenueByMonth.find(([month]) => month === label);
            return data ? data[1] : null;
        });

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Chiffre d\'affaires',
                    data: actualData,
                    fill: false,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.1,
                    spanGaps: true
                },
                {
                    label: 'Chiffre d\'affaires estimé',
                    data: estimatedData,
                    fill: false,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderDash: [5, 5],
                    tension: 0.1,
                    spanGaps: true
                }
            ]
        };
    };

    return (
        <div className="p-6 bg-gray-100 min-h-screen">
            <h1 className="text-3xl font-bold text-gray-800 mb-6">Chiffre d'affaires</h1>
            {loading ? (
                <p className="text-center text-gray-500">Chargement...</p>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Chiffre d'affaires par mois</h3>
                        <ul>
                            {getRevenueByMonth(invoices).map(([month, revenue]) => (
                                <li key={month} className="flex justify-between items-center py-2">
                                    <span className="text-gray-700 font-medium">{formatDate(month)}</span>
                                    <span className="text-green-600 font-bold">{revenue.toFixed(2)} €</span>
                                </li>
                            ))}
                        </ul>
                        <h3 className="text-xl font-bold text-gray-800 mb-4 mt-6">Chiffre d'affaires estimé par mois</h3>
                        <ul>
                            {getEstimatedRevenueByMonth(estimatedInvoices).map(([month, revenue]) => (
                                <li key={month} className="flex justify-between items-center py-2">
                                    <span className="text-gray-700 font-medium">{formatDate(month)}</span>
                                    <span className="text-red-600 font-bold">{revenue.toFixed(2)} €</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-lg">
                        <h3 className="text-xl font-bold text-gray-800 mb-4">Évolution du chiffre d'affaires</h3>
                        <Line data={getChartData()} />
                    </div>
                </div>
            )}
        </div>
    );
}

export default Revenue;
