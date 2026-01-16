import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Check, X } from 'lucide-react';
import clsx from 'clsx';

const API_URL = 'http://localhost:5001/api';

export default function Manage() {
    const [years, setYears] = useState([]);
    const [masterDepts, setMasterDepts] = useState([]);
    const [activeYear, setActiveYear] = useState(null); // ID of year being configured
    const [yearDepts, setYearDepts] = useState([]); // Depts for the active year
    const [newDept, setNewDept] = useState('');

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchInitData();
    }, []);

    useEffect(() => {
        if (activeYear) {
            fetchYearDepts(activeYear);
        }
    }, [activeYear]);

    const fetchInitData = async () => {
        try {
            const [y, d] = await Promise.all([
                axios.get(`${API_URL}/years`, { headers }),
                axios.get(`${API_URL}/departments`, { headers })
            ]);
            setYears(y.data);
            setMasterDepts(d.data);
        } catch (e) { console.error(e); }
    };

    const fetchYearDepts = async (yearId) => {
        try {
            const res = await axios.get(`${API_URL}/years/${yearId}/departments`, { headers });
            setYearDepts(res.data.map(d => d.id));
        } catch (e) { console.error(e); }
    };

    const addMasterDept = async (e) => {
        e.preventDefault();
        if (!newDept) return;
        try {
            await axios.post(`${API_URL}/departments`, { name: newDept }, { headers });
            setNewDept('');
            fetchInitData();
        } catch (e) { alert('Error adding department'); }
    };

    const toggleDeptForYear = async (deptId, isAssigned) => {
        try {
            await axios.post(`${API_URL}/years/${activeYear}/departments`, {
                deptId,
                action: isAssigned ? 'remove' : 'add'
            }, { headers });
            fetchYearDepts(activeYear);
        } catch (e) { console.error(e); }
    };

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                {/* LEFT COL: Years & Master Depts */}
                <div className="space-y-8">
                    {/* Student Years List */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">Student Years</h3>
                        <p className="text-sm text-slate-500 mb-4">Select a year to configure its departments.</p>
                        <div className="space-y-2">
                            {years.map(y => (
                                <button
                                    key={y.id}
                                    onClick={() => setActiveYear(y.id)}
                                    className={clsx(
                                        "w-full text-left p-3 rounded-xl transition-all font-medium flex justify-between items-center",
                                        activeYear === y.id
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                                    )}
                                >
                                    {y.name}
                                    {activeYear === y.id && <Check size={18} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Master Departments */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="text-xl font-bold text-slate-800 mb-4">All Departments</h3>
                        <form onSubmit={addMasterDept} className="flex gap-2 mb-4">
                            <input
                                type="text"
                                className="flex-1 p-2 border rounded-lg text-sm"
                                value={newDept}
                                onChange={e => setNewDept(e.target.value)}
                                placeholder="New Department Name"
                            />
                            <button type="submit" className="bg-slate-800 text-white px-3 rounded-lg hover:bg-slate-700">
                                <Plus size={18} />
                            </button>
                        </form>
                        <div className="flex flex-wrap gap-2">
                            {masterDepts.map(d => (
                                <span key={d.id} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-sm">
                                    {d.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* RIGHT COL: Configuration */}
                <div className="space-y-6">
                    {activeYear ? (
                        <div className="bg-white p-6 rounded-2xl shadow-lg border border-blue-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                <Check size={100} className="text-blue-600" />
                            </div>

                            <h3 className="text-xl font-bold text-slate-800 mb-2">
                                Configure {years.find(y => y.id === activeYear)?.name}
                            </h3>
                            <p className="text-slate-500 mb-6 text-sm">
                                Check departments to assign them to this year.
                            </p>

                            <div className="space-y-2">
                                {masterDepts.map(d => {
                                    const isAssigned = yearDepts.includes(d.id);
                                    return (
                                        <div
                                            key={d.id}
                                            onClick={() => toggleDeptForYear(d.id, isAssigned)}
                                            className={clsx(
                                                "flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border",
                                                isAssigned
                                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                                    : "border-slate-100 hover:border-slate-300 text-slate-500"
                                            )}
                                        >
                                            <div className={clsx(
                                                "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                                isAssigned ? "bg-blue-600 border-blue-600" : "bg-white border-slate-300"
                                            )}>
                                                {isAssigned && <Check size={14} className="text-white" />}
                                            </div>
                                            <span className="font-medium">{d.name}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-200 rounded-2xl">
                            <div className="text-center">
                                <p>Select a Year to configure</p>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
