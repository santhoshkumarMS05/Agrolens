import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider, useAuth } from "./context/AuthContext";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import DashboardPage from "./pages/DashboardPage";
import HistoryPage from "./pages/HistoryPage";
import AdminPage from "./pages/AdminPage";
import CropDoctorPage from "./pages/CropDoctorPage";

/**
 * Strict Admin Route:
 * - If not logged in -> redirect to /admin-login
 * - If logged in as farmer -> redirect to /dashboard
 * - If admin -> render children
 */
const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) {
    return <Navigate to="/admin-login" replace />;
  }
  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

/**
 * Strict Farmer / End-User Route:
 * - If logged in as admin -> STRICTLY BLOCKED from farmer pages, bounce instantly to /admin
 * - If requireAuth is true and user is not logged in -> redirect to /login
 * - Otherwise -> render children
 */
const FarmerRoute = ({ children, requireAuth = false }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === "admin") {
    // Admin is strictly quarantined from farmer application routes
    return <Navigate to="/admin" replace />;
  }
  if (requireAuth && !user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

/**
 * Admin Login Route:
 * - If already logged in as admin -> redirect directly to /admin
 */
const AdminLoginRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

/**
 * Public Auth Route (/login, /signup):
 * - If logged in as admin -> redirect to /admin
 * - If logged in as farmer -> redirect to /dashboard
 */
const PublicAuthRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Landing page: If logged in as admin, bounce to /admin */}
            <Route
              path="/"
              element={
                <FarmerRoute>
                  <LandingPage />
                </FarmerRoute>
              }
            />

            {/* Auth routes */}
            <Route
              path="/login"
              element={
                <PublicAuthRoute>
                  <LoginPage />
                </PublicAuthRoute>
              }
            />
            <Route
              path="/signup"
              element={
                <PublicAuthRoute>
                  <SignupPage />
                </PublicAuthRoute>
              }
            />
            <Route
              path="/admin-login"
              element={
                <AdminLoginRoute>
                  <AdminLoginPage />
                </AdminLoginRoute>
              }
            />

            {/* Farmer-only portal routes (Admins strictly redirected to /admin) */}
            <Route
              path="/dashboard"
              element={
                <FarmerRoute>
                  <DashboardPage />
                </FarmerRoute>
              }
            />
            <Route
              path="/doctor"
              element={
                <FarmerRoute>
                  <CropDoctorPage />
                </FarmerRoute>
              }
            />
            <Route
              path="/history"
              element={
                <FarmerRoute requireAuth={true}>
                  <HistoryPage />
                </FarmerRoute>
              }
            />

            {/* Admin-only operations console (Farmers strictly redirected to /dashboard) */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPage />
                </AdminRoute>
              }
            />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;

