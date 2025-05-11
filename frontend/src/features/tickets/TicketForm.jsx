// frontend/src/features/tickets/TicketForm.jsx
import { useState, useEffect, useCallback } from "react";
import axiosInstance from '../../api/axiosInstance';
import {
    Container, Box, Typography, TextField, Button, FormControl, InputLabel, Select, MenuItem, FormHelperText, Snackbar, Alert, CircularProgress
} from '@mui/material';
import { useAdminDashboardContext } from '../../layouts/AdminDashboardLayout';

const displayIssueTypes = ["Speed Issue", "Cable Complaint", "Recharge Related", "No Internet", "Others"];
const issueTypeMap = displayIssueTypes.reduce((acc, type) => { acc[type] = type.toUpperCase(); return acc; }, {});

const roundedElementStyle = { '& .MuiOutlinedInput-root': { borderRadius: 2 } };

const TicketForm = () => {
    const { setUploadStatus, darkMode, handleTicketDataChange } = useAdminDashboardContext();

    const [currentTime, setCurrentTime] = useState(new Date());
    const [formData, setFormData] = useState({
        user_id: "",
        mobile_number: "",
        location: "",
        issue_type: "",
        comments: "",
    });
    const [errors, setErrors] = useState({});
    const [toast, setToast] = useState({ open: false, message: "", type: "info" });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    // Individual field validation function
    const validateField = useCallback((name, value) => {
        let error = "";
        switch (name) {
            case "user_id":
                if (!value.trim()) error = "User ID is required.";
                break;
            case "mobile_number": {
                const cleanedMobile = value.replace(/\D/g, '');
                if (value.trim() && !/^\d{10}$/.test(cleanedMobile)) { // Only error if not empty and invalid
                    error = "Must be 10 digits if provided.";
                }
                break;
            }
            case "location":
                if (!value.trim()) error = "Address is required.";
                break;
            case "issue_type":
                if (!value) error = "Please select an issue type.";
                break;
            default:
                break;
        }
        setErrors(prev => ({ ...prev, [name]: error }));
        return !error; // True if valid, false if error
    }, []);

    // Full form validation (used on submit)
    const validateForm = useCallback(() => {
        const newErrors = {};
        if (!formData.user_id.trim()) newErrors.user_id = "User ID is required.";
        
        const cleanedMobile = formData.mobile_number.replace(/\D/g, '');
        if (formData.mobile_number.trim() && !/^\d{10}$/.test(cleanedMobile)) {
            newErrors.mobile_number = "Must be 10 digits if provided.";
        }
        
        if (!formData.location.trim()) newErrors.location = "Address is required.";
        if (!formData.issue_type) newErrors.issue_type = "Please select an issue type.";
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    }, [formData]);

    const handleChange = useCallback((e) => {
        const { name, value } = e.target;
        let processedValue = value;
        if (name === "mobile_number") {
            processedValue = value.replace(/\D/g, '').substring(0, 10);
        }
        setFormData(prev => ({ ...prev, [name]: processedValue }));
        // Optionally, validate on change for immediate feedback if desired,
        // but onBlur is often a better UX for text fields.
        // if (errors[name]) validateField(name, processedValue); 
    }, [/* errors, validateField */]); // Removed dependencies if not validating on direct change

    const handleBlur = useCallback((e) => { // Validate on blur
        const { name, value } = e.target;
        validateField(name, value);
    }, [validateField]);

    const handleDropdownChangeMUI = useCallback((event) => {
        const { name, value } = event.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        validateField(name, value); // Validate Select on change
    }, [validateField]);

    const clearLocalToast = useCallback(() => setToast({ open: false, message: "", type: "info" }), []);
    const clearGlobalStatus = useCallback(() => {
        if (setUploadStatus) {
            setUploadStatus(prev => (prev.source === 'ticketForm' ? { message: '', type: '', source: '' } : prev));
        }
    }, [setUploadStatus]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        clearLocalToast();
        clearGlobalStatus();

        if (!validateForm()) { // Full form validation on submit
            return;
        }
        setIsSubmitting(true);

        const backendIssueTypeValue = issueTypeMap[formData.issue_type] || formData.issue_type.toUpperCase(); // Fallback if somehow not in map
        const formDataForSubmit = {
            ...formData,
            user_id: formData.user_id.trim(),
            mobile_number: formData.mobile_number.replace(/\D/g, '') || null,
            issue_type: backendIssueTypeValue,
            comments: formData.comments.trim(),
        };

        try {
            const response = await axiosInstance.post(`/api/tickets`, formDataForSubmit);
            if (response.status === 201 && response.data.success) {
                const successMsg = response.data.message || "Ticket created successfully!";
                setToast({ open: true, message: successMsg, type: "success" });
                setFormData({ user_id: "", mobile_number: "", location: "", issue_type: "", comments: "" });
                setErrors({});
                if (setUploadStatus) { setUploadStatus({ message: "Ticket Created!", type: "success", source: "ticketForm" }); setTimeout(clearGlobalStatus, 3000); }
                if (handleTicketDataChange) handleTicketDataChange();
            } else {
                throw new Error(response.data?.message || "Ticket creation failed with an unexpected response.");
            }
        } catch (err) {
            console.error("Error creating ticket:", err);
            const errorMsg = err.response?.data?.message || err.message || "An error occurred while creating the ticket.";
            setToast({ open: true, message: errorMsg, type: "error" });
            if (setUploadStatus) { setUploadStatus({ message: errorMsg, type: "error", source: "ticketForm" }); /* Don't auto-clear global error */ }
        } finally {
            setIsSubmitting(false);
        }
    }, [formData, validateForm, clearLocalToast, clearGlobalStatus, setUploadStatus, handleTicketDataChange]);

    const handleCloseToast = useCallback((event, reason) => {
        if (reason === 'clickaway') return;
        clearLocalToast();
    }, [clearLocalToast]);

    // Check if any errors exist in the errors state object
    const hasErrors = Object.values(errors).some(error => error !== "");

    return (
        <Container maxWidth="sm" sx={{ mt: { xs: 1, sm: 2 }, mb: 4 }}>
            <Box component="form" onSubmit={handleSubmit} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: { xs: 2, sm: 3 }, bgcolor: darkMode ? 'grey.900' : 'background.paper', color: darkMode ? 'grey.100' : 'text.primary', borderRadius: 3, boxShadow: darkMode ? '0px 4px_20px rgba(0,0,0, 0.5)' : '0px 4px 20px rgba(0, 0, 0, 0.1)' }} >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, borderBottom: 1, borderColor: darkMode ? 'grey.700' : 'divider', pb: 1.5 }}>
                    <Typography variant="h5" component="h2" sx={{ fontFamily: 'Raleway', fontWeight: 'medium' }}>Create New Ticket</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right' }}>
                        {currentTime.toLocaleDateString("en-US", { month: "short", day: "numeric" })} <br /> {currentTime.toLocaleTimeString("en-US", { hour12: true, hour: "2-digit", minute: "2-digit" })}
                    </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
                    <TextField required fullWidth id="user_id" name="user_id" label="User ID"
                        value={formData.user_id}
                        onChange={handleChange}
                        onBlur={handleBlur} // Validate on blur
                        disabled={isSubmitting}
                        error={!!errors.user_id}
                        helperText={errors.user_id || ' '} // Provide space to maintain height
                        sx={roundedElementStyle}
                        size="small"
                    />
                    <TextField fullWidth id="mobile_number" name="mobile_number" label="Mobile Number (Optional)" type="tel"
                        value={formData.mobile_number}
                        onChange={handleChange}
                        onBlur={handleBlur} // Validate on blur
                        disabled={isSubmitting}
                        error={!!errors.mobile_number}
                        helperText={errors.mobile_number || '10 digits, numeric only.'} // Refined helper text
                        inputProps={{ maxLength: 10 }}
                        sx={roundedElementStyle}
                        size="small"
                    />
                </Box>
                <TextField required fullWidth id="location" name="location" label="Address" multiline rows={2}
                    value={formData.location}
                    onChange={handleChange}
                    onBlur={handleBlur} // Validate on blur
                    disabled={isSubmitting}
                    error={!!errors.location}
                    helperText={errors.location || ' '}
                    sx={roundedElementStyle}
                    size="small"
                />
                <FormControl fullWidth required error={!!errors.issue_type} sx={roundedElementStyle} size="small">
                    <InputLabel id="issue-type-select-label">Issue Type</InputLabel>
                    <Select
                        labelId="issue-type-select-label" id="issue_type" name="issue_type"
                        label="Issue Type" // Removed *, label itself indicates required
                        value={formData.issue_type}
                        onChange={handleDropdownChangeMUI} // Select validates on change
                        disabled={isSubmitting}
                        MenuProps={{ PaperProps: { sx: { bgcolor: darkMode ? 'grey.800' : 'background.paper', color: darkMode ? 'grey.100' : 'text.primary'} } }}
                    >
                        <MenuItem value="" disabled><em>Select an issue type</em></MenuItem>
                        {displayIssueTypes.map((type) => ( <MenuItem key={type} value={type} sx={{ '&:hover': { bgcolor: darkMode ? 'grey.700' : 'action.hover' } }}>{type}</MenuItem> ))}
                    </Select>
                    {errors.issue_type && <FormHelperText>{errors.issue_type}</FormHelperText>}
                    {!errors.issue_type && <FormHelperText> </FormHelperText>} {/* Maintain height */}
                </FormControl>
                <TextField fullWidth id="comments" name="comments" label="Description (Optional)" multiline rows={3}
                    value={formData.comments}
                    onChange={handleChange}
                    // onBlur={handleBlur} // Optional: validate comments on blur if needed
                    disabled={isSubmitting}
                    helperText=" " // Maintain height
                    sx={roundedElementStyle}
                    size="small"
                />
                <Button type="submit" variant="contained" fullWidth 
                    disabled={isSubmitting || hasErrors} // Disable button if submitting OR if there are errors
                    sx={{ mt: 1, py: 1.2, borderRadius: 2, textTransform: 'none', fontSize: '1rem' }} 
                >
                    {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Submit Ticket'}
                </Button>
            </Box>
            <Snackbar open={toast.open} autoHideDuration={toast.type === 'success' ? 4000 : 6000} onClose={handleCloseToast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} >
                <Alert onClose={handleCloseToast} severity={toast.type} variant="filled" sx={{ width: '100%' }} >
                    {toast.message}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TicketForm;