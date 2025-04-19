// frontend/src/components/SetPassword.jsx

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
Link, Container, Box, Typography, TextField, Button, Alert, CircularProgress
} from '@mui/material';

// Optional: Style for inputs if you want consistency
const roundedInputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
};

const SetPassword = () => {
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [checkingUser, setCheckingUser] = useState(true); // State to track initial user check
    const [userEmail, setUserEmail] = useState(''); // Store user email for display

    useEffect(() => {
        // Check if user is logged in when component mounts (via token)
        const checkUser = async () => {
            // Supabase client automatically handles the token from URL fragment here
            // during its initialization and onAuthStateChange.
            // We just need to check if a user object exists in the session.
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                // This might happen if the token is invalid, expired, or already used
                console.error("SetPassword: No authenticated user found.");
                setError("Invalid or expired link. Please request a new invitation or password reset.");
            } else {
                // User authenticated via token
                setUserEmail(user.email || 'User'); // Store email for display
                console.log("User found for password set:", user.email);
            }
            setCheckingUser(false); // Finished checking
        };

        // Also listen for the specific PASSWORD_RECOVERY event which signals
        // the user is ready to update password after clicking a link.
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("SetPassword Auth Event:", event);
            if (event === "PASSWORD_RECOVERY") {
                // If user was logged out before clicking, they might now be logged in.
                // Re-check user info if needed, or just enable the form.
                if (session?.user) {
                    setUserEmail(session.user.email || 'User');
                    setError(''); // Clear any previous errors
                    setCheckingUser(false);
                }
            }
            // Handle SIGNED_IN as well if coming directly from invite
            else if (event === "SIGNED_IN" && session?.user) {
                setUserEmail(session.user.email || 'User');
                setError('');
                setCheckingUser(false);
            }
        });

        // Initial check when component mounts
        checkUser();

        // Cleanup listener on component unmount
        return () => {
            subscription?.unsubscribe();
        };
    }, []); // Run only once on mount

    const handlePasswordSet = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (checkingUser) return; // Don't submit while checking user

        if (!userEmail) { // Check if user check failed
            setError("Cannot set password. User session not found or link is invalid.");
            return;
        }
        if (!password) {
            setError("Password is required.");
            return;
        }
        if (password.length < 6) { // Match Supabase default minimum
            setError("Password must be at least 6 characters long.");
            return;
        }
        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);
        try {
            // Update the password for the currently logged-in user
            const { error: updateError } = await supabase.auth.updateUser({
                password: password
            });

            if (updateError) {
                throw updateError; // Throw error to be caught below
            }

            setSuccess(`Password successfully set for ${userEmail}! You will be redirected shortly...`);
            // Redirect to dashboard after a short delay
            setTimeout(() => {
                navigate('/admin-dashboard'); // Redirect to the main dashboard after success
            }, 3000); // 3 second delay

        } catch (err) {
            console.error("Error setting password:", err);
            setError(err.message || "Failed to set password. The link may have expired or already been used.");
        } finally {
            setLoading(false);
        }
    };

    // Show loading indicator while checking for user session
    if (checkingUser) {
        return (
            <Container sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Verifying invitation...</Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="xs" sx={{ mt: 8, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    p: { xs: 2, sm: 4 }, // Padding
                    bgcolor: 'background.paper',
                    borderRadius: 2,
                    boxShadow: 3,
                    width: '100%'
                }}
            >
                <Typography component="h1" variant="h5" sx={{ mb: 2 }}>
                    Set Your Password
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Setting password for: {userEmail}
                </Typography>

                {error && <Alert severity="error" sx={{ width: '100%', mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
                {success && <Alert severity="success" sx={{ width: '100%', mb: 2 }}>{success}</Alert>}

                {/* Only show form if no success message and user was found */}
                {!success && userEmail && (
                    <Box component="form" onSubmit={handlePasswordSet} noValidate sx={{ mt: 1, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="password"
                            label="New Password"
                            type="password"
                            id="password"
                            autoComplete="new-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            error={!!error && error.includes('Password')} // Basic error highlighting
                            helperText={password.length > 0 && password.length < 6 ? "Password is too short (min 6 chars)." : ""}
                            disabled={loading}
                            sx={roundedInputStyle}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm New Password"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            error={!!error && error.includes('match')} // Basic error highlighting
                            disabled={loading}
                            sx={roundedInputStyle}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 2, py: 1.5, borderRadius: 2 }}
                            disabled={loading}
                        >
                            {loading ? <CircularProgress size={24} color="inherit" /> : 'Set Password'}
                        </Button>
                    </Box>
                )}
                {/* Show link to login if there was an error finding user */}
                {!checkingUser && !userEmail && error && (
                    <Button component={Link} to="/login" variant="outlined" sx={{ mt: 2 }}>
                        Go to Login
                    </Button>
                )}
            </Box>
        </Container>
    );
};

export default SetPassword;