import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Configuration from './pages/Configuration';
import Breakdown from './pages/Breakdown';
import Collection from './pages/Collection';
import Expense from './pages/Expense';
import Reports from './pages/Reports';
import ExpenseReport from './pages/ExpenseReport';
import StudentStatus from './pages/StudentStatus';
import StudentEntry from './pages/StudentEntry';
import Admin from './pages/Admin';
import Layout from './components/Layout';
import './index.css';

function ProtectedRoute() {
  const token = localStorage.getItem('token');
  if (!token) return <Navigate to="/login" replace />;

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/configuration" element={<Configuration />} />
          <Route path="/collection" element={<Collection />} />
          <Route path="/expense" element={<Expense />} />
          <Route path="/breakdown" element={<Breakdown />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/students" element={<StudentStatus />} />
          <Route path="/students/add" element={<StudentEntry />} />
          {/* Reports Routes */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/collection" element={<Breakdown />} />
          <Route path="/reports/expense" element={<ExpenseReport />} />
          <Route path="/admin" element={<Admin />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
