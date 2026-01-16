
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { User, Plus, FileText, ChevronDown, ChevronRight, Check, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function StudentStatus() {
    const navigate = useNavigate();
    const [allStudents, setAllStudents] = useState([]);
    const [groupedData, setGroupedData] = useState({});
    const [loading, setLoading] = useState(true);

    // Mappings for Names
    const [yearMap, setYearMap] = useState({});
    const [deptMap, setDeptMap] = useState({});

    // UI State
    const [expandedYears, setExpandedYears] = useState({});

    // PDF Modal State
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [pdfStep, setPdfStep] = useState(1); // 1: Year, 2: Type, 3: Dept
    const [pdfSelection, setPdfSelection] = useState({ year: null, type: null, dept: null });

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token} ` };

    useEffect(() => {
        loadData();
    }, []);

    const toggleYear = (year) => {
        setExpandedYears(prev => ({ ...prev, [year]: !prev[year] }));
    };

    const loadData = async () => {
        try {
            setLoading(true);
            // 1. Fetch Lookups
            const [yearsRes, deptsRes] = await Promise.all([
                axios.get(`${API_URL}/years`, { headers }),
                axios.get(`${API_URL}/departments`, { headers })
            ]);

            const yMap = {};
            yearsRes.data.forEach(y => yMap[y.id] = y.name);
            setYearMap(yMap);

            const dMap = {};
            deptsRes.data.forEach(d => dMap[d.id] = d.name);
            setDeptMap(dMap);

            // 2. Fetch Students
            const studentsRes = await axios.get(`${API_URL}/students`, { headers });

            if (Array.isArray(studentsRes.data)) {
                setAllStudents(studentsRes.data);
                groupStudents(studentsRes.data, yMap, dMap);
            }
        } catch (e) {
            console.error("Failed to load data", e);
        } finally {
            setLoading(false);
        }
    };

    const groupStudents = (students, yMap, dMap) => {
        const groups = {};

        students.forEach(s => {
            const yName = yMap[s.year_id] || 'Unknown Year';
            const dName = dMap[s.department_id] || 'Unknown Dept';

            if (!groups[yName]) groups[yName] = {};
            if (!groups[yName][dName]) groups[yName][dName] = [];

            groups[yName][dName].push(s);
        });

        setGroupedData(groups);
    };

    const startPdfFlow = () => {
        setPdfConfigStart();
        setShowPdfModal(true);
    };

    const setPdfConfigStart = () => {
        setPdfStep(1);
        setPdfSelection({ year: null, type: null, dept: null });
    };

    const generatePDF = (config) => {
        try {
            if (!allStudents.length) {
                alert("No data to download");
                return;
            }

            const doc = new jsPDF();

            // Title
            doc.setFontSize(18);
            doc.text("EKCTC Finance Report", 14, 20);
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 28);
            if (config.year) doc.text(`Year: ${config.year}`, 14, 34); // Add Year info

            let finalY = 40;

            // Iterate Groups
            Object.keys(groupedData).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(yearStr => {
                // Filter by Year Selection
                if (config.year && config.year !== yearStr) return;

                const depts = groupedData[yearStr];

                Object.keys(depts).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).forEach(deptStr => {
                    // Filter by Dept Selection (if type is 'dept')
                    if (config.type === 'dept' && config.dept !== deptStr) return;

                    const classList = depts[deptStr];
                    if (!classList || classList.length === 0) return;

                    // Calculate Totals for PDF
                    const totalPaid = classList.reduce((sum, s) => sum + (s.amount_paid || 0), 0);
                    const totalBalance = classList.reduce((sum, s) => sum + ((s.total_fee || 0) - (s.amount_paid || 0)), 0);

                    // Check for page break
                    if (finalY > 250) { doc.addPage(); finalY = 20; }

                    // Section Header
                    doc.setFontSize(14);
                    doc.setTextColor(37, 99, 235);
                    doc.text(`${yearStr} - ${deptStr}`, 14, finalY);
                    finalY += 8;

                    const tableBody = classList.map((s, i) => [
                        i + 1,
                        s.name,
                        s.amount_paid || 0,
                        (s.total_fee || 0) - (s.amount_paid || 0),
                        s.is_paid ? 'Paid' : 'Due'
                    ]);

                    // Add Total Row
                    tableBody.push([
                        '', 'TOTAL', totalPaid, totalBalance, ''
                    ]);

                    // Table
                    autoTable(doc, {
                        head: [["S.No", "Name", "Paid", "Balance", "Status"]],
                        body: tableBody,
                        startY: finalY,
                        theme: 'grid',
                        headStyles: { fillColor: [40, 40, 40] },
                        columnStyles: {
                            0: { cellWidth: 15 },
                            2: { halign: 'right' },
                            3: { halign: 'right', fontStyle: 'bold' }
                        },
                        didParseCell: (data) => {
                            if (data.row.raw[1] === 'TOTAL') {
                                data.cell.styles.fontStyle = 'bold';
                                data.cell.styles.fillColor = [240, 240, 240];
                            }
                        },
                        didDrawPage: (data) => {
                            finalY = data.cursor.y;
                        },
                        margin: { left: 14, right: 14 }
                    });

                    // Add spacing after the table
                    finalY += 15;
                });
            });

            doc.save(`EKCTC_Report_${config.year || 'All'}.pdf`);
            setShowPdfModal(false); // Close modal on success
        } catch (e) {
            console.error("PDF Error:", e);
            alert("Error generating PDF: " + e.message);
        }
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Student Status</h2>
                    <p className="text-slate-500">View and manage all students by class</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={startPdfFlow}
                        className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition text-sm shadow-md shadow-slate-200"
                    >
                        <FileText size={18} /> PDF Report
                    </button>
                    <button
                        onClick={() => navigate('/students/add')}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition text-sm"
                    >
                        <Plus size={18} /> Add Student
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-20 text-slate-400">Loading student data...</div>
            ) : (
                <div className="space-y-8">
                    {/* Iterate Years */}
                    {Object.keys(groupedData).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(yearName => (
                        <div key={yearName} className="space-y-4">
                            <div
                                className="flex items-center gap-3 cursor-pointer group select-none"
                                onClick={() => toggleYear(yearName)}
                            >
                                <div className="p-1.5 bg-slate-100 rounded-lg text-slate-500 group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                                    {expandedYears[yearName] ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                </div>
                                <h3 className="text-xl font-bold text-slate-700 bg-white px-4 py-1.5 rounded-lg border border-slate-100 shadow-sm inline-block group-hover:border-blue-200 transition">
                                    {yearName}
                                </h3>
                                <div className="h-px bg-slate-200 flex-1"></div>
                            </div>

                            {/* Iterate Depts in Year (Conditionally Rendered) */}
                            {expandedYears[yearName] && (
                                <div className="grid grid-cols-1 gap-6 animate-in slide-in-from-top-2 duration-300">
                                    {Object.keys(groupedData[yearName]).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(deptName => {
                                        const deptStudents = groupedData[yearName][deptName];
                                        const totalPaid = deptStudents.reduce((sum, s) => sum + (s.amount_paid || 0), 0);
                                        const totalBalance = deptStudents.reduce((sum, s) => sum + ((s.total_fee || 0) - (s.amount_paid || 0)), 0);

                                        return (
                                            <div key={deptName} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                                <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center">
                                                    <h4 className="font-bold text-slate-600 flex items-center gap-2">
                                                        <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
                                                        {deptName}
                                                        <span className="text-sm font-medium text-slate-400 ml-2">({deptStudents.length} students)</span>
                                                    </h4>
                                                </div>
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-white text-xs uppercase text-slate-400 font-semibold border-b border-slate-50">
                                                            <tr>
                                                                <th className="px-6 py-3 w-16">#</th>
                                                                <th className="px-6 py-3">Student Name</th>
                                                                {/* Fee column hidden */}
                                                                <th className="px-6 py-3 text-right">Paid</th>
                                                                <th className="px-6 py-3 text-right">Balance</th>
                                                                <th className="px-6 py-3 text-center">Status</th>
                                                                <th className="px-6 py-3 text-center">Actions</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-50">
                                                            {deptStudents.map((student, idx) => (
                                                                <StudentRow
                                                                    key={student.id}
                                                                    student={student}
                                                                    index={idx}
                                                                    onUpdate={loadData}
                                                                />
                                                            ))}
                                                            {/* TOTALS ROW - FIXED ALIGNMENT */}
                                                            <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
                                                                <td colSpan="2" className="px-6 py-4 text-right text-sm uppercase tracking-wider font-extrabold text-slate-800">Total</td>
                                                                <td className="px-6 py-4 text-right font-mono font-bold text-black text-base">{totalPaid}</td>
                                                                <td className="px-6 py-4 text-right font-mono font-bold text-black text-base">{totalBalance}</td>
                                                                <td className="px-6 py-4"></td>
                                                                <td className="px-6 py-4"></td>
                                                            </tr>
                                                        </tbody>
                                                    </table>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}

                    {allStudents.length === 0 && (
                        <div className="text-center py-20 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                            No students found. Click "Add Student" to get started.
                        </div>
                    )}
                </div>
            )}

            {/* PDF MODAL */}
            {showPdfModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <h3 className="font-bold text-slate-800">Download Report</h3>
                            <button onClick={() => setShowPdfModal(false)} className="text-slate-400 hover:text-red-500 text-sm font-bold">Close</button>
                        </div>
                        <div className="p-6">
                            {/* STEP 1: Select Year */}
                            {pdfStep === 1 && (
                                <div className="space-y-3">
                                    <p className="text-slate-600 font-medium mb-4">Select Academic Year:</p>
                                    {Object.keys(groupedData).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(year => (
                                        <button
                                            key={year}
                                            onClick={() => {
                                                setPdfSelection(prev => ({ ...prev, year }));
                                                setPdfStep(2);
                                            }}
                                            className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-semibold transition flex justify-between items-center"
                                        >
                                            {year}
                                            <ChevronRight size={16} className="text-slate-400" />
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* STEP 2: Select Type */}
                            {pdfStep === 2 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm cursor-pointer hover:text-blue-600" onClick={() => setPdfStep(1)}>
                                        <ChevronDown size={14} className="rotate-90" /> Back to Year Selection
                                    </div>
                                    <p className="text-slate-800 font-bold text-lg">{pdfSelection.year}</p>
                                    <p className="text-slate-500 text-sm">What would you like to download?</p>

                                    <button
                                        onClick={() => generatePDF({ year: pdfSelection.year, type: 'all' })}
                                        className="w-full py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 shadow-md"
                                    >
                                        Download Entire Year
                                    </button>
                                    <div className="relative flex py-2 items-center">
                                        <div className="flex-grow border-t border-slate-200"></div>
                                        <span className="flex-shrink mx-4 text-slate-400 text-xs">OR</span>
                                        <div className="flex-grow border-t border-slate-200"></div>
                                    </div>
                                    <button
                                        onClick={() => {
                                            setPdfSelection(prev => ({ ...prev, type: 'dept' }));
                                            setPdfStep(3);
                                        }}
                                        className="w-full py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:border-blue-500 hover:text-blue-600 transition"
                                    >
                                        Select Specific Department
                                    </button>
                                </div>
                            )}

                            {/* STEP 3: Select Dept */}
                            {pdfStep === 3 && (
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2 mb-4 text-slate-500 text-sm cursor-pointer hover:text-blue-600" onClick={() => setPdfStep(2)}>
                                        <ChevronDown size={14} className="rotate-90" /> Back
                                    </div>
                                    <p className="text-slate-600 font-medium mb-4">Select Department in {pdfSelection.year}:</p>
                                    {Object.keys(groupedData[pdfSelection.year] || {}).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).map(dept => (
                                        <button
                                            key={dept}
                                            onClick={() => generatePDF({ year: pdfSelection.year, type: 'dept', dept })}
                                            className="w-full text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-blue-500 hover:bg-blue-50 text-slate-700 font-semibold transition"
                                        >
                                            {dept}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-component for editing logic
function StudentRow({ student, index, onUpdate }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        name: student.name || '',
        total_fee: student.total_fee || 0,
        amount_paid: student.amount_paid === 0 ? '' : student.amount_paid
    });

    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };

    const handleSave = async (e) => {
        if (e) e.stopPropagation();
        try {
            // 1. Update Name/Details
            await axios.put(`${API_URL}/students/${student.id}`, {
                name: editForm.name,
                year_id: student.year_id,       // Keep same
                department_id: student.department_id // Keep same
            }, { headers });

            // 2. Update Fees
            const feePayload = {
                total_fee: editForm.total_fee,
                amount_paid: editForm.amount_paid === '' ? 0 : Number(editForm.amount_paid)
            };
            await axios.put(`${API_URL}/students/${student.id}/fees`, feePayload, { headers });

            setIsEditing(false);
            onUpdate();
        } catch (e) { alert('Failed to update student'); }
    };

    const handleDelete = async (e) => {
        if (e) e.stopPropagation();
        if (!window.confirm("Are you sure you want to delete this student?")) return;

        try {
            await axios.delete(`${API_URL}/students/${student.id}`, { headers });
            onUpdate();
        } catch (e) { alert('Failed to delete student'); }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleSave();
        if (e.key === 'Escape') setIsEditing(false);
    };

    const balance = (editForm.total_fee || 0) - (editForm.amount_paid === '' ? 0 : editForm.amount_paid);

    if (isEditing) {
        return (
            <tr className="bg-blue-50/50 ring-2 ring-blue-100 relative z-10">
                <td className="p-4 text-slate-400 font-mono text-xs text-center">{index + 1}</td>
                <td className="p-4">
                    <input
                        autoFocus
                        type="text"
                        className="w-full p-2 border border-blue-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 bg-white"
                        value={editForm.name}
                        onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                        onKeyDown={handleKeyDown}
                        placeholder="Student Name"
                    />
                </td>
                {/* Fee Column Hidden */}
                <td className="p-2 text-right">
                    <input
                        type="number"
                        className="w-24 p-2 border border-blue-300 rounded-lg text-right outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-700 bg-white shadow-sm"
                        value={editForm.amount_paid}
                        onChange={e => setEditForm({ ...editForm, amount_paid: e.target.value === '' ? '' : Number(e.target.value) })}
                        onKeyDown={handleKeyDown}
                        placeholder="0"
                    />
                </td>
                <td className="p-4 text-right font-mono font-bold text-slate-600">
                    {balance}
                </td>
                <td className="p-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                        <button
                            onClick={handleSave}
                            className="p-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
                            title="Save"
                        >
                            <Check size={16} />
                        </button>
                        <button
                            onClick={handleDelete}
                            className="p-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                            title="Delete"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </td>
            </tr>
        );
    }

    return (
        <tr className="hover:bg-slate-50 transition group cursor-pointer" onClick={() => setIsEditing(true)}>
            <td className="px-6 py-4 text-slate-400 font-mono text-xs text-center">{index + 1}</td>
            <td className="px-6 py-4 font-medium text-slate-800">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-slate-100 rounded-full text-slate-400">
                        <User size={16} />
                    </div>
                    {student.name}
                </div>
            </td>
            {/* Fee Column Hidden */}
            <td className="px-6 py-4 text-right font-mono text-green-600 font-semibold">{student.amount_paid}</td>
            <td className="px-6 py-4 text-right font-mono font-bold text-red-500">
                {(student.total_fee || 0) - (student.amount_paid || 0)}
            </td>
            <td className="px-6 py-4 text-center">
                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${student.is_paid
                    ? 'bg-green-50 text-green-600 border-green-100'
                    : 'bg-red-50 text-red-600 border-red-100'
                    }`}>
                    {student.is_paid ? 'Paid' : 'Due'}
                </span>
            </td>
        </tr>
    );
}
