// frontend/src/App.jsx
import { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from './supabaseClient';
import PropTypes from 'prop-types';
// Removed jwt-decode import
// import { Routes, Route, Navigate } from "react-router-dom"; // Keep these


// Import Pages/Components
import LandingPage from "./components/LandingPage";
import Login from "./components/Login"; // Single Login component
import AdminDashboard from "./components/AdminDashboard";
import RequestPasswordReset from "./components/RequestPasswordReset"; // <-- Import new component
import ResetPassword from "./components/ResetPassword"; // <-- IMPORT NEW COMPONENT

// Removed SettingsPage import

// Protected Route Component - Simplified, only checks session existence
const ProtectedRoute = ({ session, children }) => {
  const isAuthenticated = session && session.user; // Check if session and user exist

  if (!isAuthenticated) {
    // If not authenticated, redirect to login
    console.log("ProtectedRoute: No valid session, redirecting to /login.");
    return <Navigate to="/login" replace />;
  }
  // If authenticated, render the child components
  return children;
};

ProtectedRoute.propTypes = {
  session: PropTypes.object, // Expects the Supabase session object (or null)
  children: PropTypes.node.isRequired, // Expects renderable React children
};


const App = () => {
  const [session, setSession] = useState(null);
  // Removed userRoles state
  const [loadingAuth, setLoadingAuth] = useState(true);

  useEffect(() => {
    // Fetch initial session
    const fetchSession = async () => {
      const { data: { session: currentSession }, error } = await supabase.auth.getSession();
      if (error) console.error("Error fetching initial session:", error);
      setSession(currentSession); // Set session (null if not logged in)
      setLoadingAuth(false);
      console.log("Initial session state:", currentSession ? `Exists (User: ${currentSession.user?.id})` : 'Null');
      setLoadingAuth(false); // Mark auth loading as complete here
    };
    fetchSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => { // Make listener async if needed
        console.log("Auth state change detected:", _event, "Session User:", session?.user?.id);

        // --- SPECIAL HANDLING FOR PASSWORD RECOVERY ---
        if (_event === "PASSWORD_RECOVERY" && session?.user) {
          console.log("App.jsx: PASSWORD_RECOVERY detected. Session should be valid for password update.");
          // We know the user is authenticated via the token.
          // The /reset-password route should now be able to use this session.
          // Ensure the session state is updated *before* potential navigation.
          setSession(session);
          // We don't navigate here, let the route handle showing ResetPassword component
        } else {
          // Handle other events like SIGNED_IN, SIGNED_OUT, INITIAL_SESSION normally
          setSession(session);
        }
      }
    );

    // Cleanup listener
    return () => {
      subscription?.unsubscribe();
    };
  }, []);  // Empty dependency array, runs once

  if (loadingAuth) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading Authentication...</div>;
  }

  return (

    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />

      {/* --- Add Route for Requesting Reset --- */}
      <Route path="/request-password-reset" element={<RequestPasswordReset />} />
      {/* --- End Add Route --- */}

      {/* --- Add Route for Reset Password --- */}
      <Route path="/reset-password" element={<ResetPassword />} />
      {/* --- End Add Route --- */}

      {/* Remove redirects from old login routes */}
      {/* <Route path="/admin-login" element={<Navigate to="/login" replace />} /> */}
      {/* <Route path="/team-login" element={<Navigate to="/login" replace />} /> */}

      {/* Protected Admin Dashboard Route */}
      <Route
        path="/admin-dashboard/*" // Catches dashboard and its sub-routes
        element={
          // Pass session for authentication check
          <ProtectedRoute session={session}>
            {/* This line already passes the necessary object */}
            <AdminDashboard user={session?.user} />
          </ProtectedRoute>
        }
      />

      
      {/* Catch-All - Redirects unknown paths to landing page */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

  );
};

export default App;