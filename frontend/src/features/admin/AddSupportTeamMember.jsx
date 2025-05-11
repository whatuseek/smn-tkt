
import  { useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import {
    Box, Typography, TextField, Button, Alert, CircularProgress
} from '@mui/material';

// Backend URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Style object for rounded inputs
const roundedInputStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
};

// Simple email regex for basic validation
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Placeholder function to simulate getting the token (REPLACE WITH ACTUAL LOGIC)
const getAuthToken = () => {
    console.warn("getAuthToken() is using a placeholder in AddSupportTeamMember. Replace with actual Supabase session/token retrieval.");
    return "dummy-token-for-dev-if-backend-protect-disabled";
};

// Added onUserAdded prop
const AddSupportTeamMember = ({ setUploadStatus, onUserAdded }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [formMessage, setFormMessage] = useState({ type: '', text: '' });

    const validateForm = () => {
        const newErrors = {};
        if (!email.trim()) { newErrors.email = "Email is required."; }
        else if (!emailRegex.test(email)) { newErrors.email = "Please enter a valid email address."; }
        if (!password) { newErrors.password = "Password is required."; }
        else if (password.length < 6) { newErrors.password = "Password must be at least 6 characters long."; }
        if (password !== confirmPassword) { newErrors.confirmPassword = "Passwords do not match."; }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setFormMessage({ type: '', text: '' });
        if (!validateForm()) return;

        setIsLoading(true);
        const token = getAuthToken(); // Get token before API call

        try {
            // ** TODO: Uncomment Authorization header when real auth is ready **
            const response = await axios.post(
                `${API_BASE_URL}/api/admin/add-support-user`,
                { email, password },
                {
                    headers: { Authorization: `Bearer ${token || ''}` }
                }
            );

            if (response.status === 201 && response.data.success) {
                const successMsg = response.data.message || 'Support user added successfully!';
                setFormMessage({ type: 'success', text: successMsg });
                // Use global status if function provided
                if (setUploadStatus) {
                    setUploadStatus({ message: 'Support User Added!', type: 'success', source: 'addSupportUser' });
                    setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 3000);
                }
                // Clear form
                setEmail(''); setPassword(''); setConfirmPassword(''); setErrors({});
                // Call the callback prop to notify parent (SettingsPage) to refresh list
                if (onUserAdded) {
                    onUserAdded();
                }
            } else { throw new Error(response.data?.message || "Failed to add user."); }

        } catch (err) {
            console.error("Error adding support user:", err);
            const errorMsg = err.response?.data?.message || err.message || "An error occurred.";
            setFormMessage({ type: 'error', text: errorMsg });
             if (setUploadStatus) {
                 setUploadStatus({ message: errorMsg, type: 'error', source: 'addSupportUser' });
                 setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 5000);
             }
        } finally {
            setIsLoading(false);
        }
    };

    // Form structure remains similar to previous version
    return (
        <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 3, width: '100%', borderTop: 1, borderColor: 'divider', pt: 3 }}>
             <Typography component="h3" variant="h6" sx={{ mb: 1 }}>
                 Add New Team Member
             </Typography>
            {formMessage.text && (
                <Alert severity={formMessage.type} sx={{ mb: 2, width: '100%' }}>
                    {formMessage.text}
                </Alert>
            )}
            <TextField required fullWidth margin="normal" id="email" label="New User Email Address" name="email" autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); if(errors.email) setErrors(p => ({...p, email: ''})); }} error={!!errors.email} helperText={errors.email || ''} sx={roundedInputStyle} />
            <TextField required fullWidth margin="normal" name="password" label="Password" type="password" id="password" autoComplete="new-password" value={password} onChange={(e) => { setPassword(e.target.value); if(errors.password) setErrors(p => ({...p, password: ''})); }} error={!!errors.password} helperText={errors.password || ''} sx={roundedInputStyle} />
            <TextField required fullWidth margin="normal" name="confirmPassword" label="Confirm Password" type="password" id="confirmPassword" autoComplete="new-password" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); if(errors.confirmPassword) setErrors(p => ({...p, confirmPassword: ''})); }} error={!!errors.confirmPassword} helperText={errors.confirmPassword || ''} sx={roundedInputStyle} />
            <Button type="submit" fullWidth variant="contained" disabled={isLoading} sx={{ mt: 2, mb: 1, py: 1.5, borderRadius: 2 }} >
                {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Add Member'}
            </Button>
        </Box>
    );
};

AddSupportTeamMember.propTypes = {
    setUploadStatus: PropTypes.func, // Function for global status messages
    onUserAdded: PropTypes.func.isRequired, // Callback to refresh list in parent
};

export default AddSupportTeamMember;