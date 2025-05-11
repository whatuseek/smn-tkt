// src/pages/admin/TicketReportGenerator .jsx
import { useState, useMemo, useCallback } from 'react';
import { useAdminDashboardContext } from '../../layouts/AdminDashboardLayout'; // Get context
import axiosInstance from '../../api/axiosInstance'; // API calls
import {
    Box, Typography, Paper, Grid, FormControl, InputLabel, Select, MenuItem,
    Button as MuiButton, RadioGroup, FormControlLabel, Radio, CircularProgress, Alert
} from '@mui/material'; // Grid import is correct
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, startOfDay, endOfDay, isValid } from 'date-fns'; // Import isValid
import { FaDownload } from "react-icons/fa"; // Icon for button

const TicketReportGenerator  = () => {
    // Get necessary values from context
    const { availableIssueTypes, darkMode } = useAdminDashboardContext();

    // --- State for Report Form ---
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [status, setStatus] = useState('');
    const [issueType, setIssueType] = useState('');
    const [reportFormat, setReportFormat] = useState('csv');
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');

    // Memoize issue types if they come from context
    const issueTypeOptions = useMemo(() => {
        return (availableIssueTypes && availableIssueTypes.length > 0)
            ? availableIssueTypes
            : ["Speed Issue", "Cable Complaint", "Recharge Related", "No Internet", "Others"];
    }, [availableIssueTypes]);

    // --- Report Generation Handler ---
    const handleGenerateReport = useCallback(async () => {
        setIsGenerating(true);
        setError('');
        setSuccessMessage('');

        // Validate dates before formatting
        if (startDate && endDate && !isValid(startDate)) { setError("Invalid Start Date."); setIsGenerating(false); return; }
        if (endDate && !isValid(endDate)) { setError("Invalid End Date."); setIsGenerating(false); return; }
        if (startDate && endDate && endDate < startDate) { setError("End Date cannot be before Start Date."); setIsGenerating(false); return; }


        const params = new URLSearchParams();
        if (startDate) { params.append('startDate', format(startOfDay(startDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")); }
        if (endDate) { params.append('endDate', format(endOfDay(endDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")); }
        if (status) { params.append('status', status); }
        if (issueType) { params.append('issueType', issueType); }
        params.append('format', reportFormat);

        try {
            console.log(`Requesting report with params: ${params.toString()}`);
            const response = await axiosInstance.get(`/api/reports/tickets/download`, {
                params: params,
                responseType: 'blob',
            });

            // Process successful blob response for download
            const contentType = response.headers['content-type'];
            const disposition = response.headers['content-disposition'];
            let filename = `ticket_report_${format(new Date(), 'yyyyMMdd_HHmmss')}.${reportFormat}`;

            if (disposition && disposition.includes('attachment')) {
                const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
                const matches = filenameRegex.exec(disposition);
                if (matches?.[1]) { filename = matches[1].replace(/['"]/g, ''); }
            }

            const blob = new Blob([response.data], { type: contentType });
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

            setSuccessMessage(`Report "${filename}" downloaded successfully!`);
            setTimeout(() => setSuccessMessage(''), 5000);

        } catch (err) {
            console.error("Report generation failed:", err);
            let errorMsg = "Failed to generate report.";
             if (err.code === 'ERR_NETWORK') { errorMsg = "Network Error: Could not connect. Check backend/CORS."; }
             else if (err.response) {
                 if (err.response.data instanceof Blob && err.response.data.type?.includes('json')) {
                    try { const errorJson = JSON.parse(await err.response.data.text()); errorMsg = errorJson.message || `Server error (${err.response.status})`; }
                    catch (parseError) { errorMsg = `Report failed (${err.response.status}). Error details could not be read: ${parseError.message}`; }
                 } else if (err.response.data?.message) { errorMsg = err.response.data.message; }
                 else { errorMsg = `Request failed with status code ${err.response.status}`; }
             } else if (err.message) { errorMsg = err.message; }
             setError(errorMsg);
        } finally {
            setIsGenerating(false);
        }
    }, [startDate, endDate, status, issueType, reportFormat]); // Dependencies

    return (
        <Box sx={{ mt: 2, mb: 4 }}>
            <Paper
                elevation={3}
                sx={{ p: { xs: 2, sm: 3 }, bgcolor: darkMode ? 'grey.800' : 'grey.50', color: darkMode ? 'grey.100' : 'text.primary' }}
            >
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3 }}>
                    Generate Ticket Report
                </Typography>

                {error && ( <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setError('')}> {error} </Alert> )}
                {successMessage && ( <Alert severity="success" sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setSuccessMessage('')}> {successMessage} </Alert> )}

                {/* Using Grid with container and item props */}
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="Start Date (Created)" value={startDate} onChange={(newValue) => setStartDate(newValue)}
                            slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                            sx={{ '& .MuiInputBase-root': { color: darkMode ? 'grey.100' : 'text.primary'}, '& .MuiSvgIcon-root': { color: darkMode ? 'grey.300' : 'action.active' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'}, '& .MuiInputLabel-root': { color: darkMode ? 'grey.400' : 'text.secondary' } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <DatePicker
                            label="End Date (Created)" value={endDate} onChange={(newValue) => setEndDate(newValue)}
                            minDate={startDate || undefined} slotProps={{ textField: { fullWidth: true, size: 'small' } }}
                            sx={{ '& .MuiInputBase-root': { color: darkMode ? 'grey.100' : 'text.primary'}, '& .MuiSvgIcon-root': { color: darkMode ? 'grey.300' : 'action.active' }, '& .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'}, '& .MuiInputLabel-root': { color: darkMode ? 'grey.400' : 'text.secondary' } }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="report-status-label" sx={{color: darkMode ? 'grey.400' : 'text.secondary'}}>Status</InputLabel>
                            <Select labelId="report-status-label" value={status} label="Status" onChange={(e) => setStatus(e.target.value)} sx={{ color: darkMode ? 'grey.100' : 'text.primary', '.MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'}, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'grey.600' : 'text.primary'}, '.MuiSvgIcon-root ': { fill: darkMode ? 'grey.300' : 'action.active' } }} MenuProps={{ PaperProps: { sx: { bgcolor: darkMode ? 'grey.800' : 'background.paper', color: darkMode ? 'grey.100' : 'text.primary'} } }} >
                                <MenuItem value=""><em>All Statuses</em></MenuItem>
                                <MenuItem value="Open">Open</MenuItem>
                                <MenuItem value="In Progress">In Progress</MenuItem>
                                <MenuItem value="Resolved">Resolved</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="report-issuetype-label" sx={{color: darkMode ? 'grey.400' : 'text.secondary'}}>Issue Type</InputLabel>
                            <Select labelId="report-issuetype-label" value={issueType} label="Issue Type" onChange={(e) => setIssueType(e.target.value)} sx={{ color: darkMode ? 'grey.100' : 'text.primary', '.MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'rgba(255, 255, 255, 0.23)' : 'rgba(0, 0, 0, 0.23)'}, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: darkMode ? 'grey.600' : 'text.primary'}, '.MuiSvgIcon-root ': { fill: darkMode ? 'grey.300' : 'action.active' } }} MenuProps={{ PaperProps: { sx: { bgcolor: darkMode ? 'grey.800' : 'background.paper', color: darkMode ? 'grey.100' : 'text.primary'} } }} >
                                <MenuItem value=""><em>All Issue Types</em></MenuItem>
                                {issueTypeOptions.map((type) => ( <MenuItem key={type} value={type.toUpperCase()}>{type}</MenuItem> ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <FormControl component="fieldset">
                            <Typography component="legend" variant="body2" sx={{ mb: 1, color: darkMode ? 'grey.300' : 'text.secondary', fontSize:'0.8rem' }}>Report Format</Typography>
                            <RadioGroup row name="report-format" value={reportFormat} onChange={(e) => setReportFormat(e.target.value)} >
                                <FormControlLabel value="csv" control={<Radio size="small" sx={{color: darkMode ? 'grey.500' : 'default','&.Mui-checked':{color: 'primary.main'}}}/>} label="CSV" />
                                <FormControlLabel value="xlsx" control={<Radio size="small" sx={{color: darkMode ? 'grey.500' : 'default','&.Mui-checked':{color: 'primary.main'}}}/>} label="Excel (XLSX)" />
                                <FormControlLabel value="pdf" control={<Radio size="small" sx={{color: darkMode ? 'grey.500' : 'default','&.Mui-checked':{color: 'primary.main'}}}/>} label="PDF" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: { xs:'flex-start', sm:'flex-end'} }}>
                        <MuiButton variant="contained" color="primary" onClick={handleGenerateReport} disabled={isGenerating} startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <FaDownload />} sx={{ py: 1.2, px: 3, textTransform: 'none' }} >
                            {isGenerating ? 'Generating...' : 'Generate Report'}
                        </MuiButton>
                    </Grid>
                </Grid>
            </Paper>
        </Box>
    );
};

export default TicketReportGenerator ;