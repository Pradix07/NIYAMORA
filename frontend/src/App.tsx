import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { RuleLibraryPage } from './pages/RuleLibraryPage';
import { RuleDetailPage } from './pages/RuleDetailPage';
import { ResourcesPage } from './pages/ResourcesPage';

// Authenticated Workspace Pages
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
            <Route path="/product" element={<LandingPage />} />
            <Route path="/how-it-works" element={<LandingPage />} />
            <Route path="/regulations" element={<LandingPage />} />
            <Route path="/rules" element={<RuleLibraryPage />} />
            <Route path="/rules/:id" element={<RuleDetailPage />} />
            <Route path="/resources" element={<ResourcesPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            {/* Authenticated Workspace Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products"
              element={
                <ProtectedRoute>
                  <ProductsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/:id"
              element={
                <ProtectedRoute>
                  <ProductDetailPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/new-check"
              element={
                <ProtectedRoute>
                  <NewCheckPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/processing"
              element={
                <ProtectedRoute>
                  <ProcessingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workbench"
              element={
                <ProtectedRoute>
                  <WorkbenchPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/improve"
              element={
                <ProtectedRoute>
                  <ImproveDesignPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/versions"
              element={
                <ProtectedRoute>
                  <VersionsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/compare"
              element={
                <ProtectedRoute>
                  <ComparePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/regression"
              element={
                <ProtectedRoute>
                  <RegressionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/simulator"
              element={
                <ProtectedRoute>
                  <SimulatorPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/review"
              element={
                <ProtectedRoute>
                  <ReviewCenterPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/passport"
              element={
                <ProtectedRoute>
                  <PassportPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings/:tab"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
