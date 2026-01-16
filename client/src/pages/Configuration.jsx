import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, X, ChevronRight, Check, Trash2 } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

export default function Configuration() {
    const [years, setYears] = useState([]);
    const [masterDepts, setMasterDepts] = useState([]); // Still keep track of all for suggestion

    // State for Year creation
    const [isYearModalOpen, setYearModalOpen] = useState(false);
    const [newYearName, setNewYearName] = useState('');

    // State for Dept creation (scoped to a year visually)
    const [activeYearId, setActiveYearId] = useState(null);
    const [currentYearDepts, setCurrentYearDepts] = useState([]); // Dept objects for current year
    const [newDeptName, setNewDeptName] = useState('');
    const [isDeptInputVisible, setDeptInputVisible] = useState(false);

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchYears();
    }, []);

    useEffect(() => {
        if (activeYearId) {
            fetchYearDetails(activeYearId);
        } else if (years.length > 0) {
            // Auto select first year if none selected
            setActiveYearId(years[0].id);
        }
    }, [years, activeYearId]);

    const fetchYears = async () => {
        try {
            const res = await axios.get(`${API_URL}/years`, { headers });
            setYears(res.data);
        } catch (e) {
            if (e.response && (e.response.status === 401 || e.response.status === 403)) {
                localStorage.removeItem('token');
                window.location.href = '/login';
            }
            console.error("Fetch Years failed", e);
        }
    };

    const fetchYearDetails = async (id) => {
        try {
            // Get depts for this year
            const res = await axios.get(`${API_URL}/years/${id}/departments`, { headers });
            setCurrentYearDepts(res.data);
            // Optional: Get all to suggestions
            const all = await axios.get(`${API_URL}/departments`, { headers });
            setMasterDepts(all.data);
        } catch (e) { }
    };

    const handleAddYear = async (e) => {
        e.preventDefault();
        if (!newYearName.trim()) return;
        try {
            const res = await axios.post(`${API_URL}/years`, { name: newYearName }, { headers });
            setNewYearName('');
            setYearModalOpen(false);
            fetchYears(); // Refresh list
            setActiveYearId(res.data.id); // Auto switch to new year
        } catch (e) { alert('Error adding year'); }
    };

    const handleAddDeptToYear = async (e) => {
        e.preventDefault();
        if (!newDeptName.trim()) return;

        try {
            // 1. Ensure master dept exists (Backend handles create or find)
            const deptRes = await axios.post(`${API_URL}/departments`, { name: newDeptName }, { headers });
            const deptId = deptRes.data.id;

            // 2. Link to current year
            await axios.post(`${API_URL}/years/${activeYearId}/departments`, { deptId, action: 'add' }, { headers });

            setNewDeptName('');
            setDeptInputVisible(false);
            fetchYearDetails(activeYearId);
        } catch (e) { alert('Error adding department'); }
    };

    const addExistingDept = async (deptId) => {
        try {
            await axios.post(`${API_URL}/years/${activeYearId}/departments`, { deptId, action: 'add' }, { headers });
            fetchYearDetails(activeYearId);
        } catch (e) { }
    };

    const removeDeptFromYear = async (deptId) => {
        try {
            await axios.post(`${API_URL}/years/${activeYearId}/departments`, { deptId, action: 'remove' }, { headers });
            fetchYearDetails(activeYearId);
        } catch (e) { }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:h-[calc(100vh-120px)]">

            {/* SIDEBAR: YEARS */}
            <div className="md:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="font-bold text-slate-700">Years</h3>
                    <button
                        onClick={() => setYearModalOpen(true)}
                        className="p-1.5 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition"
                        title="Add Year"
                    >
                        <Plus size={18} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {years.map(y => (
                        <button
                            key={y.id}
                            onClick={() => setActiveYearId(y.id)}
                            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all flex justify-between items-center ${activeYearId === y.id
                                ? 'bg-slate-800 text-white shadow-md'
                                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                                }`}
                        >
                            {y.name}
                            {activeYearId === y.id && <ChevronRight size={16} />}
                        </button>
                    ))}
                    {!years.length && (
                        <div className="text-center p-8 text-slate-400 text-xs">
                            No years found.<br />Click + to add.
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN: DEPARTMENTS */}
            <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col p-6">
                {!activeYearId ? (
                    <div className="flex-1 flex items-center justify-center text-slate-400">
                        Select a year to manage its departments
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col">
                        <div className="mb-6 flex justify-between items-end">
                            <div>
                                <h2 className="text-2xl font-bold text-slate-800">
                                    {years.find(y => y.id === activeYearId)?.name}
                                </h2>
                                <p className="text-slate-500 text-sm">Manage departments assigned to this year</p>
                            </div>
                            {/* Visual spacer or actions */}
                        </div>

                        {/* ACTIVE DEPARTMENTS */}
                        <div className="space-y-4 mb-8">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Assigned Departments</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {currentYearDepts.map(d => (
                                    <div key={d.id} className="group p-4 rounded-xl border border-slate-100 bg-slate-50 flex justify-between items-center">
                                        <span className="font-semibold text-slate-700">{d.name}</span>
                                        <button
                                            onClick={() => removeDeptFromYear(d.id)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all"
                                            title="Remove from Year"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}

                                {/* ADD BUTTON */}
                                {!isDeptInputVisible ? (
                                    <button
                                        onClick={() => setDeptInputVisible(true)}
                                        className="p-4 rounded-xl border border-dashed border-slate-300 text-slate-400 hover:border-blue-400 hover:text-blue-500 hover:bg-blue-50 transition flex items-center justify-center gap-2"
                                    >
                                        <Plus size={18} />
                                        <span className="font-medium">Add Department</span>
                                    </button>
                                ) : (
                                    <form onSubmit={handleAddDeptToYear} className="p-4 rounded-xl border border-blue-200 bg-blue-50/50">
                                        <input
                                            autoFocus
                                            type="text"
                                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                                            placeholder="Dept Name (e.g. CSE)"
                                            value={newDeptName}
                                            onChange={e => setNewDeptName(e.target.value)}
                                        />
                                        <div className="flex gap-2">
                                            <button type="submit" className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700">Add</button>
                                            <button type="button" onClick={() => setDeptInputVisible(false)} className="px-3 bg-white text-slate-500 text-xs font-bold py-2 rounded-lg hover:bg-slate-100">Cancel</button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </div>

                        {/* SUGGESTIONS (Unassigned Master Dept) */}
                        {masterDepts.filter(md => !currentYearDepts.find(c => c.id === md.id)).length > 0 && (
                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Quick Add (Existing Departments)</h4>
                                <div className="flex flex-wrap gap-2">
                                    {masterDepts
                                        .filter(md => !currentYearDepts.find(c => c.id === md.id))
                                        .map(md => (
                                            <button
                                                key={md.id}
                                                onClick={() => addExistingDept(md.id)}
                                                className="px-3 py-1.5 rounded-full border border-slate-200 text-slate-500 text-sm hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition flex items-center gap-1"
                                            >
                                                <Plus size={14} /> {md.name}
                                            </button>
                                        ))
                                    }
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* SIDEBAR: SETTINGS (Budget) */}
            <div className="md:col-span-1 flex flex-col gap-6 overflow-y-auto">
                {/* CARD: BUDGET */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 flex flex-col p-6 min-h-[200px]">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <Check size={20} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-700">Budget</h3>
                            <p className="text-xs text-slate-400">Set fee for students</p>
                        </div>
                    </div>
                    <Budget token={token} />
                </div>
            </div>

            {/* MODAL: ADD YEAR */}
            {isYearModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">New Student Year</h3>
                            <button onClick={() => setYearModalOpen(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleAddYear} className="space-y-4">
                            <input
                                autoFocus
                                type="text"
                                placeholder="e.g. 1st Year"
                                className="w-full p-3 border rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                                value={newYearName}
                                onChange={e => setNewYearName(e.target.value)}
                            />
                            <button className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-500/30">
                                Save
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Budget({ token }) {
    const [fee, setFee] = useState('');
    const [status, setStatus] = useState('');

    const handleUpdate = async () => {
        if (!fee) return;
        if (!window.confirm(`⚠️ CAUTION: You are about to set the Total Fee to ₹${fee} for EVERY student in the ENTIRE system.\n\nAre you sure?`)) return;

        try {
            await axios.put(`${API_URL}/students/bulk-fees`, {
                total_fee: Number(fee)
            }, { headers: { Authorization: `Bearer ${token}` } });
            setStatus('Success! Updated All Students.');
            setTimeout(() => setStatus(''), 3000);
        } catch (e) {
            setStatus('Error updating.');
        }
    };

    return (
        <div className="space-y-4 flex-1 flex flex-col justify-center">

            <div>
                <label className="text-xs font-bold text-slate-500 uppercase">Global Budget</label>
                <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
                    <input
                        type="number"
                        className="w-full pl-7 pr-3 py-2.5 border rounded-xl mt-1 text-sm font-bold outline-none focus:ring-2 focus:ring-green-100 border-slate-200"
                        placeholder="0"
                        value={fee}
                        onChange={e => setFee(e.target.value)}
                    />
                </div>
            </div>

            <button
                onClick={handleUpdate}
                disabled={!fee}
                className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-black transition disabled:opacity-50 text-sm mt-auto"
            >
                {status || 'Set Global Budget'}
            </button>
        </div>
    );
}
