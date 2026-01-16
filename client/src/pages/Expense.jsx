import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5001/api';

export default function Expense() {
    const [history, setHistory] = useState([]);

    const [form, setForm] = useState({
        description: '',
        amount: '',
        payment_mode: 'cash',
        spent_by: ''
    });

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await axios.get(`${API_URL}/transactions`, { headers });
            setHistory(res.data.filter(t => t.type === 'expense'));
        } catch (e) { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/transactions`, {
                ...form,
                type: 'expense',
                date: new Date().toISOString().split('T')[0],
                year_id: null,        // Explicitly null
                department_id: null   // Explicitly null
            }, { headers });
            setForm({ ...form, amount: '', description: '', spent_by: '' });
            fetchHistory();
        } catch (e) { alert('Failed to save'); }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* FORM CARD */}
            <div className="xl:col-span-1">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 sticky top-4">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-red-500 rounded-full"></span>
                        New Expense
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Expense Item Name</label>
                            <input
                                type="text" required
                                className="w-full p-3 border rounded-xl mt-1 bg-slate-50 focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="e.g. Printer Ink"
                                value={form.description}
                                onChange={e => setForm({ ...form, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</label>
                            <input
                                type="number" step="0.01" required
                                className="w-full p-3 border rounded-xl mt-1 font-bold text-lg text-slate-800 focus:ring-2 focus:ring-red-500 outline-none"
                                placeholder="₹ 0.00"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Payment From</label>
                                <select
                                    className="w-full p-3 border rounded-xl mt-1 bg-white"
                                    value={form.payment_mode}
                                    onChange={e => setForm({ ...form, payment_mode: e.target.value })}
                                >
                                    <option value="cash">Cash</option>
                                    <option value="gpay">GPay</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Spent By</label>
                                <input
                                    type="text" required
                                    className="w-full p-3 border rounded-xl mt-1 bg-slate-50"
                                    placeholder="Name / Role"
                                    value={form.spent_by}
                                    onChange={e => setForm({ ...form, spent_by: e.target.value })}
                                />
                            </div>
                        </div>

                        <button type="submit" className="w-full py-4 bg-red-500 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 hover:bg-red-600 transition transform hover:-translate-y-1">
                            Record Expense
                        </button>
                    </form>
                </div>
            </div>

            {/* TABLE */}
            <div className="xl:col-span-2 space-y-4">
                <h3 className="text-lg font-bold text-slate-700">Recent Expenses</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Item Name</th>
                                <th className="p-4">Spent By</th>
                                <th className="p-4">Mode</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {history.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-4 text-slate-600 font-medium">{item.date}</td>
                                    <td className="p-4 font-bold text-slate-800">{item.description}</td>
                                    <td className="p-4 text-slate-500 text-sm">{item.spent_by}</td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold capitalize">
                                            {item.payment_mode}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-red-500">
                                        -₹{item.amount}
                                    </td>
                                </tr>
                            ))}
                            {!history.length && <tr><td colSpan="5" className="p-8 text-center text-slate-300">No records</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
