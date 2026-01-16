import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, CreditCard, Calendar, User } from 'lucide-react';

const API_URL = 'http://localhost:5001/api';

export default function ExpenseReport() {
    const [expenses, setExpenses] = useState([]);

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get(`${API_URL}/transactions`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter only expenses and sort by date descending
            const expenseData = res.data
                .filter(t => t.type === 'expense')
                .sort((a, b) => new Date(b.date) - new Date(a.date));
            setExpenses(expenseData);
        } catch (e) {
            console.error(e);
        }
    };

    const totalAmount = expenses.reduce((sum, item) => sum + item.amount, 0);

    const downloadPDF = () => {
        const doc = new jsPDF();

        // --- HEADER ---
        doc.setFontSize(22);
        doc.setTextColor(220, 38, 38); // Red-600
        doc.setFont("helvetica", "bold");
        doc.text("EKCTC Finance", 14, 20);

        // doc.setFontSize(10);
        // doc.setTextColor(51, 65, 85);
        // doc.setFont("helvetica", "normal");
        // doc.text("College Finance System", 14, 26);

        doc.setFontSize(16);
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "bold");
        doc.text("Expense Report", 14, 32);

        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139);
        doc.setFont("helvetica", "normal");
        const dateStr = new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
        });
        doc.text(`Generated on: ${dateStr}`, 14, 38);

        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, 44, 196, 44);

        // --- TABLE ---
        const tableColumnStyles = {
            0: { cellWidth: 30 }, // Date
            1: { cellWidth: 60, fontStyle: 'bold' }, // Item
            2: { cellWidth: 40 }, // Spent By
            3: { cellWidth: 25, halign: 'center' }, // Mode
            4: { cellWidth: 35, halign: 'right', fontStyle: 'bold', textColor: [220, 38, 38] } // Amount
        };

        const rows = expenses.map(item => [
            item.date,
            item.description,
            item.spent_by || '-',
            item.payment_mode.toUpperCase(),
            `Rs. ${item.amount.toLocaleString()}`
        ]);

        // Add Grand Total Row
        rows.push([
            { content: 'GRAND TOTAL', colSpan: 4, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249] } },
            { content: `Rs. ${totalAmount.toLocaleString()}`, styles: { fontStyle: 'bold', halign: 'right', fillColor: [241, 245, 249], textColor: [220, 38, 38] } }
        ]);

        autoTable(doc, {
            startY: 60,
            head: [['Date', 'Item Name', 'Spent By', 'Mode', 'Amount']],
            body: rows,
            theme: 'grid',
            headStyles: {
                fillColor: [255, 255, 255],
                textColor: [15, 23, 42],
                fontStyle: 'bold',
                lineWidth: 0.1,
                lineColor: [0, 0, 0]
            },
            bodyStyles: {
                fillColor: [255, 255, 255],
                textColor: [30, 41, 59],
                lineColor: [0, 0, 0]
            },
            columnStyles: tableColumnStyles,
            styles: {
                cellPadding: 4,
                fontSize: 10,
                lineColor: [0, 0, 0],
                lineWidth: 0.1
            },
        });

        doc.save(`EKCTC_Finance_Expenses_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-bold text-slate-800">Expense Report</h2>
                    <p className="text-slate-500">Detailed list of all expenses and grand total</p>
                </div>
                <button
                    onClick={downloadPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition shadow-sm"
                >
                    <Download size={18} /> Download PDF
                </button>
            </div>

            {/* Total Card */}
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-6 text-white shadow-lg shadow-red-200 max-w-sm">
                <div className="flex items-center gap-4 mb-2">
                    <div className="p-3 bg-white/20 rounded-xl"><CreditCard size={24} /></div>
                    <span className="font-medium opacity-90">Total Expenses</span>
                </div>
                <div className="text-3xl font-bold">₹{totalAmount.toLocaleString()}</div>
            </div>

            {/* Table */}
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
                        {expenses.map((item, index) => (
                            <tr key={index} className="hover:bg-slate-50/50 transition">
                                <td className="p-4 text-slate-600 font-mono text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={14} className="opacity-50" />
                                        {item.date}
                                    </div>
                                </td>
                                <td className="p-4 font-bold text-slate-800">{item.description}</td>
                                <td className="p-4 text-slate-600">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="opacity-50" />
                                        {item.spent_by || '-'}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs font-bold capitalize">
                                        {item.payment_mode}
                                    </span>
                                </td>
                                <td className="p-4 text-right font-bold text-red-500">
                                    ₹{item.amount.toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {expenses.length === 0 && (
                            <tr>
                                <td colSpan="5" className="p-12 text-center text-slate-400">
                                    No expense records found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                    <tfoot className="bg-slate-50 border-t border-slate-100">
                        <tr>
                            <td colSpan="4" className="p-4 text-right font-bold text-slate-600 uppercase text-xs tracking-wider">
                                Grand Total
                            </td>
                            <td className="p-4 text-right font-bold text-xl text-red-600">
                                ₹{totalAmount.toLocaleString()}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>
    );
}
