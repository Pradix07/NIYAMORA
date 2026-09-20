import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

// Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProductsPage } from './pages/ProductsPage';
import { ProductDetailPage } from './pages/ProductDetailPage';
import { NewCheckPage } from './pages/NewCheckPage';
import { ProcessingPage } from './pages/ProcessingPage';
import { WorkbenchPage } from './pages/WorkbenchPage';
import { ImproveDesignPage } from './pages/ImproveDesignPage';
import { VersionsPage } from './pages/VersionsPage';
import { ComparePage } from './pages/ComparePage';
import { RegressionPage } from './pages/RegressionPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { ReviewCenterPage } from './pages/ReviewCenterPage';
import { ReportsPage } from './pages/ReportsPage';
import { PassportPage } from './pages/PassportPage';
import { RuleLibraryPage } from './pages/RuleLibraryPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProfilePage } from './pages/ProfilePage';

import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
    const mainEl = document.querySelector('main');
    if (mainEl) {
      mainEl.scrollTop = 0;
    }
  }, [pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Authenticated Workspace Routes */}
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/new-check" element={<NewCheckPage />} />
            <Route path="/processing" element={<ProcessingPage />} />
            <Route path="/workbench" element={<WorkbenchPage />} />
            <Route path="/improve" element={<ImproveDesignPage />} />
            <Route path="/versions" element={<VersionsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/regression" element={<RegressionPage />} />
            <Route path="/simulator" element={<SimulatorPage />} />
            <Route path="/review" element={<ReviewCenterPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/passport" element={<PassportPage />} />
            <Route path="/rules" element={<RuleLibraryPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/:tab" element={<SettingsPage />} />
            <Route path="/profile" element={<ProfilePage />} />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
