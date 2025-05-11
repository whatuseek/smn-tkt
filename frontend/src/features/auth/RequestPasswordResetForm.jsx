// src/pages/LoginPage.jsx

import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from '../config/supabaseClient'; // Ensure path is correct based on structure
import {
    InputAdornment, IconButton, Container, TextField, Button, Typography, Box, Alert, CircularProgress
} from "@mui/material";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

// Style for rounded text fields
const roundedInputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
};

const LoginPage = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loadingLogin, setLoadingLogin] = useState(false);
    const [errorLogin, setErrorLogin] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const handleClickShowPassword = () => setShowPassword((show) => !show);
    const handleMouseDownPassword = (event) => {
        event.preventDefault();
    };

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoadingLogin(true);
        setErrorLogin("");

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (signInError) {
                console.error("Supabase Sign In Error:", signInError);
                throw signInError;
            }

            if (data.user) {
                console.log("Login successful for:", data.user.email);
                navigate("/admin-dashboard"); // Navigate on successful login
            } else {
                 console.warn("Login succeeded (no error), but no user data returned.");
                 throw new Error("Login failed. Please check your credentials."); // Should be rare
            }
        } catch (err) {
            console.error("Login Page Error:", err);
            let message = "Invalid login credentials or network error. Please try again.";
            if (err.message?.includes('Invalid login credentials')) {
                message = "Incorrect email or password.";
            } else if (err.message?.includes('Email not confirmed')) {
                message = "Please confirm your email address first.";
            } else if (err.message) {
                message = err.message; // Display other Supabase errors if useful
            }
            setErrorLogin(message);
        } finally {
            setLoadingLogin(false);
        }
    };

    return (
        <Container
            maxWidth="xs"
            sx={{
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", minHeight: "100vh", py: 4
            }}
        >
            <Box
                sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    p: { xs: 2, sm: 4 }, bgcolor: 'background.paper', borderRadius: 3,
                    boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.1)', width: '100%'
                }}
            >
                <Typography
                    component="h1" variant="h5" align="center" gutterBottom
                    sx={{ fontFamily: "Raleway, sans-serif", fontWeight: 'medium', mb: 3 }}
                >
                    Team Portal Login
                </Typography>

                {errorLogin && (
                    <Alert severity="error" sx={{ width: '100%', mb: 2, borderRadius: 1.5 }}>
                        {errorLogin}
                    </Alert>
                )}

                <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField
                        margin="normal" required fullWidth id="email"
                        label="Email Address" name="email" type="email"
                        autoComplete="email" autoFocus value={email}
                        onChange={(e) => setEmail(e.target.value)} disabled={loadingLogin}
                        sx={roundedInputStyle} error={!!errorLogin}
                    />
                    <TextField
                        margin="normal" required fullWidth name="password"
                        label="Password" type={showPassword ? 'text' : 'password'}
                        id="password" autoComplete="current-password" value={password}
                        onChange={(e) => setPassword(e.target.value)} disabled={loadingLogin}
                        sx={roundedInputStyle} error={!!errorLogin}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        onMouseDown={handleMouseDownPassword}
                                        edge="end" disabled={loadingLogin}
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button
                        type="submit" fullWidth variant="contained" disabled={loadingLogin}
                        sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2, textTransform: 'none', fontSize: '1rem' }}
                        style={{ fontFamily: "Raleway, sans-serif" }}
                    >
                        {loadingLogin ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                    </Button>

                    <Typography variant="body2" align="center" sx={{ mt: 1 }}>
                        <Link
                            to="/request-password-reset"
                            className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                            style={{ textDecoration: 'none' }}
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