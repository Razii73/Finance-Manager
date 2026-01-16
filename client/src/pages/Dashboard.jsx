import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const API_URL = 'http://localhost:5001/api';

const YEAR_COLORS = [
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#06b6d4', // Cyan
];

export default function Dashboard() {
    const [stats, setStats] = useState({
        collection: 0,
        expense: 0,
        balance: 0,
        yearStats: [],
        modeStats: { cash: 0, gpay: 0 }
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${API_URL}/dashboard`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStats(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    const overviewChartData = {
        labels: ['Collection', 'Expense'],
        datasets: [
            {
                label: 'Amount (₹)',
                data: [stats.collection, stats.expense],
                backgroundColor: ['#22c55e', '#ef4444'],
                borderRadius: 8,
                barThickness: 50,
            },
        ],
    };

    const overviewChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Overall Finance', font: { size: 14, weight: 'bold' } },
        },
        scales: {
            y: { grid: { borderDash: [4, 4], color: '#f1f5f9' }, beginAtZero: true },
            x: { grid: { display: false } }
        }
    };

    const yearChartData = {
        labels: stats.yearStats?.map(s => s.year) || [],
        datasets: [
            {
                label: 'Collections (₹)',
                data: stats.yearStats?.map(s => s.total) || [],
                backgroundColor: stats.yearStats?.map((_, i) => YEAR_COLORS[i % YEAR_COLORS.length]),
                borderRadius: 6,
                barThickness: 40,
            },
        ],
    };

    const yearChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: true, text: 'Collections per Year', font: { size: 14, weight: 'bold' } },
        },
        scales: {
            y: { grid: { borderDash: [4, 4], color: '#f1f5f9' }, beginAtZero: true },
            x: { grid: { display: false } }
        }
    };

    const modeChartData = {
        labels: ['GPay', 'Cash'],
        datasets: [
            {
                data: [stats.modeStats?.gpay || 0, stats.modeStats?.cash || 0],
                backgroundColor: ['#6366f1', '#10b981'], // Indigo, Emerald
                borderWidth: 0,
                hoverOffset: 4
            },
        ],
    };

    const modeChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true } },
            title: { display: true, text: 'Payment Mode', font: { size: 14, weight: 'bold' } },
        },
        cutout: '70%',
    };


    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Dashboard</h2>
                <p className="text-slate-500">Welcome back, Admin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card 1: Collection */}
                <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-green-500/20 transform transition hover:-translate-y-1">
                    <p className="text-green-100 font-medium uppercase text-xs tracking-wider">Total Collection</p>
                    <div className="mt-2 text-4xl font-bold">₹{stats.collection.toLocaleString()}</div>
                    <div className="mt-4 text-green-100 text-sm bg-white/20 inline-block px-2 py-1 rounded-lg">Cash + GPay</div>
                </div>

                {/* Card 2: Expense */}
                <div className="bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl p-6 text-white shadow-lg shadow-red-500/20 transform transition hover:-translate-y-1">
                    <p className="text-red-100 font-medium uppercase text-xs tracking-wider">Total Expense</p>
                    <div className="mt-2 text-4xl font-bold">₹{stats.expense.toLocaleString()}</div>
                    <div className="mt-4 text-red-100 text-sm bg-white/20 inline-block px-2 py-1 rounded-lg">All Categories</div>
                </div>

                {/* Card 3: Balance */}
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20 transform transition hover:-translate-y-1">
                    <p className="text-blue-100 font-medium uppercase text-xs tracking-wider">Total Balance</p>
                    <div className="mt-2 text-4xl font-bold">₹{stats.balance.toLocaleString()}</div>
                    <div className="mt-4 text-blue-100 text-sm bg-white/20 inline-block px-2 py-1 rounded-lg">Available Funds</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Chart 1: Payment Mode (Moved First) */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80 relative flex flex-col">
                    <div className="flex-1 relative">
                        <Doughnut data={modeChartData} options={modeChartOptions} />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none mb-6">
                            <div className="text-center">
                                <div className="text-xs text-slate-400 uppercase font-bold">Total</div>
                                <div className="font-bold text-slate-700">₹{stats.collection.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                        <div className="text-center bg-indigo-50 p-2 rounded-lg">
                            <div className="text-xs text-indigo-500 font-bold">GPay</div>
                            <div className="font-bold text-indigo-700">₹{(stats.modeStats?.gpay || 0).toLocaleString()}</div>
                        </div>
                        <div className="text-center bg-emerald-50 p-2 rounded-lg">
                            <div className="text-xs text-emerald-500 font-bold">Cash</div>
                            <div className="font-bold text-emerald-700">₹{(stats.modeStats?.cash || 0).toLocaleString()}</div>
                        </div>
                    </div>
                </div>

                {/* Chart 2: Overview */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
                    <Bar data={overviewChartData} options={overviewChartOptions} />
                </div>

                {/* Chart 3: Year Wise Collection */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-80">
                    {stats.yearStats && stats.yearStats.length > 0 ? (
                        <Bar data={yearChartData} options={yearChartOptions} />
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400">
                            <p>No collection data yet.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
