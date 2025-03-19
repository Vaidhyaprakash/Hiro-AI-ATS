import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Organization pages
import OrganizationLogin from './pages/Login';
import OrganizationDashboard from './pages/Dashboard';
import StudentsList from './pages/StudentsList';
import StudentForm from './pages/StudentForm';

// Layouts
import OrganizationLayout from './layouts/OrganizationLayout';
import AuthLayout from '../../shared/layouts/AuthLayout';

// Auth context
import { AuthProvider } from './contexts/AuthContext';

const OrganizationApp = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={
          <AuthLayout>
            <OrganizationLogin />
          </AuthLayout>
        } />

        <Route element={<OrganizationLayout />}>
          <Route path="dashboard" element={<OrganizationDashboard />} />
          <Route path="students" element={<StudentsList />} />
          <Route path="students/new" element={<StudentForm />} />
          <Route path="students/:id" element={<StudentForm />} />
          <Route path="" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default OrganizationApp; 