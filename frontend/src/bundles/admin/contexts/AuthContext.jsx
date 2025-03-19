import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthProvider as SharedAuthProvider, useAuth as useSharedAuth } from '../../../shared/contexts/AuthContext';

// Custom hook that extends the shared auth hook with admin-specific functionality
export const useAuth = () => {
  const sharedAuth = useSharedAuth();

  // Add admin-specific authentication methods and properties
  return {
    ...sharedAuth,
    isAdmin: sharedAuth.user?.role === 'admin',
    // Add other admin-specific auth methods here
  };
};

// Custom provider that extends the shared provider
export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const sharedAuth = useSharedAuth();

  const handleLogin = async (credentials) => {
    // Admin-specific login logic here
    const success = await sharedAuth.login(credentials);
    if (success) {
      navigate('/admin/dashboard');
    }
    return success;
  };

  return (
    <SharedAuthProvider>
      {children}
    </SharedAuthProvider>
  );
}; 