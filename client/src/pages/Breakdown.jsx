import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, Wallet, CreditCard, Banknote } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

export default function Breakdown() {
    const [data, setData] = useState([]);

    useEffect(() => {
        fetchReport();
    }, []);

    const fetchReport = async () => {
        const token = localStorage.getItem('token');
        try {
            const res = await axios.get(`${API_URL}/reports/breakdown`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setData(res.data);
        } catch (e) {
            console.error(e);
        }
    };

    // Calculate Grand Totals
    const totals = React.useMemo(() => {
        let gpay = 0, cash = 0, total = 0;
        data.forEach(year => {
            year.departments.forEach(dept => {
                gpay += dept.gpay;
                cash += dept.cash;
                total += dept.total;
            });
        });
        return { gpay, cash, total };
    }, [data]);

    const downloadPDF = () => {
        const doc = new jsPDF();
        const primaryColor = [79, 70, 229]; // Indigo-600
        const slateColor = [51, 65, 85];    // Slate-700

        // Define standard column styles for consistent alignment
        const tableColumnStyles = {
            0: { cellWidth: 50, fontStyle: 'bold' },              // Department / Label
            1: { cellWidth: 40, halign: 'right', font: 'courier' }, // GPay
            2: { cellWidth: 40, halign: 'right', font: 'courier' }, // Cash
            3: { cellWidth: 40, halign: 'right', fontStyle: 'bold' } // Total
        };

        // --- HEADER ---
        doc.setFontSize(22);
        doc.setTextColor(...primaryColor);
        doc.setFont("helvetica", "bold");
        doc.text("EKCTC Finance", 14, 20);

        // doc.setFontSize(10);
        // doc.setTextColor(...slateColor);
        // doc.setFont("helvetica", "normal");
        // doc.text("College Finance System", 14, 26);

        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.text("Collection Report", 14, 32); // Adjusted Y position up

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        const dateStr = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        doc.text(`Generated on: ${dateStr}`, 14, 38); // Adjusted Y

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, 44, 196, 44); // Adjusted Y

        let yPos = 52; // Adjusted Y

        // --- YEAR TABLES ---
        data.forEach(year => {
            // Strict Page Break
            if (yPos > 220) {
                doc.addPage();
                yPos = 20;
            }

            // Year Title
            doc.setFontSize(12);
            doc.setTextColor(...slateColor);
            doc.setFont("helvetica", "bold");
            doc.text(year.yearName.toUpperCase(), 14, yPos);
            yPos += 8;

            const rows = year.departments.map(d => [
                d.deptName,
                `Rs. ${d.gpay.toLocaleString()}`,
                `Rs. ${d.cash.toLocaleString()}`,
                `Rs. ${d.total.toLocaleString()}`
            ]);

            let subGpay = 0, subCash = 0, subTotal = 0;
            year.departments.forEach(d => {
                subGpay += d.gpay;
                subCash += d.cash;
                subTotal += d.total;
            });

            // Subtotal Row
            rows.push([
                { content: 'YEAR TOTAL', styles: { fontStyle: 'bold', fillColor: [255, 255, 255] } },
                { content: `Rs. ${subGpay.toLocaleString()}`, styles: { fontStyle: 'bold', fillColor: [255, 255, 255], halign: 'right' } },
                { content: `Rs. ${subCash.toLocaleString()}`, styles: { fontStyle: 'bold', fillColor: [255, 255, 255], halign: 'right' } },
                { content: `Rs. ${subTotal.toLocaleString()}`, styles: { fontStyle: 'bold', fillColor: [255, 255, 255], halign: 'right' } },
            ]);

            autoTable(doc, {
                startY: yPos,
                head: [
                    [
                        { content: 'Department', styles: { halign: 'left' } },
                        { content: 'GPay', styles: { halign: 'right' } },
                        { content: 'Cash', styles: { halign: 'right' } },
                        { content: 'Total', styles: { halign: 'right' } }
                    ]
                ],
                body: rows,
                theme: 'grid', // Adds borders
                headStyles: {
                    fillColor: [255, 255, 255], // White background
                    textColor: [15, 23, 42], // Slate-900
                    fontStyle: 'bold',
                    lineWidth: 0.1, // Border width
                    lineColor: [0, 0, 0] // Black border
                },
                bodyStyles: {
                    fillColor: [255, 255, 255], // All white (no stripes)
                    textColor: [15, 23, 42],
                    lineColor: [0, 0, 0] // Black border
                },
                columnStyles: tableColumnStyles,
                styles: {
                    cellPadding: 4,
                    fontSize: 10,
                    lineColor: [0, 0, 0],
                    lineWidth: 0.1
                },
                margin: { left: 14 }
            });

            yPos = doc.lastAutoTable.finalY + 15;
        });

        // --- GRAND TOTAL ---
        if (yPos > 250) {
            doc.addPage();
            yPos = 30;
        }

        autoTable(doc, {
            startY: yPos,
            body: [
                [
                    { content: 'GRAND TOTAL', colSpan: 1, styles: { fontStyle: 'bold', fontSize: 12, textColor: [15, 23, 42], valign: 'middle', halign: 'left' } },
                    { content: `Rs. ${totals.gpay.toLocaleString()}`, styles: { fontStyle: 'bold', fontSize: 12, textColor: [15, 23, 42], halign: 'right' } },
                    { content: `Rs. ${totals.cash.toLocaleString()}`, styles: { fontStyle: 'bold', fontSize: 12, textColor: [15, 23, 42], halign: 'right' } },
                    { content: `Rs. ${totals.total.toLocaleString()}`, styles: { fontStyle: 'bold', fontSize: 14, textColor: [15, 23, 42], halign: 'right' } }
                ]
            ],
            theme: 'grid',
            columnStyles: tableColumnStyles,
            styles: {
                cellPadding: 6,
                lineColor: [0, 0, 0],
                lineWidth: 0.1,
                fillColor: [255, 255, 255]
            },
            margin: { left: 14 }
        });

        doc.save(`EKCTC_Finance_Collection_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Collection Report</h2>
                    <p className="text-slate-500">Detailed report by Year and Department</p>
                </div>
                <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition shadow-sm"
                >
                    <Download size={18} /> Download PDF
                </button>
            </div>

            {/* Grand Total Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-white/20 rounded-xl"><Wallet size={24} /></div>
                        <span className="font-medium opacity-90">Total Collection</span>
                    </div>
                    <div className="text-3xl font-bold">₹{totals.total.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><Banknote size={24} /></div>
                        <span className="font-medium text-slate-500">Total Cash</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-800">₹{totals.cash.toLocaleString()}</div>
                </div>
                <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-4 mb-2">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><CreditCard size={24} /></div>
                        <span className="font-medium text-slate-500">Total GPay</span>
                    </div>
                    <div className="text-3xl font-bold text-slate-800">₹{totals.gpay.toLocaleString()}</div>
                </div>
            </div>

            <div className="space-y-8">
                {data.map((year, index) => {
                    // Calculate Year Subtotals
                    const yearTotals = year.departments.reduce((acc, dept) => ({
                        gpay: acc.gpay + dept.gpay,
                        cash: acc.cash + dept.cash,
                        total: acc.total + dept.total
                    }), { gpay: 0, cash: 0, total: 0 });

                    return (
                        <div key={index} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                            <div className="bg-slate-50 border-b border-slate-100 p-4">
                                <h3 className="text-lg font-bold text-slate-800">{year.yearName}</h3>
                            </div>
                            <div className="p-0">
                                <table className="w-full text-left">
                                    <thead className="bg-white text-xs uppercase text-slate-400 border-b border-slate-50">
                                        <tr>
                                            <th className="p-4 font-semibold">Department</th>
                                            <th className="p-4 font-semibold text-right">GPay</th>
                                            <th className="p-4 font-semibold text-right">Cash</th>
                                            <th className="p-4 font-semibold text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {year.departments.map((dept, i) => (
                                            <tr key={i} className="hover:bg-slate-50 transition">
                                                <td className="p-4 font-medium text-slate-700">{dept.deptName}</td>
                                                <td className="p-4 text-right text-indigo-600 font-mono">₹{dept.gpay.toLocaleString()}</td>
                                                <td className="p-4 text-right text-emerald-600 font-mono">₹{dept.cash.toLocaleString()}</td>
                                                <td className="p-4 text-right font-bold text-slate-800">₹{dept.total.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    <tfoot className="bg-slate-50/50 border-t border-slate-100 font-bold text-slate-800">
                                        <tr>
                                            <td className="p-4 text-slate-500 uppercase text-xs tracking-wider">Year Total</td>
                                            <td className="p-4 text-right font-mono text-indigo-700">₹{yearTotals.gpay.toLocaleString()}</td>
                                            <td className="p-4 text-right font-mono text-emerald-700">₹{yearTotals.cash.toLocaleString()}</td>
                                            <td className="p-4 text-right text-lg">₹{yearTotals.total.toLocaleString()}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                        </div>
                    );
                })}

                {data.length === 0 && (
                    <div className="text-center p-12 text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
                        No collection data found to generate report.
                    </div>
                )}
            </div>
        </div>
    );
}
