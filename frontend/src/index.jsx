import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Bundle imports
import AdminApp from './bundles/admin/AdminApp';
import OrganizationApp from './bundles/organization/OrganizationApp';
import ExamApp from './bundles/exam/ExamApp';
import { ThemeProvider, TooltipProvider } from '@sparrowengg/twigs-react';
import config from '../twigs.config';
// Root application component
const App = () => {
  return (
    <ThemeProvider theme={config.theme.extends}>
      <TooltipProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/admin/*" element={<AdminApp />} />
            <Route path="/organization/*" element={<OrganizationApp />} />
            <Route path="/exam/*" element={<ExamApp />} />
            <Route path="*" element={<Navigate to="/admin/login" replace />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
};

const root = createRoot(document.getElementById('root'));
root.render(<App />); 