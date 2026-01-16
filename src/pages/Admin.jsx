import React, { useState } from 'react';
import axios from 'axios';
import { Shield, Lock, User, CheckCircle, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

export default function Admin() {
    const token = localStorage.getItem('token');

    // Helper to handle auth errors
    const handleAuthError = (e) => {
        if (e.response && (e.response.status === 401 || e.response.status === 403)) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return e.response?.data?.error || 'Failed to update';
    };

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-10">
            <div>
                <h2 className="text-3xl font-bold text-slate-800">Admin Settings</h2>
                <p className="text-slate-500">Manage your account security and preferences</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* CHANGE USERNAME CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <User size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Change Username</h3>
                            <p className="text-sm text-slate-400">Update your login ID</p>
                        </div>
                    </div>
                    <ChangeUsername token={token} handleAuthError={handleAuthError} />
                </div>

                {/* CHANGE PASSWORD CARD */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 flex flex-col">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Lock size={24} />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800">Change Password</h3>
                            <p className="text-sm text-slate-400">Update your security key</p>
                        </div>
                    </div>
                    <ChangePassword token={token} handleAuthError={handleAuthError} />
                </div>
            </div>
        </div>
    );
}

function ChangeUsername({ token, handleAuthError }) {
    const [newUsername, setNewUsername] = useState('');
    const [password, setPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    const handleUpdate = async () => {
        if (!newUsername || !password) return;
        setMsg('');
        try {
            const res = await axios.put(`${API_URL}/auth/change-username`,
                { newUsername, password },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            // Update local storage if successful
            localStorage.setItem('token', res.data.token);
            localStorage.setItem('username', res.data.username);

            setMsg('Username updated successfully!');
            setIsError(false);
            setNewUsername('');
            setPassword('');
        } catch (e) {
            setMsg(handleAuthError(e));
            setIsError(true);
        }
    };

    return (
        <div className="space-y-4 flex-1">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Username</label>
                <input
                    type="text"
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 font-medium text-slate-700"
                    placeholder="Enter new username"
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Confirm Password</label>
                <input
                    type="password"
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
                    placeholder="Enter current password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                />
            </div>

            {msg && (
                <div className={`text-sm flex items-center gap-2 p-3 rounded-xl ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {isError ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    {msg}
                </div>
            )}

            <button
                onClick={handleUpdate}
                disabled={!newUsername || !password}
                className="w-full mt-auto bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition disabled:opacity-50"
            >
                Update Username
            </button>
        </div>
    );
}

function ChangePassword({ token, handleAuthError }) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [msg, setMsg] = useState('');
    const [isError, setIsError] = useState(false);

    const handleChange = async () => {
        if (!oldPassword || !newPassword) return;
        setMsg('');
        try {
            await axios.put(`${API_URL}/auth/change-password`, { oldPassword, newPassword }, { headers: { Authorization: `Bearer ${token}` } });
            setMsg('Password updated successfully!');
            setIsError(false);
            setOldPassword('');
            setNewPassword('');
        } catch (e) {
            setMsg(handleAuthError(e));
            setIsError(true);
        }
    };

    return (
        <div className="space-y-4 flex-1">
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Old Password</label>
                <input
                    type="password"
                    placeholder="Enter current password"
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                    value={oldPassword}
                    onChange={e => setOldPassword(e.target.value)}
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">New Password</label>
                <input
                    type="password"
                    placeholder="Enter new password"
                    className="w-full p-3 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 bg-slate-50"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                />
            </div>

            {msg && (
                <div className={`text-sm flex items-center gap-2 p-3 rounded-xl ${isError ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                    {isError ? <AlertCircle size={16} /> : <CheckCircle size={16} />}
                    {msg}
                </div>
            )}

            <button
                onClick={handleChange}
                disabled={!oldPassword || !newPassword}
                className="w-full mt-auto bg-slate-800 text-white font-bold py-3 rounded-xl hover:bg-slate-900 transition disabled:opacity-50"
            >
                Update Password
            </button>
        </div>
    );
}
