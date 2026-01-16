import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Collection() {
    const [history, setHistory] = useState([]);
    const [years, setYears] = useState([]);
    const [depts, setDepts] = useState([]);

    const [form, setForm] = useState({
        amount: '',
        payment_mode: 'gpay',
        year_id: '',
        department_id: ''
    });

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchYears();
        fetchHistory();
    }, []);

    useEffect(() => {
        if (form.year_id) fetchDepts(form.year_id);
        else setDepts([]);
    }, [form.year_id]);

    const fetchYears = async () => {
        try {
            const res = await axios.get(`${API_URL}/years`, { headers });
            setYears(res.data);
        } catch (e) { }
    };

    const fetchDepts = async (yId) => {
        try {
            const res = await axios.get(`${API_URL}/years/${yId}/departments`, { headers });
            setDepts(res.data);
        } catch (e) { }
    };

    const fetchHistory = async () => {
        try {
            // Fetch only collections? We can filter on frontend or add param
            const res = await axios.get(`${API_URL}/transactions`, { headers });
            setHistory(res.data.filter(t => t.type === 'collection'));
        } catch (e) { }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_URL}/transactions`, {
                ...form,
                type: 'collection',
                date: new Date().toISOString().split('T')[0],
                description: 'Collection Entry'
            }, { headers });
            setForm({ ...form, amount: '' });
            fetchHistory();
        } catch (e) { alert('Failed to save'); }
    };

    return (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* FORM CARD */}
            <div className="xl:col-span-1">
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100 sticky top-4">
                    <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <span className="w-2 h-6 bg-green-500 rounded-full"></span>
                        New Collection
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Amount</label>
                            <input
                                type="number" step="0.01" required
                                className="w-full p-3 border rounded-xl mt-1 font-bold text-lg text-slate-800 focus:ring-2 focus:ring-green-500 outline-none"
                                placeholder="₹ 0.00"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Payment Method</label>
                            <div className="flex gap-2 mt-1">
                                {['gpay', 'cash'].map(mode => (
                                    <button
                                        key={mode}
                                        type="button"
                                        onClick={() => setForm({ ...form, payment_mode: mode })}
                                        className={`flex-1 py-3 rounded-xl capitalize font-medium transition-all ${form.payment_mode === mode
                                            ? 'bg-slate-900 text-white shadow-md'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                            }`}
                                    >
                                        {mode}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Year</label>
                            <select
                                required
                                className="w-full p-3 border rounded-xl mt-1 bg-white"
                                value={form.year_id}
                                onChange={e => setForm({ ...form, year_id: e.target.value, department_id: '' })}
                            >
                                <option value="">Select Year</option>
                                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Department</label>
                            <select
                                required
                                disabled={!form.year_id}
                                className="w-full p-3 border rounded-xl mt-1 bg-white disabled:opacity-50"
                                value={form.department_id}
                                onChange={e => setForm({ ...form, department_id: e.target.value })}
                            >
                                <option value="">Select Dept</option>
                                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>

                        <button type="submit" className="w-full py-4 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 hover:bg-green-700 transition transform hover:-translate-y-1">
                            Save Collection
                        </button>
                    </form>
                </div>
            </div>

            {/* TABLE */}
            <div className="xl:col-span-2 space-y-4">
                <h3 className="text-lg font-bold text-slate-700">Recent Collections</h3>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100 text-xs uppercase text-slate-500">
                            <tr>
                                <th className="p-4">Date</th>
                                <th className="p-4">Context</th>
                                <th className="p-4">Mode</th>
                                <th className="p-4 text-right">Amount</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {history.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                    <td className="p-4 text-slate-600 font-medium">{item.date}</td>
                                    <td className="p-4">
                                        <div className="font-bold text-slate-800">{item.dept_name}</div>
                                        <div className="text-xs text-slate-500">{item.year_name}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold capitalize">
                                            {item.payment_mode}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right font-bold text-green-600">
                                        +₹{item.amount}
                                    </td>
                                </tr>
                            ))}
                            {!history.length && <tr><td colSpan="4" className="p-8 text-center text-slate-300">No records</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
