import React, { useState } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { LayoutDashboard, Settings, Wallet, CreditCard, Receipt, Menu, X, LogOut, Users, User, RefreshCcw } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        window.location.reload();
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">

            {/* Sidebar - Mobile Overlay */}
            <div
                className={clsx(
                    "fixed inset-0 bg-black/50 z-40 md:hidden",
                    isSidebarOpen ? "block" : "hidden"
                )}
                onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar */}
            <aside className={clsx(
                "fixed inset-y-0 left-0 bg-slate-900 text-white z-50 transform transition-all duration-300 ease-in-out shadow-2xl flex flex-col",
                // Mobile: Slide in/out. Desktop: Width transition or slide
                isSidebarOpen ? "w-64 translate-x-0" : "-translate-x-full md:translate-x-0 md:w-0 md:overflow-hidden"
            )}>
                <div className="p-6 border-b border-slate-800 flex justify-between items-center overflow-hidden bg-slate-900/50 backdrop-blur-sm">
                    <div className="flex flex-col items-start">
                        {/* Logo Wrapper */}
                        <div className="bg-blue-50 p-1.5 rounded-xl shadow-lg shadow-blue-900/20 mb-3 mx-auto md:mx-0">
                            <img src="/ekctc_logo.png" alt="EKCTC Logo" className="h-10 w-auto object-contain" />
                        </div>
                        <h1 className="text-lg font-extrabold text-slate-100 tracking-tight uppercase font-sans">
                            EKCTC <span className="text-blue-400">Finance</span>
                        </h1>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400">
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 p-4 space-y-2 overflow-y-auto whitespace-nowrap">
                    <NavItem to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
                    <NavItem to="/configuration" icon={<Settings size={20} />} label="Configuration" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
                    <NavItem to="/students" icon={<Users size={20} />} label="Student Status" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
                    <NavItem to="/collection" icon={<Wallet size={20} />} label="Collection" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
                    <NavItem to="/expense" icon={<CreditCard size={20} />} label="Expense" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
                    <NavItem to="/reports" icon={<Receipt size={20} />} label="Reports" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
                    <NavItem to="/transactions" icon={<RefreshCcw size={20} />} label="Transactions" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
                    <NavItem to="/admin" icon={<User size={20} />} label="Admin" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)} />
                </nav>

                <div className="p-4 border-t border-slate-800 whitespace-nowrap overflow-hidden">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2 text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Wrapper */}
            <div className={clsx(
                "flex-1 flex flex-col transition-all duration-300",
                isSidebarOpen ? "md:ml-64" : "md:ml-0"
            )}>
                {/* Top Header with Burger Button */}
                <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 sticky top-0 z-30 shadow-sm">
                    <button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="p-2 rounded-lg text-slate-600 focus:outline-none hover:bg-slate-100 transition-colors"
                    >
                        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                    <div className="ml-4 md:hidden flex items-center gap-2">
                        <span className="text-lg font-extrabold text-slate-700 tracking-tight uppercase font-sans">
                            EKCTC <span className="text-blue-900">Finance</span>
                        </span>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 overflow-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

function NavItem({ to, icon, label, onClick }) {
    return (
        <NavLink
            to={to}
            onClick={onClick}
            className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-lg shadow-blue-900/50'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
            }
        >
            <div className="min-w-[20px]">{icon}</div>
            <span>{label}</span>
        </NavLink>
    );
}
