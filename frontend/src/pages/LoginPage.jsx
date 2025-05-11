// src/pages/LoginPage.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '../config/supabaseClient'; // Updated import path
import {
    InputAdornment, IconButton, Container, TextField, Button, Typography, Box, Alert, CircularProgress
} from "@mui/material";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Assuming global styles like App.css or index.css handle base styling
// import "../styles/index.css"; // Optional: if specific styles are needed

// Style for rounded text fields (can be moved to a shared style utility if used elsewhere)
const roundedInputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
};

const LoginPage = () => {
    const navigate = useNavigate();
    // State for login form
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [errorLogin, setErrorLogin] = useState("");
    // State for password visibility toggle
    const [showPassword, setShowPassword] = useState(false);

    // Handlers for password visibility toggle
    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => {
        event.preventDefault(); // Prevent input field blur on icon click
    };

    // Handler for login form submission
    const handleLogin = async (event) => {
        event.preventDefault(); // Prevent default HTML form submission
        setLoadingLogin(true); // Show loading indicator
        setErrorLogin(""); // Clear previous errors

        try {
            // Attempt Supabase sign-in
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (signInError) {
                // If Supabase returns an error, display it
                console.error("Supabase Sign In Error:", signInError);
                throw signInError; // Throw to be caught below
            }

            // On successful login (Supabase handles session, App.jsx listener updates state)
            if (data.user) {
                console.log("Login successful for:", data.user.email);
                // Navigate to the main dashboard route
                // The ProtectedRoute in App.jsx will allow access now
                navigate("/admin-dashboard");
            } else {
                // This case should technically not happen if signInError is null, but defense-in-depth
                console.warn("Login succeeded according to Supabase, but no user data returned.");
                throw new Error("Login seemed successful but user data was missing.");
            }

        } catch (err) {
            // Catch errors from Supabase or the defensive throw
            console.error("Login Page Error:", err);
            // Provide a user-friendly error message
            let message = "Invalid login credentials or network error. Please try again.";
            if (err.message?.includes('Invalid login credentials')) {
                message = "Incorrect email or password.";
            } else if (err.message) {
                // You might want to map other specific Supabase errors here
                message = err.message; // Or use a generic message
            }
            setErrorLogin(message); // Display error message in the Alert
        } finally {
            // Always stop loading indicator
            setLoadingLogin(false);
        }
    };

    // --- JSX Return ---
    return (
        <Container
            maxWidth="xs"
            sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "100vh",
                py: 4 // Add some padding
            }}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: { xs: 2, sm: 4 }, // Responsive padding
                    bgcolor: 'background.paper',
                    borderRadius: 3, // Slightly more rounded
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', // Softer shadow
                    width: '100%'
                }}
            >
                <Typography
                    component="h1"
                    variant="h5"
                    align="center"
                    gutterBottom // Adds bottom margin
                    sx={{ fontFamily: "Raleway, sans-serif", fontWeight: 'medium', mb: 3 }} // Use theme typography if possible
                >
                    Team Portal Login
                </Typography>

                {/* Display Login Errors */}
                {errorLogin && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 1.5 }}>
                        {errorLogin}
                    </Alert>
                )}

                {/* Login Form */}
                <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        type="email" // Ensure correct input type
                        autoComplete="email"
                        autoFocus
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loadingLogin}
                        sx={roundedInputStyle}
                        error={!!errorLogin} // Highlight field on error
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        name="password"
                        label="Password"
                        type={showPassword ? 'text' : 'password'} // Toggle input type
                        id="password"
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loadingLogin}
                        sx={roundedInputStyle}
                        error={!!errorLogin} // Highlight field on error
                        InputProps={{ // Add visibility toggle icon
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                        disabled={loadingLogin} // Disable icon when loading
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        disabled={loadingLogin}
                        sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem' }} // Styling consistent with other buttons
                        style={{ fontFamily: "Raleway, sans-serif" }}
                    >
                        {loadingLogin ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                    </Button>

                    {/* Forgot Password Link */}
                    <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                        <Link
                            to="/request-password-reset" // Link to the password reset request page
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200" // Tailwind classes
                            style={{ textDecoration: 'none' }} // Remove underline if needed via inline style
                        >
                            Forgot Password?
                        </Link>
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default LoginPage;