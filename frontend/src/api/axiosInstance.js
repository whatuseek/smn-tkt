// frontend/src/api/axiosInstance.js
import axios from 'axios';
import { supabase } from '../supabaseClient'; // Adjust path if necessary

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Create a new Axios instance
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Request Interceptor: Attaches JWT to outgoing requests
axiosInstance.interceptors.request.use(
    async (config) => {
        // Define API paths that typically require authentication
        const requiresAuth = config.url?.startsWith('/api/admin') ||
                             config.url?.startsWith('/api/tickets') || // Assumes ticket creation needs auth
                             config.url?.startsWith('/api/user');      // Assumes user upload/create needs auth

        // console.log(`[Interceptor] Request URL: ${config.url}, Requires Auth: ${requiresAuth}`);

        if (requiresAuth) {
            // console.log(`[Interceptor] Getting session for: ${config.url}`);
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error("[Interceptor] Error getting Supabase session:", sessionError.message);
                    return Promise.reject(sessionError); // Rejecting is safer
                }
                // console.log("[Interceptor] Session retrieved:", session);

                if (session?.access_token) {
                    config.headers['Authorization'] = `Bearer ${session.access_token}`;
                    // console.log(`[Interceptor] Token ATTACHED for ${config.url}`);
                } else {
                    console.warn(`[Interceptor] No session token found for protected route: ${config.url}. Request might fail.`);
                    // Depending on UX, you might reject or redirect here.
                    // For now, let it proceed and let the backend return 401.
                }
            } catch (err) {
                console.error("[Interceptor] Unexpected error fetching session/token:", err);
                return Promise.reject(err);
            }
        }
        return config;
    },
    (error) => {
        console.error("[Interceptor] Axios Request Config Error:", error);
        return Promise.reject(error);
    }
);

// Response Interceptor: Handles responses, e.g., checks for 401 errors
axiosInstance.interceptors.response.use(
    (response) => {
        return response; // Pass through successful responses
    },
    async (error) => {
        const originalRequest = error.config;
        // console.error("[Interceptor] Axios Response Error encountered.");
        if (error.response) {
            // console.error(`  Status: ${error.response.status}`);
            // console.error(`  URL: ${originalRequest.url}`);
            // console.error(`  Data:`, error.response.data);

            // Handle 401 Unauthorized specifically for potential session expiry
            if (error.response.status === 401 && !originalRequest._retry) {
                 console.warn("[Interceptor] Received 401 Unauthorized. Session might be expired or invalid.");
                 originalRequest._retry = true; // Prevent infinite loops

                 // Check error message from backend
                 const backendMessage = error.response.data?.message || '';
                 // Force logout if backend confirms token is invalid/missing
                 if (backendMessage.includes('invalid token') || backendMessage.includes('token expired') || backendMessage.includes('no token provided')) {
                    console.log("[Interceptor] Forcing sign out due to token error.");
                    await supabase.auth.signOut();
                    // Redirect to login page - Use window.location outside components
                    if (window.location.pathname !== '/login') { // Avoid redirect loop if already on login
                         window.location.href = '/login';
                    }
                 }
                 // If it was another type of 401, maybe just let it reject
            }
        } else if (error.request) {
            console.error("[Interceptor] Error: No response received from server.", originalRequest.url);
        } else {
            console.error('[Interceptor] Error setting up request:', error.message);
        }
        // Pass the error along so component-level catch blocks can handle UI
        return Promise.reject(error);
    }
);

export default axiosInstance;