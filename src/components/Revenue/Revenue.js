import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar } from 'react-chartjs-2';
import { Chart, registerables } from 'chart.js';
import 'tailwindcss/tailwind.css';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FaArrowUp, FaArrowDown, FaInfoCircle } from 'react-icons/fa'; // Pour les icônes


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
        '2024-03': 72817.29
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
        const endDate = new Date(new Date().getFullYear() + 1, 2, 29); // 29 février de l'année prochaine

        const annualRevenue = invoices.reduce((acc, invoice) => {
            const date = new Date(invoice.usedDate || invoice.createdAt);
            if (date >= startDate && date <= endDate && date.getMonth() !== 2) { // Exclure mars
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

        // Exclure mars 2024
        delete revenueByMonth['2024-03'];

        return Object.entries(revenueByMonth).sort(([a], [b]) => new Date(a) - new Date(b));
    };

    const getEstimatedRevenueByMonth = (invoices) => {
        const revenueByMonth = invoices.reduce((acc, invoice) => {
            const date = new Date(invoice.deliverySlot.date);
            const month = format(date, 'yyyy-MM');
            // Exclure le mois de mars 2024
            if (month !== '2024-03') {
                acc[month] = (acc[month] || 0) + (invoice.cartTotal || 0);
            }
            return acc;
        }, {});

        return Object.entries(revenueByMonth).sort(([a], [b]) => new Date(a) - new Date(b));
    };

    const getChartData = () => {
        const revenueByMonth = getRevenueByMonth(invoices);
        const estimatedRevenueByMonth = getEstimatedRevenueByMonth(estimatedInvoices);

        // Liste des mois de l'année fiscale actuelle et précédente
        const fiscalMonths = [
            '2024-04', '2024-05', '2024-06', '2024-07', '2024-08', '2024-09',
            '2024-10', '2024-11', '2024-12', '2025-01', '2025-02', '2025-03'
        ];

        const labels = fiscalMonths.map(month => formatDate(month));

        const actualData = fiscalMonths.map(month => {
            const data = revenueByMonth.find(([m]) => m === month);
            return data ? data[1] : 0;
        });

        const estimatedData = fiscalMonths.map(month => {
            const data = estimatedRevenueByMonth.find(([m]) => m === month);
            return data ? data[1] : 0;
        });

        const previousYearData = fiscalMonths.map(month => {
            const previousYearMonth = (parseInt(month.split('-')[0], 10) - 1) + '-' + month.split('-')[1];
            return previousYearRevenue[previousYearMonth] || 0;
        });

        return {
            labels: labels,
            datasets: [
                {
                    label: 'Chiffre d\'affaires réel',
                    data: actualData,
                    backgroundColor: 'rgba(34, 197, 94, 0.6)', // Utiliser le même vert que dans l'encart
                    borderColor: 'rgba(34, 197, 94, 1)',
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
                    label: 'Chiffre d\'affaires de l\'année précédente',
                    data: previousYearData,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)', // Utiliser le même bleu que dans l'encart
                    borderColor: 'rgba(59, 130, 246, 1)',
                    borderWidth: 1
                }
            ]
        };
    };


    const getYearToDateRevenue = () => {
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), 3, 1); // 1er avril de l'année en cours

        // Calculer le CA réel des mois précédents terminés (hors mois en cours)
        const realRevenue = invoices.reduce((acc, invoice) => {
            const date = new Date(invoice.usedDate || invoice.createdAt);
            if (date >= startDate && date < new Date(currentDate.getFullYear(), currentDate.getMonth(), 1) && !(date.getFullYear() === 2024 && date.getMonth() === 2)) {
                acc += (invoice.cartTotal || 0);
            }
            return acc;
        }, 0);

        // Calculer le CA estimé pour le mois en cours
        const estimatedCurrentMonthRevenue = estimatedInvoices.reduce((acc, invoice) => {
            const date = new Date(invoice.deliverySlot.date);
            if (date.getFullYear() === currentDate.getFullYear() && date.getMonth() === currentDate.getMonth()) {
                acc += (invoice.cartTotal || 0);
            }
            return acc;
        }, 0);

        // Calculer le CA de l'année précédente à la même date
        const previousYearToDateRevenue = Object.entries(previousYearRevenue).reduce((acc, [month, revenue]) => {
            const date = new Date(month + '-01');
            if (date >= new Date(currentDate.getFullYear() - 1, 3, 1) && date <= new Date(currentDate.getFullYear() - 1, currentDate.getMonth(), currentDate.getDate())) {
                acc += revenue;
            }
            return acc;
        }, 0);

        return {
            yearToDateRevenue: realRevenue + estimatedCurrentMonthRevenue,
            previousYearToDateRevenue,
            estimatedCurrentMonthRevenue // Ajouter le CA estimé pour le mois en cours
        };
    };

    const { yearToDateRevenue, previousYearToDateRevenue, estimatedCurrentMonthRevenue } = getYearToDateRevenue();

    const calculateDifference = (current, previous) => {
        const difference = current - previous;
        const percentage = (difference / previous) * 100;
        return { difference, percentage };
    };

    const calculateMonthlyDifference = (current, estimated, previous) => {
        const difference = estimated - previous;
        const percentage = (difference / previous) * 100;
        return { difference, percentage };
    };

    const { difference, percentage } = calculateDifference(yearToDateRevenue, previousYearToDateRevenue);

    const getMonthlyComparisons = () => {
        return getRevenueByMonth(invoices).map(([month, revenue]) => {
            const previousYearMonth = (parseInt(month.split('-')[0], 10) - 1) + '-' + month.split('-')[1];
            const previousYearRevenueMonth = previousYearRevenue[previousYearMonth] || 0;
            const estimatedRevenue = month === currentMonth ? estimatedCurrentMonthRevenue : revenue;
            const { difference, percentage } = month === currentMonth ? calculateMonthlyDifference(revenue, estimatedRevenue, previousYearRevenueMonth) : calculateMonthlyDifference(revenue, revenue, previousYearRevenueMonth);
            return { month, revenue, previousYearRevenueMonth, estimatedRevenue, difference, percentage };
        });
    };

    const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

    return (
        <div className="p-6 bg-gray-900 min-h-screen font-sans text-white">
            <h1 className="text-5xl font-extrabold text-center mb-8">Chiffre d'affaires</h1>
            {loading ? (
                <p className="text-center text-xl">Chargement...</p>
            ) : error ? (
                <p className="text-center text-red-500 text-xl">{error}</p>
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h3 className="text-3xl font-semibold text-gray-200 mb-4">Chiffre d'affaires de l'année précédente</h3>
                            <ul>
                                {Object.entries(previousYearRevenue).map(([month, revenue]) => (
                                    <li key={month} className="flex justify-between items-center py-3 border-b border-gray-700">
                                        <span className="text-gray-400 font-medium">{formatDate(month)}</span>
                                        <span className="text-blue-400 font-bold">{revenue.toFixed(2)} €</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h3 className="text-3xl font-semibold text-gray-200 mb-4">Chiffre d'affaires de l'année en cours</h3>
                            <ul>
                                {getMonthlyComparisons().map(({ month, revenue, previousYearRevenueMonth, difference, percentage }) => (
                                    <li key={month} className="flex flex-col py-3 border-b border-gray-700">
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-400 font-medium">{formatDate(month)}</span>
                                            <span className="text-green-400 font-bold">{revenue.toFixed(2)} €</span>
                                        </div>
                                        {month !== currentMonth && (
                                            <div className="text-sm text-gray-500 flex items-center">
                                                {difference >= 0 ? (
                                                    <FaArrowUp className="text-green-400 mr-1" />
                                                ) : (
                                                    <FaArrowDown className="text-red-400 mr-1" />
                                                )}
                                                <span>
                                                {difference >= 0 ? (
                                                    <span className="text-green-400">+ {difference.toFixed(2)} € ({percentage.toFixed(2)}%)</span>
                                                ) : (
                                                    <span className="text-red-400">- {Math.abs(difference).toFixed(2)} € ({percentage.toFixed(2)}%)</span>
                                                )}
                                            </span>
                                            </div>
                                        )}
                                        {month === currentMonth && (
                                            <>
                                                <div className="text-sm text-gray-500">
                                                    <span className="text-purple-400">Estimé: {estimatedCurrentMonthRevenue.toFixed(2)} €</span>
                                                </div>
                                                <div className="text-sm text-gray-500 flex items-center">
                                                    {difference >= 0 ? (
                                                        <FaArrowUp className="text-green-400 mr-1" />
                                                    ) : (
                                                        <FaArrowDown className="text-red-400 mr-1" />
                                                    )}
                                                    <span>
                                                    {difference >= 0 ? (
                                                        <span className="text-green-400">+ {difference.toFixed(2)} € ({percentage.toFixed(2)}%)</span>
                                                    ) : (
                                                        <span className="text-red-400">- {Math.abs(difference).toFixed(2)} € ({percentage.toFixed(2)}%)</span>
                                                    )}
                                                </span>
                                                </div>
                                            </>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                            <h3 className="text-3xl font-semibold text-gray-200 mb-4">Chiffre d'affaires estimé</h3>
                            <ul>
                                {getEstimatedRevenueByMonth(estimatedInvoices).map(([month, revenue]) => (
                                    <li key={month} className="flex justify-between items-center py-3 border-b border-gray-700">
                                        <span className="text-gray-400 font-medium">{formatDate(month)}</span>
                                        <span className="text-purple-400 font-bold">{revenue.toFixed(2)} €</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg mb-8">
                        <h3 className="text-3xl font-semibold text-gray-200 mb-4">Évolution du chiffre d'affaires</h3>
                        <Bar data={getChartData()} options={{ scales: { y: { beginAtZero: true, grid: { color: 'rgba(255, 255, 255, 0.1)' }, ticks: { color: '#fff' } }, x: { ticks: { color: '#fff' } } }, plugins: { legend: { labels: { color: '#fff', font: { size: 16 } } } } }} />
                    </div>
                    <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
                        <h3 className="text-3xl font-semibold text-gray-200 mb-4">Chiffre d'affaires annuel (du 1er avril jusqu'aujourd'hui)</h3>
                        <div className="text-5xl text-green-400 font-extrabold mb-6">{annualRevenue.toFixed(2)} €</div>
                        <div className="border-t border-gray-700 mt-4 pt-4">
                            <h3 className="text-2xl font-semibold text-gray-200 mb-4">Chiffre d'affaires estimé (du 1er avril jusqu'à la fin du mois)</h3>
                            <div className="text-5xl text-purple-400 font-extrabold mb-6">{yearToDateRevenue.toFixed(2)} €</div>
                        </div>
                        <div className="border-t border-gray-700 mt-4 pt-4">
                            <h3 className="text-2xl font-semibold text-gray-200 mb-4">Chiffre d'affaires de l'année précédente (du 1er avril de l'année précédente jusqu'à la fin du mois en cours de l'année précédente)</h3>
                            <div className="text-5xl text-blue-400 font-extrabold">{previousYearToDateRevenue.toFixed(2)} €</div>
                        </div>
                        <div className="border-t border-gray-700 mt-4 pt-4">
                            <h3 className="text-2xl font-semibold text-gray-200 mb-4">Comparatif avec l'année précédente</h3>
                            <div className="text-5xl text-gray-200 font-extrabold">
                                {difference >= 0 ? (
                                    <span className="text-green-400">+ {difference.toFixed(2)} € ({percentage.toFixed(2)}%)</span>
                                ) : (
                                    <span className="text-red-400">- {Math.abs(difference).toFixed(2)} € ({percentage.toFixed(2)}%)</span>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );




}

export default Revenue;
