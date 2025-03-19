import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Admin pages
import AdminLogin from './pages/Login';
import AdminDashboard from './pages/Dashboard';
import AdminSettings from './pages/Settings';

// Layouts
import AdminLayout from './layouts/AdminLayout';
import AuthLayout from '../../shared/layouts/AuthLayout';

// Auth context
import { AuthProvider } from './contexts/AuthContext';

const AdminApp = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={
          <AuthLayout>
            <AdminLogin />
          </AuthLayout>
        } />

        <Route element={<AdminLayout />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default AdminApp; 