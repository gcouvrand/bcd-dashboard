import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import 'tailwindcss/tailwind.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Enregistrer les composants nécessaires de Chart.js
Chart.register(...registerables);

function Revenue() {
    const [invoices, setInvoices] = useState([]);
    const [estimatedInvoices, setEstimatedInvoices] = useState([]);
    const [annualRevenue, setAnnualRevenue] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const previousYearRevenue = {
        '2023-04': 72817.29,
        '2023-05': 94166.61,
        '2023-06': 100607.28,
        '2023-07': 54228.63,
        '2023-08': 121503.56,
        '2023-09': 70011.28,
        '2023-10': 118639.63,
        '2023-11': 106669.95,
        '2023-12': 48849.40,
        '2024-01': 73756.19,
        '2024-02': 21476.45,
    };

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
            calculateAnnualRevenue(response.data);
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

    const calculateAnnualRevenue = (invoices) => {
        const startDate = new Date(new Date().getFullYear(), 3, 1); // 1er avril de l'année en cours
        const endDate = new Date(new Date().getFullYear() + 1, 2, 31); // 31 mars de l'année prochaine

        const annualRevenue = invoices.reduce((acc, invoice) => {
            const date = new Date(invoice.usedDate || invoice.createdAt);
            if (date >= startDate && date <= endDate) {
                acc += (invoice.cartTotal || 0);
            }
            return acc;
        }, 0);

        setAnnualRevenue(annualRevenue);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString + '-01');
        return format(date, 'LLLL yyyy', { locale: fr }).replace(/^\w/, (c) => c.toUpperCase());
    };

    const getRevenueByMonth = (invoices) => {
        const revenueByMonth = invoices.reduce((acc, invoice) => {
            const date = new Date(invoice.usedDate || invoice.createdAt);
            const month = format(date, 'yyyy-MM');
            acc[month] = (acc[month] || 0) + (invoice.cartTotal || 0);
            return acc;
        }, {});

        // Ajouter le chiffre en dur pour mars 2024
        const hardcodedMarch2024Revenue = 3789.27; // Remplacer ce chiffre par le montant réel
        if (revenueByMonth['2024-03']) {
            revenueByMonth['2024-03'] += hardcodedMarch2024Revenue;
        } else {
            revenueByMonth['2024-03'] = hardcodedMarch2024Revenue;
        }

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

        const previousYearData = labels.map(label => {
            const previousYearMonth = (parseInt(label.split('-')[0], 10) - 1) + '-' + label.split('-')[1];
            return previousYearRevenue[previousYearMonth] || null;
        });

        return {
            labels: labels.map(label => formatDate(label)),
            datasets: [
                {
                    label: 'Chiffre d\'affaires',
                    data: actualData,
                    backgroundColor: 'rgba(75, 192, 192, 0.6)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Chiffre d\'affaires estimé',
                    data: estimatedData,
                    backgroundColor: 'rgba(153, 102, 255, 0.6)',
                    borderColor: 'rgba(153, 102, 255, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Chiffre d\'affaires précédent',
                    data: previousYearData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                    borderWidth: 1
                }
            ]
        };
    };

    return (
        <div className="p-6 bg-gradient-to-r from-blue-100 to-indigo-100 min-h-screen">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Chiffre d'affaires</h1>
            {loading ? (
                <p className="text-center text-gray-500">Chargement...</p>
            ) : error ? (
                <p className="text-center text-red-500">{error}</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Chiffre d'affaires par mois</h3>
                        <ul>
                            {getRevenueByMonth(invoices).map(([month, revenue]) => (
                                <li key={month} className="flex justify-between items-center py-2 border-b border-gray-200">
                                    <span className="text-gray-800 font-medium">{formatDate(month)}</span>
                                    <span className="text-green-600 font-bold">{revenue.toFixed(2)} €</span>
                                </li>
                            ))}
                        </ul>
                        <h3 className="text-2xl font-bold text-gray-800 mb-4 mt-6">Chiffre d'affaires estimé par mois</h3>
                        <ul>
                            {getEstimatedRevenueByMonth(estimatedInvoices).map(([month, revenue]) => (
                                <li key={month} className="flex justify-between items-center py-2 border-b border-gray-200">
                                    <span className="text-gray-800 font-medium">{formatDate(month)}</span>
                                    <span className="text-red-600 font-bold">{revenue.toFixed(2)} €</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="bg-white p-8 rounded-lg shadow-lg">
                        <h3 className="text-2xl font-bold text-gray-800 mb-4">Évolution du chiffre d'affaires</h3>
                        <Bar data={getChartData()} options={{ scales: { y: { beginAtZero: true } } }} />
                    </div>
                </div>
            )}
            <div className="bg-white p-8 rounded-lg shadow-lg mt-6">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Chiffre d'affaires annuel</h3>
                <p className="text-4xl text-green-600 font-extrabold">{annualRevenue.toFixed(2)} €</p>
            </div>
        </div>
    );
}

export default Revenue;
