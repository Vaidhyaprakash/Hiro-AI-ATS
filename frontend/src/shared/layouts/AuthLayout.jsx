import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function AuthLayout({ children, redirectTo = '/dashboard' }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <div className="auth-layout">
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-logo">
            <img src="/logo.svg" alt="HR Portal Logo" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

export default AuthLayout; 