// frontend/src/components/Login.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from '../supabaseClient';
import {
    Container, TextField, Button, Typography, Box, Alert, CircularProgress
} from "@mui/material";

const roundedInputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
};

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        try {
            const { data, error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });

            if (signInError) { throw signInError; }

            if (data.user) {
                console.log("Login successful for:", data.user.email);
                // Navigate to the dashboard root after successful login
                navigate("/admin-dashboard");
            } else {
                // This case is unlikely if signInError is null, but handle defensively
                throw new Error("Login failed. Please check credentials.");
            }

        } catch (err) {
            console.error("Login error:", err);
            setError(err.message || "Invalid login credentials or network error.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="xs" sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3, bgcolor: 'background.paper', borderRadius: 2, boxShadow: 3, width: '100%' }}>
                <Typography component="h1" variant="h5" align="center" mb={2} gutterBottom style={{ fontFamily: "raleway" }}>
                    Team Portal Login {/* Updated Title */}
                </Typography>

                {error && ( <Alert severity="error" sx={{ width: '100%', mb: 2 }}> {error} </Alert> )}

                <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1, width: '100%' }}>
                    <TextField margin="normal" required fullWidth id="email" label="Email Address" name="email" autoComplete="email" autoFocus value={email} onChange={(e) => setEmail(e.target.value)} disabled={loading} sx={roundedInputStyle} />
                    <TextField margin="normal" required fullWidth name="password" label="Password" type="password" id="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={loading} sx={roundedInputStyle} />
                    <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }} style={{ fontFamily: "raleway" }}>
                        {loading ? <CircularProgress size={24} color="inherit" /> : 'Login'}
                    </Button>
                </Box>
            </Box>
        </Container>
    );
};

export default Login;