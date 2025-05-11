// src/App.jsx
import { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from './config/supabaseClient'; // Corrected path
import PropTypes from 'prop-types';
import { CircularProgress, Box } from '@mui/material';

// Import Static Pages/Components
import LandingPage from "./pages/LandingPage"; // Correct path
import LoginPage from "./pages/LoginPage";     // Correct path and name
import RequestPasswordResetPage from "./pages/RequestPasswordResetPage"; // Correct path and name
import ResetPasswordPage from "./pages/ResetPasswordPage";         // Correct path and name

// Lazy load layout and feature/page components for dashboard
const AdminDashboardLayout = lazy(() => import("./layouts/AdminDashboardLayout")); // Correct path
const DashboardHomePage = lazy(() => import("./pages/admin/DashboardHomePage"));    // Correct path
const TicketList = lazy(() => import('./features/tickets/TicketList'));         // Correct path
const UserUpload = lazy(() => import('./features/admin/UserUpload'));          // Correct path
const TicketForm = lazy(() => import('./features/tickets/TicketForm'));         // Correct path
const SettingsPage = lazy(() => import('./pages/admin/SettingsPage')); // Keep existing settings page
const ReportsPage = lazy(() => import('./pages/admin/ReportsPage')); // Reports Hub Page
const TicketReportGenerator = lazy(() => import('./features/reports/TicketReportGenerator')); // Specific Report Export Page
// const TicketSummaryReport = lazy(() => import('./features/reports/TicketSummaryReport'));   // Specific Summary Page
const TicketAnalyticsPage = lazy(() => import('./features/reports/TicketAnalyticsPage')); // Specific Analytics Page

// Protected Route Component
const ProtectedRoute = ({ session, children }) => {
  const isAuthenticated = session && session.user;
  if (!isAuthenticated) {
    console.log("ProtectedRoute: No valid session, redirecting to /login.");
    return <Navigate to="/login" replace />;
  }
  return children; // Render the protected component (AdminDashboard layout)
};

ProtectedRoute.propTypes = {
  session: PropTypes.object,
  children: PropTypes.node.isRequired,
};

// Loading Component for Suspense fallback
const LoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
    </Box>
);

// Main App Component
const App = () => {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  // Effect to fetch initial session and listen for auth changes
  useEffect(() => {
    setLoadingAuth(true); // Start loading
    const fetchSession = async () => {
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        if (error) console.error("Error fetching initial session:", error);
        setSession(currentSession);
        console.log("Initial session state:", currentSession ? `Exists (User: ${currentSession.user?.id})` : 'Null');
        setLoadingAuth(false); // Finish loading after setting session
    };
    fetchSession();

    // Auth listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        console.log("Auth state change detected:", _event, "Session User ID:", session?.user?.id);
        setSession(session); // Update session state based on event
      }
    );

    // Cleanup listener
    return () => {
      subscription?.unsubscribe();
    };
  }, []); // Run only on mount

  // Display loading indicator while checking authentication status
  if (loadingAuth) {
    return <LoadingFallback />;
  }

  // Main Router Setup
  return (
    <Router>
        <Suspense fallback={<LoadingFallback />}> {/* Wrap all routes for lazy loading */}
            <Routes>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/request-password-reset" element={<RequestPasswordResetPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />

                {/* Protected Admin Route (Layout Route) */}
                <Route
                    path="/admin-dashboard" // Parent path
                    element={
                        <ProtectedRoute session={session}>
                            {/* Element is the layout */}
                            <AdminDashboardLayout user={session?.user} />
                        </ProtectedRoute>
                    }
                >
                    {/* --- Nested Child Routes --- */}
                    {/* These render inside AdminDashboardLayout's <Outlet> */}

                    <Route index element={<DashboardHomePage />} /> {/* Default view at /admin-dashboard */}
                    <Route path="tickets" element={<TicketList />} />
                    <Route path="addUser" element={<UserUpload />} />
                    <Route path="ticketForm" element={<TicketForm />} />
                    <Route path="settings" element={<SettingsPage />} /> {/* Separate settings page */}

                    {/* Nested Report Routes */}
                    <Route path="reports"> {/* Base path for reports */}
                        <Route index element={<ReportsPage />} /> {/* Renders ReportsPage list at /admin-dashboard/reports */}
                        <Route path="tickets" element={<TicketReportGenerator />} /> {/* Renders export generator at /admin-dashboard/reports/tickets */}
                        {/* <Route path="summary" element={<TicketSummaryReport />} />   Renders summary at /admin-dashboard/reports/summary */}
                        <Route path="analytics" element={<TicketAnalyticsPage />} /> {/* Renders analytics at /admin-dashboard/reports/analytics */}
                    </Route>
                    {/* --- End Nested Routes --- */}

                </Route> {/* End of admin-dashboard Route */}

                {/* Catch-All Route */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    </Router>
  );
};

export default App;