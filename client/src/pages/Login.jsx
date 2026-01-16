import React, { useState } from 'react';

import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const API_URL = 'http://localhost:5001/api';

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API_URL}/auth/login`, { username, password });
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);
            window.location.href = '/'; // Force reload to clear state or just simple redirect
        } catch (err) {
            setError("Invalid credentials");
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-2xl">
                <div className="text-center mb-8 flex flex-col items-center">
                    <img src="/ekctc_logo.png" alt="EKCTC Logo" className="h-20 w-auto mb-4 object-contain" />
                    <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight uppercase font-sans">
                        EKCTC <span className="text-blue-900">Finance</span>
                    </h1>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-sm font-semibold text-slate-700">Username</label>
                        <input
                            type="text"
                            className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter user ID"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-slate-700">Password</label>
                        <input
                            type="password"
                            className="w-full p-3 border border-slate-200 rounded-xl mt-1 focus:ring-2 focus:ring-blue-500 outline-none transition"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-500/30"
                    >
                        Sign In
                    </button>
                </form>
            </div>
        </div>
    );
}
