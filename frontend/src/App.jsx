// frontend/src/App.jsx
import { useState, useEffect } from 'react';
// import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { supabase } from './supabaseClient';
import PropTypes from 'prop-types';
// Removed jwt-decode import
import { Routes, Route, Navigate } from "react-router-dom"; // Keep these


// Import Pages/Components
import LandingPage from "./components/LandingPage";
import Login from "./components/Login"; // Single Login component
import AdminDashboard from "./components/AdminDashboard";
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
          console.log("Initial session state:", currentSession ? 'Exists' : 'Null');
      };
      fetchSession();

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
          (_event, session) => {
              console.log("Auth state change detected:", _event);
              setSession(session); // Update state on login/logout/token refresh
              // Removed role decoding logic
          }
      );

      // Cleanup listener
      return () => {
          subscription?.unsubscribe();
      };
  }, []);

  if (loadingAuth) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading Authentication...</div>;
  }

  return (
  
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />

        {/* Remove redirects from old login routes */}
        {/* <Route path="/admin-login" element={<Navigate to="/login" replace />} /> */}
        {/* <Route path="/team-login" element={<Navigate to="/login" replace />} /> */}

        {/* Protected Admin Dashboard Route */}
        <Route
          path="/admin-dashboard/*" // Catches dashboard and its sub-routes
          element={
            // Pass session for authentication check
            <ProtectedRoute session={session}>
              {/* AdminDashboard no longer needs roles */}
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Removed SetPassword route as invite flow is simplified/changed */}
        {/* <Route path="/set-password" element={<SetPassword />} /> */}

        {/* Catch-All - Redirects unknown paths to landing page */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    
  );
};

export default App;