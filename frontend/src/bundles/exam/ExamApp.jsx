import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Exam pages
import ExamLogin from './pages/Login';
import ExamInstructions from './pages/Instructions';
import ExamSession from './pages/ExamSession';
import ExamSubmitted from './pages/ExamSubmitted';

// Layouts
import ExamLayout from './layouts/ExamLayout';
import AuthLayout from '../../shared/layouts/AuthLayout';

// Auth and exam session contexts
import { AuthProvider } from './contexts/AuthContext';
import { ExamProvider } from './contexts/ExamContext';

const ExamApp = () => {
  // Tab switch prevention effect
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        // Log tab switch attempt
        console.warn('Tab switch detected during exam');
        // Here you can also call an API to log this event
      }
    };

    const handleBeforeUnload = (e) => {
      // Prevent page refresh or navigation during exam
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <AuthProvider>
      <ExamProvider>
        <Routes>
          <Route path="login" element={
            <AuthLayout>
              <ExamLogin />
            </AuthLayout>
          } />

          <Route element={<ExamLayout />}>
            <Route path="instructions" element={<ExamInstructions />} />
            <Route path="/session" element={<ExamSession />} />
            <Route path="submitted" element={<ExamSubmitted />} />
            <Route path="" element={<Navigate to="login" replace />} />
          </Route>
        </Routes>
      </ExamProvider>
    </AuthProvider>
  );
};

export default ExamApp; 