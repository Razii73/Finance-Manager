import React from 'react';
import { Link } from 'react-router-dom';
import { Wallet, CreditCard, ChevronRight } from 'lucide-react';

export default function Reports() {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Reports Center</h2>
                <p className="text-slate-500">Select a report to view and download</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Collection Report Card */}
                <Link to="/reports/collection" className="group relative bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                        <Wallet size={120} />
                    </div>

                    <div className="relative z-10">
                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-xl inline-block mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Wallet size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-indigo-600 transition-colors">Collection Report</h3>
                        <p className="text-slate-500 mb-8">
                            Detailed breakdown of all student fee collections, organizing data by Academic Year and Department.
                        </p>
                        <div className="flex items-center text-indigo-600 font-bold group-hover:translate-x-2 transition-transform">
                            View Report <ChevronRight size={20} className="ml-1" />
                        </div>
                    </div>
                </Link>

                {/* Expense Report Card */}
                <Link to="/reports/expense" className="group relative bg-white rounded-2xl p-8 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-red-500/10 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 transform translate-x-4 -translate-y-4 group-hover:scale-110 transition-transform">
                        <CreditCard size={120} />
                    </div>

                    <div className="relative z-10">
                        <div className="p-4 bg-red-50 text-red-500 rounded-xl inline-block mb-6 group-hover:bg-red-500 group-hover:text-white transition-colors">
                            <CreditCard size={32} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-red-500 transition-colors">Expense Report</h3>
                        <p className="text-slate-500 mb-8">
                            Comprehensive log of all institutional expenses, including item details, spender information, and payment modes.
                        </p>
                        <div className="flex items-center text-red-500 font-bold group-hover:translate-x-2 transition-transform">
                            View Report <ChevronRight size={20} className="ml-1" />
                        </div>
                    </div>
                </Link>
            </div>
        </div>
    );
}
