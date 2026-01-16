import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft, Upload, Save, FileText } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function StudentEntry() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Initial state from URL params if available
    const [years, setYears] = useState([]);
    const [depts, setDepts] = useState([]);
    const [selectedYear, setSelectedYear] = useState(searchParams.get('yearId') || '');
    const [selectedDept, setSelectedDept] = useState(searchParams.get('deptId') || '');

    // Form State
    const [isBulkMode, setIsBulkMode] = useState(false);
    const [singleName, setSingleName] = useState('');
    const [bulkNames, setBulkNames] = useState('');
    const [status, setStatus] = useState(''); // success/error message

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    useEffect(() => {
        fetchYears();
    }, []);

    useEffect(() => {
        if (selectedYear) fetchDepts(selectedYear);
        else setDepts([]);
    }, [selectedYear]);

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus('');

        if (!selectedYear || !selectedDept) {
            setStatus('Please select Year and Department');
            return;
        }

        try {
            if (isBulkMode) {
                const names = bulkNames.split('\n').map(n => n.trim()).filter(n => n);
                if (names.length === 0) return;

                await axios.post(`${API_URL}/students`, {
                    names,
                    year_id: selectedYear,
                    department_id: selectedDept
                }, { headers });
                setBulkNames('');
                setStatus(`Successfully added ${names.length} students!`);
            } else {
                await axios.post(`${API_URL}/students`, {
                    name: singleName,
                    year_id: selectedYear,
                    department_id: selectedDept
                }, { headers });
                setSingleName('');
                setStatus('Student added successfully!');
            }
        } catch (e) {
            setStatus('Error adding student(s). Please try again.');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <button
                onClick={() => navigate('/students')}
                className="flex items-center gap-2 text-slate-500 hover:text-slate-700 transition font-medium"
            >
                <ArrowLeft size={20} /> Back to Student List
            </button>

            <div className="bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h2 className="text-xl font-bold text-slate-800">Add New Students</h2>
                    <p className="text-slate-500 text-sm">Enter student details individually or in bulk</p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Year</label>
                            <select
                                className="w-full p-3 border rounded-xl mt-1 bg-slate-50"
                                value={selectedYear}
                                onChange={e => { setSelectedYear(e.target.value); setSelectedDept(''); }}
                            >
                                <option value="">-- Select Year --</option>
                                {years.map(y => <option key={y.id} value={y.id}>{y.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Department</label>
                            <select
                                disabled={!selectedYear}
                                className="w-full p-3 border rounded-xl mt-1 bg-slate-50 disabled:opacity-50"
                                value={selectedDept}
                                onChange={e => setSelectedDept(e.target.value)}
                            >
                                <option value="">-- Select Department --</option>
                                {depts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Mode Selection */}
                    <div className="flex p-1 bg-slate-100 rounded-xl w-fit">
                        <button
                            onClick={() => setIsBulkMode(false)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${!isBulkMode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Single Entry
                        </button>
                        <button
                            onClick={() => setIsBulkMode(true)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${isBulkMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                            Bulk Upload
                        </button>
                    </div>

                    {/* Input Area */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {isBulkMode ? (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Paste Names (One per line)</label>
                                <textarea
                                    required
                                    disabled={!selectedYear || !selectedDept}
                                    rows={8}
                                    placeholder={(!selectedYear || !selectedDept) ? "Select Year and Department first..." : "John Doe\nJane Smith\n..."}
                                    className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm disabled:bg-slate-50 disabled:cursor-not-allowed"
                                    value={bulkNames}
                                    onChange={e => setBulkNames(e.target.value)}
                                />
                                <div className="flex justify-between items-center text-xs text-slate-500">
                                    <span>{bulkNames.split('\n').filter(n => n.trim()).length} names detected</span>
                                    <span className="flex items-center gap-1"><FileText size={12} /> Text / Excel Copy-Paste friendly</span>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700">Student Name</label>
                                <input
                                    type="text"
                                    required
                                    disabled={!selectedYear || !selectedDept}
                                    placeholder={(!selectedYear || !selectedDept) ? "Select Year and Department first..." : "Enter full name"}
                                    className="w-full p-4 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:cursor-not-allowed"
                                    value={singleName}
                                    onChange={e => setSingleName(e.target.value)}
                                />
                            </div>
                        )}

                        {status && (
                            <div className={`p-3 rounded-lg text-sm font-medium ${status.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                {status}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition active:scale-[0.98] flex justify-center items-center gap-2"
                        >
                            {isBulkMode ? <Upload size={20} /> : <Save size={20} />}
                            {isBulkMode ? 'Upload Students' : 'Save Student'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
