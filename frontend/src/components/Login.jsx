// frontend/src/components/Login.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Use Link for navigation
import { supabase } from '../supabaseClient';
import {
    InputAdornment, IconButton, Container, TextField, Button, Typography, Box, Alert, CircularProgress
} from "@mui/material";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Style for rounded text fields
const roundedInputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
};

const Login = () => {
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
                // If Supabase returns an error, throw it
                throw signInError;
            }

            if (data.user) {
                // If login is successful and user data exists
                console.log("Login successful for:", data.user.email);
                navigate("/admin-dashboard"); // Redirect to the dashboard
            } else {
                // Defensive check if no user data but also no error
                throw new Error("Login failed. Please check your credentials.");
            }
        } catch (err) {
            // Catch any errors (from Supabase or the defensive throw)
            console.error("Login error:", err);
            setErrorLogin(err.message || "Invalid login credentials or network error."); // Display error message
        } finally {
            // Always stop loading indicator
            setLoadingLogin(false);
        }
    };

    // --- JSX Return ---
    return (
        <Container maxWidth="xs" sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3, width: '100%' }} >

                <Typography component="h1" variant="h5" align="center" mb={2} gutterBottom style={{ fontFamily: "raleway" }}>
                    Team Portal Login
                </Typography>

                {/* Display Login Errors */}
                {errorLogin && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                        {errorLogin}
                    </Alert>
                )}

                {/* Login Form */}
                <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal" required fullWidth
                        id="email" label="Email Address" name="email"
                        autoComplete="email" autoFocus
                        value={email} onChange={(e) => setEmail(e.target.value)}
                        disabled={loadingLogin} sx={roundedInputStyle}
                    />
                    <TextField
                        margin="normal" required fullWidth
                        name="password" label="Password"
                        type={showPassword ? 'text' : 'password'} // Toggle input type
                        id="password" autoComplete="current-password"
                        value={password} onChange={(e) => setPassword(e.target.value)}
                        disabled={loadingLogin} sx={roundedInputStyle}
                        InputProps={{ // Add visibility toggle icon
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        type="submit" fullWidth variant="contained"
                        disabled={loadingLogin}
                        sx={{ mt: 3, mb: 1, py: 1.5, borderRadius: 2 }}
                        style={{ fontFamily: "raleway" }}
                    >
                        {loadingLogin ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                    </Button>

                    {/* Forgot Password Link */}
                    <Typography variant="body2" align="center" sx={{ mt: 2 }}>
                        <Link
                            to="/request-password-reset" // Link to the reset request page
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Forgot Password?
                        </Link>
                    </Typography>
                </Box>
            </Box>
        </Container>
    );
};

export default Login;