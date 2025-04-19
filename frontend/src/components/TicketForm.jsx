// frontend/src/components/TicketForm.jsx
import { useState, useEffect } from "react";
import axiosInstance from '../api/axiosInstance'; // Use configured instance
import PropTypes from 'prop-types';
import {
    Container, Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, FormHelperText, Snackbar, Alert, CircularProgress
} from '@mui/material';

// User-friendly display names
const displayIssueTypes = [
    "Speed Issue",
    "Cable Complaint",
    "Recharge Related",
    "No Internet",
    "Others",
];

// --- Define AND USE issueTypeMap ---
// Map display values to the specific values expected by the backend (e.g., uppercase)
const issueTypeMap = displayIssueTypes.reduce((acc, type) => {
    // Assuming backend expects UPPERCASE. Adjust if different.
    acc[type] = type.toUpperCase();
    return acc;
}, {});
// --- End issueTypeMap Definition ---


// Style object for rounded dropdown/inputs
const roundedElementStyle = {
    '& .MuiOutlinedInput-root': { borderRadius: 2 }
};


const TicketForm = ({ setUploadStatus }) => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [formData, setFormData] = useState({
        user_id: "",
        mobile_number: "",
        location: "",
        issue_type: "", // This will now store the DISPLAY value (e.g., "Speed Issue")
        comments: "",
    });
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ open: false, message: "", type: "info" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const clearLocalToast = () => { setToast({ open: false, message: "", type: "info" }); };
    const clearGlobalStatus = () => { if (setUploadStatus) { setUploadStatus(prev => (prev.source === 'ticketForm' ? { message: '', type: '', source: '' } : prev)); } };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) { setErrors(prev => ({ ...prev, [name]: "" })); }
    };

    // Handle MUI Select change for Issue Type
    const handleDropdownChangeMUI = (event) => {
        const { name, value } = event.target; // value will be the DISPLAY value ("Speed Issue")
        setFormData(prev => ({ ...prev, [name]: value })); // Store the DISPLAY value in state
        if (errors.issue_type) { setErrors(prev => ({ ...prev, issue_type: "" })); }
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.user_id.trim()) newErrors.user_id = "User ID is required.";
        const cleanedMobile = formData.mobile_number.replace(/\D/g, '');
        if (formData.mobile_number && !/^\d{10}$/.test(cleanedMobile)) { newErrors.mobile_number = "Enter a valid 10-digit mobile number or leave blank."; }
        if (!formData.location.trim()) newErrors.location = "Address is required.";
        if (!formData.issue_type) newErrors.issue_type = "Please select an issue type."; // Check if display value is selected
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        clearLocalToast(); clearGlobalStatus();
        if (!validateForm()) return;
        setIsSubmitting(true);

        // --- Prepare data for submission USING the map ---
        const backendIssueTypeValue = issueTypeMap[formData.issue_type]; // Get "SPEED ISSUE" from "Speed Issue"
        if (!backendIssueTypeValue) {
            // This should ideally not happen if validation passes, but handle defensively
            console.error("Inconsistency: Selected issue type not found in map", formData.issue_type);
            setToast({ open: true, message: "Invalid issue type selected.", type: "error" });
            setIsSubmitting(false);
            return;
        }

        const userIdValue = formData.user_id; // Get value from state
        console.log(`Raw user_id from state before submit: "[${userIdValue}]"`); // Log with brackets to see spaces
        const formDataForSubmit = {
            ...formData, // includes user_id, location, comments
            user_id: userIdValue.trim(), // Ensure trim happens here too
            mobile_number: formData.mobile_number.replace(/\D/g, '') || null,
            issue_type: backendIssueTypeValue // <-- Send the mapped (e.g., uppercase) value
        };
        // --- End data preparation ---

        console.log("Submitting Mapped Ticket Data:", formDataForSubmit);

        try {
            const response = await axiosInstance.post(`/api/tickets`, formDataForSubmit);
            if (response.status === 201 && response.data.success) {
                const successMsg = response.data.message || "Ticket created successfully!";
                setToast({ open: true, message: successMsg, type: "success" });
                setFormData({ user_id: "", mobile_number: "", location: "", issue_type: "", comments: "" }); // Reset form
                setErrors({});
                if (setUploadStatus) { setUploadStatus({ message: "Ticket Created!", type: "success", source: "ticketForm" }); setTimeout(clearGlobalStatus, 3000); }
            } else { throw new Error(response.data?.message || "Ticket creation failed."); }
        } catch (err) {
            console.error("Error creating ticket:", err);
            const errorMsg = err.response?.data?.message || err.message || "Error creating ticket.";
            setToast({ open: true, message: errorMsg, type: "error" });
            if (setUploadStatus) { setUploadStatus({ message: errorMsg, type: "error", source: "ticketForm" }); setTimeout(clearGlobalStatus, 5000); }
        } finally { setIsSubmitting(false); }
    };

    const handleCloseToast = (event, reason) => { if (reason === 'clickaway') return; clearLocalToast(); };

    return (
        <Container maxWidth="sm" sx={{ mt: { xs: 1, sm: 2 }, mb: 4 }}>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2, p: { xs: 2, sm: 3 }, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 3 }} >
                {/* Title and Timestamp */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, borderBottom: 1, borderColor: 'divider', pb: 1.5 }}>
                    <Typography variant="h5" component="h2" sx={{ fontFamily: 'Raleway', fontWeight: 'medium' }}>Create New Ticket</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
                        {currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })} <br /> {currentTime.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit" })}
                    </Typography>
                </Box>
                {/* User ID and Mobile Number Row */}
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <TextField required fullWidth id="user_id" name="user_id" label="User ID" value={formData.user_id} onChange={handleChange} disabled={isSubmitting} error={!!errors.user_id} helperText={errors.user_id || ''} sx={roundedElementStyle} size="small" />
                    <TextField fullWidth id="mobile_number" name="mobile_number" label="Mobile Number (Optional)" type="tel" value={formData.mobile_number} onChange={handleChange} disabled={isSubmitting} error={!!errors.mobile_number} helperText={errors.mobile_number || ''} inputProps={{ maxLength: 10 }} sx={roundedElementStyle} size="small" />
                </Box>
                {/* Address */}
                <TextField required fullWidth id="location" name="location" label="Address" multiline rows={2} value={formData.location} onChange={handleChange} disabled={isSubmitting} error={!!errors.location} helperText={errors.location || ''} sx={roundedElementStyle} size="small" />

                {/* Issue Type Select - Value is now the DISPLAY value */}
                <FormControl fullWidth required error={!!errors.issue_type} sx={roundedElementStyle} size="small">
                    <InputLabel id="issue-type-select-label">Issue Type</InputLabel>
                    <Select
                        labelId="issue-type-select-label"
                        id="issue_type"
                        name="issue_type"
                        label="Issue Type *"
                        value={formData.issue_type} // Bind to the display value in state
                        onChange={handleDropdownChangeMUI} // Sets the display value in state
                        disabled={isSubmitting}
                    >
                        {/* Iterate through display types for options */}
                        {displayIssueTypes.map((type) => (
                            <MenuItem key={type} value={type}> {/* Value is the display value */}
                                {type} {/* Text is the display value */}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.issue_type && <FormHelperText>{errors.issue_type}</FormHelperText>}
                </FormControl>

                {/* Comments */}
                <TextField fullWidth id="comments" name="comments" label="Description (Optional)" multiline rows={3} value={formData.comments} onChange={handleChange} disabled={isSubmitting} sx={roundedElementStyle} size="small" />
                {/* Submit Button */}
                <Button type="submit" variant="contained" fullWidth disabled={isSubmitting} sx={{ mt: 1, py: 1.2, borderRadius: 2, textTransform: 'none', fontSize: '1rem' }} >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Ticket'}
                </Button>
            </Box>
            {/* Snackbar */}
            <Snackbar open={toast.open} autoHideDuration={4000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} >
                <Alert onClose={handleCloseToast} severity={toast.type} variant="filled" sx={{ width: '100%' }} > {toast.message} </Alert>
            </Snackbar>
        </Container>
    );
};

TicketForm.propTypes = { setUploadStatus: PropTypes.func };
export default TicketForm;