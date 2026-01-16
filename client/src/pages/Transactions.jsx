import React, { useState, useEffect } from 'react';
import axios from 'axios';
import clsx from 'clsx';
import { Filter } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Transactions() {
    const [data, setData] = useState([]);
    const [years, setYears] = useState([]);
    const [availableDepts, setAvailableDepts] = useState([]);

    // Filter state
    const [filters, setFilters] = useState({ yearId: '', deptId: '', type: '' });

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchYears();
    }, []);

    useEffect(() => {
        fetchTransactions();
        if (filters.yearId) {
            fetchDeptsForYear(filters.yearId).then(setAvailableDepts);
        } else {
            setAvailableDepts([]);
        }
    }, [filters]);

    const fetchYears = async () => {
        try {
            const res = await axios.get(`${API_URL}/years`, { headers });
            setYears(res.data);
        } catch (e) { }
    };

    const fetchDeptsForYear = async (yearId) => {
        if (!yearId) return [];
        try {
            const res = await axios.get(`${API_URL}/years/${yearId}/departments`, { headers });
            return res.data;
        } catch (e) { return []; }
    };

    const fetchTransactions = async () => {
        try {
            const res = await axios.get(`${API_URL}/transactions`, { headers, params: filters });
            let filtered = res.data;
            if (filters.type) {
                filtered = filtered.filter(t => t.type === filters.type);
            }
            setData(filtered);
        } catch (e) { }
    };

    const downloadPDF = () => {
        if (!data.length) return alert("No data to download");

        const doc = new jsPDF();

        // Dynamic Title
        let title = "Transactions Report";
        const parts = [];

        if (filters.yearId) {
            const y = years.find(y => y.id == filters.yearId);
            if (y) parts.push(y.name);
        }
        if (filters.deptId) {
            const d = availableDepts.find(d => d.id == filters.deptId);
            if (d) parts.push(d.name);
        }
        if (filters.type) {
            parts.push(filters.type.charAt(0).toUpperCase() + filters.type.slice(1) + "s");
        }

        if (parts.length > 0) {
            title += ` (${parts.join(' - ')})`;
        } else {
            title += " (All)";
        }

        // Title
        doc.setFontSize(18);
        doc.text(title, 14, 20);

        // Date generated
        doc.setFontSize(10);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);

        // Table
        const headers = [["Date", "Type", "Description", "Mode", "Spent By", "Amount"]];
        const rows = data.map(t => [
            t.date,
            t.type.toUpperCase(),
            t.description,
            t.payment_mode ? t.payment_mode.toUpperCase() : '-',
            t.spent_by || '-',
            `Rs. ${t.amount}`
        ]);

        autoTable(doc, {
            startY: 35,
            head: headers,
            body: rows,
            theme: 'grid',
            headStyles: { fillColor: [33, 33, 33] },
            styles: { fontSize: 9 },
        });

        doc.save(`transactions_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-slate-800">All Transactions</h2>
                <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" x2="12" y1="15" y2="3" /></svg>
                    Download PDF
                </button>
            </div>

            {/* Filters Bar */}
            <div className="flex flex-wrap gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 items-center">
                <div className="flex items-center gap-2 text-slate-500 font-medium mr-2">
                    <Filter size={18} /> Filters:
                </div>

                <select
                    className="border rounded-lg px-3 py-2 text-sm bg-slate-50"
                    value={filters.yearId}
                    onChange={e => setFilters(p => ({ ...p, yearId: e.target.value, deptId: '' }))}
                >
                    <option value="">All Years</option>
                    {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                </select>

                <select
                    className="border rounded-lg px-3 py-2 text-sm bg-slate-50 disabled:opacity-50"
                    value={filters.deptId}
                    onChange={e => setFilters(p => ({ ...p, deptId: e.target.value }))}
                    disabled={!filters.yearId}
                >
                    <option value="">All Depts</option>
                    {availableDepts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>

                <select
                    className="border rounded-lg px-3 py-2 text-sm bg-slate-50"
                    value={filters.type}
                    onChange={e => setFilters(p => ({ ...p, type: e.target.value }))}
                >
                    <option value="">All Types</option>
                    <option value="collection">Collections</option>
                    <option value="expense">Expenses</option>
                </select>

                {/* Reset */}
                {(filters.yearId || filters.type) && (
                    <button
                        onClick={() => setFilters({ yearId: '', deptId: '', type: '' })}
                        className="text-sm text-red-500 hover:underline ml-auto"
                    >
                        Clear Filters
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="p-4 font-semibold text-slate-600">Date</th>
                            <th className="p-4 font-semibold text-slate-600">Description</th>
                            <th className="p-4 font-semibold text-slate-600">Context</th>
                            <th className="p-4 font-semibold text-slate-600">Mode</th>
                            <th className="p-4 font-semibold text-slate-600">Spent By</th>
                            <th className="p-4 font-semibold text-slate-600 text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50/50 transition">
                                <td className="p-4 text-slate-600 font-mono text-sm">{t.date}</td>
                                <td className="p-4">
                                    <div className="font-medium text-slate-800">{t.description}</div>
                                    <span className={clsx("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full inline-block mt-1",
                                        t.type === 'collection' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                                    )}>
                                        {t.type}
                                    </span>
                                </td>
                                <td className="p-4 text-sm text-slate-500">
                                    {t.year_name} • {t.dept_name}
                                </td>
                                <td className="p-4 capitalize text-slate-500">{t.payment_mode}</td>
                                <td className="p-4 text-slate-500">{t.spent_by || '-'}</td>
                                <td className={clsx("p-4 font-bold text-right text-lg",
                                    t.type === 'collection' ? "text-green-600" : "text-red-500"
                                )}>
                                    {t.type === 'expense' ? '-' : '+'}₹{t.amount}
                                </td>
                            </tr>
                        ))}
                        {data.length === 0 && (
                            <tr><td colSpan="6" className="p-12 text-center text-slate-400">No transactions match your filters</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
