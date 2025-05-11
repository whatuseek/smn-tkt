// frontend/src/api/axiosInstance.js
import axios from 'axios';
import { supabase } from '../config/supabaseClient'; // Adjust path if needed

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: { 'Content-Type': 'application/json' }
});

// Request Interceptor: Attaches JWT to outgoing requests
axiosInstance.interceptors.request.use(
    async (config) => {
        // --- MODIFIED CHECK ---
        // Check if the request URL *includes* any of the protected base paths
        const urlString = config.url || ''; // Ensure url is a string
        const requiresAuth = urlString.includes('/api/admin') ||
            urlString.includes('/api/tickets') ||
            urlString.includes('/api/user') ||
            urlString.includes('/api/reports');
        // --- END MODIFIED CHECK ---

        // console.log(`[Interceptor] Request URL: ${config.url}, Requires Auth: ${requiresAuth}`);

        if (requiresAuth) {
            // console.log(`[Interceptor] Getting session for: ${config.url}`);
            try {
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error("[Interceptor] Error getting Supabase session:", sessionError.message);
                    // Let request proceed without token if session fails? Backend will reject.
                }

                if (session?.access_token) {
                    config.headers['Authorization'] = `Bearer ${session.access_token}`;
                    // console.log(`[Interceptor] Token ATTACHED for ${config.url}`);
                } else {
                    console.warn(`[Interceptor] No session token found for protected route: ${config.url}. Request will likely fail.`);
                    // No token found, request goes without it, backend should return 401
                }
            } catch (err) {
                console.error("[Interceptor] Unexpected error fetching session/token:", err);
                return Promise.reject(err); // Reject config promise on unexpected error
            }
        } else {
            // console.log(`[Interceptor] URL ${config.url} does not require auth.`);
        }
        return config; // Return config whether modified or not
    },
    (error) => {
        console.error("[Interceptor] Axios Request Config Error:", error);
        return Promise.reject(error);
    }
);

// Response Interceptor (Keep as before)
axiosInstance.interceptors.response.use(
    (response) => {
        return response;
    },
    async (error) => {
        const originalRequest = error.config;
        console.error("[Interceptor] Axios Response Error encountered.");
        if (error.response) {
            console.error(`  Status: ${error.response.status}`);
            console.error(`  URL: ${originalRequest?.url}`);
            // Avoid logging potentially large blob data for file downloads on error
            if (!(error.response.data instanceof Blob)) {
                console.error(`  Data:`, error.response.data);
            } else {
                console.error(`  Data: [Blob Received - Type: ${error.response.data.type}]`);
            }

            if (error.response.status === 401 && !originalRequest?._retry) {
                console.warn("[Interceptor] Received 401 Unauthorized. Session might be expired or invalid.");
                if (originalRequest) originalRequest._retry = true;

                // Attempt to read backend error message even if it's a blob initially
                let backendMessage = '';
                if (error.response.data instanceof Blob && error.response.data.type.includes('json')) {
                    try {
                        const errorJson = JSON.parse(await error.response.data.text());
                        backendMessage = errorJson.message || '';
                    } catch (parseError) {
                        console.error("Could not parse 401 error blob as JSON:", parseError);
                    }
                } else if (error.response.data?.message) {
                    backendMessage = error.response.data.message;
                }

                // Force sign out if backend indicates token issue
                if (backendMessage.includes('invalid token') || backendMessage.includes('token expired') || backendMessage.includes('no token provided')) {
                    console.log("[Interceptor] Forcing sign out due to specific token error message from backend.");
                    await supabase.auth.signOut();
                    if (window.location.pathname !== '/login') { window.location.href = '/login'; }
                }
            }
        } else if (error.request) {
            console.error("[Interceptor] Error: No response received from server.", originalRequest?.url);
        } else {
            console.error('[Interceptor] Error setting up request:', error.message);
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;