// src/features/reports/TicketSummaryReport.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types'; // Added for StatCard prop validation
import { useAdminDashboardContext } from '../../layouts/AdminDashboardLayout';
import axiosInstance from '../../api/axiosInstance';
import {
    Box, Typography, Paper, CircularProgress, Alert, Grid, List, ListItem,
    ListItemText, Divider, Button as MuiButton, CardContent,
    Accordion, AccordionSummary, AccordionDetails,
    useMediaQuery
} from '@mui/material';
import { useTheme } from '@mui/material/styles'; // Import useTheme
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, startOfDay, endOfDay, isValid } from 'date-fns'; // Removed subDays as default is now "all time"
import { FaFilter, FaChevronDown, FaTicketAlt, FaFolderOpen, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaListOl } from 'react-icons/fa';

// Reusable Stat Card component
const StatCard = ({ title, value, icon, color, darkMode, variant = "h4" }) => {
    const theme = useTheme(); // Access theme for fallback colors if needed
    return (
        <Paper
            elevation={2}
            sx={{
                p: 2,
                bgcolor: darkMode ? 'grey.700' : 'grey.100',
                color: darkMode ? 'grey.100' : 'text.primary',
                height: '100%',
                borderRadius: 2,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center'
            }}
        >
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 1, '&:last-child': { pb: 1 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    {icon && React.createElement(icon, { style: { marginRight: '10px', fontSize: '1.2em', color: color || (darkMode ? theme.palette.grey[400] : theme.palette.grey[600]) } })}
                    <Typography variant="overline" sx={{ color: darkMode ? 'grey.300' : 'text.secondary', lineHeight: 1.2 }}>{title}</Typography>
                </Box>
                <Typography variant={variant} component="div" sx={{ fontWeight: 'bold', textAlign: 'center', mt: 'auto' }}>
                    {value === undefined || value === null ? '0' : value}
                </Typography>
            </CardContent>
        </Paper>
    );
};

StatCard.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    icon: PropTypes.elementType,
    color: PropTypes.string,
    darkMode: PropTypes.bool.isRequired,
    variant: PropTypes.string,
};


const TicketSummaryReport = () => {
    const { darkMode, setUploadStatus } = useAdminDashboardContext(); // availableIssueTypes removed as not used here
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [summaryData, setSummaryData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(null); // Default to null for "All Time"
    const [endDate, setEndDate] = useState(null);   // Default to null for "All Time"
    const [filtersExpanded, setFiltersExpanded] = useState(!isMobile);

    const fetchSummary = useCallback(async () => {
        setIsLoading(true); setError(''); setSummaryData(null);
        if (setUploadStatus) setUploadStatus({ message: '', type: '', source: 'summaryReportFetch' }); // Clear global status

        if (startDate && !isValid(startDate)) { setError("Invalid Start Date."); setIsLoading(false); return; }
        if (endDate && !isValid(endDate)) { setError("Invalid End Date."); setIsLoading(false); return; }
        if (startDate && endDate && endDate < startDate) { setError("End Date cannot be before Start Date."); setIsLoading(false); return; }

        const params = new URLSearchParams();
        if (startDate) { params.append('startDate', format(startOfDay(startDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")); }
        if (endDate) { params.append('endDate', format(endOfDay(endDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")); }

        try {
            const response = await axiosInstance.get(`/api/reports/tickets/summary`, { params });
            setSummaryData(response.data);
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || "Failed to load summary data.";
            setError(errorMsg);
            if (setUploadStatus) setUploadStatus({ message: errorMsg, type: 'error', source: 'summaryReportFetch' });
        } finally {
            setIsLoading(false);
        }
    }, [startDate, endDate, setUploadStatus]); // Removed issueType if not used as filter here

    useEffect(() => {
        fetchSummary(); // Fetch on initial load (will be "all time" or default range)
    }, [fetchSummary]);

    useEffect(() => {
        setFiltersExpanded(!isMobile);
    }, [isMobile]);

    const majorIssue = useMemo(() => {
        if (summaryData?.byIssueType && summaryData.byIssueType.length > 0) {
            // Backend already sorts by count descending
            return summaryData.byIssueType[0];
        }
        return null;
    }, [summaryData]);

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 2 }}>
                Ticket Summary Report
            </Typography>

            <Accordion
                expanded={filtersExpanded} onChange={() => setFiltersExpanded(!filtersExpanded)}
                sx={{ bgcolor: darkMode ? 'grey.800' : 'grey.50', color: darkMode ? 'grey.100' : 'text.primary', boxShadow: 2, borderRadius: 2, mb: 3, '&.Mui-expanded': { mb: 2 }, '&:before': { display: 'none' } }}
                disableGutters elevation={1}
            >
                <AccordionSummary expandIcon={<FaChevronDown style={{ color: darkMode ? theme.palette.grey[400] : theme.palette.action.active }}/>} aria-controls="filter-criteria-content" id="filter-criteria-header" sx={{ borderBottom: filtersExpanded ? `1px solid ${theme.palette.divider}` : 'none', minHeight: '48px', '&.Mui-expanded': { minHeight: '48px' } }} >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Filter Criteria</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2, borderTop: filtersExpanded ? `1px solid ${theme.palette.divider}` : 'none' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={5} md={5}>
                            <DatePicker label="Start Date (Created)" value={startDate} onChange={setStartDate} slotProps={{ textField: { fullWidth: true, size: 'small' } }} sx={{ bgcolor: darkMode ? 'grey.700' : 'background.paper', borderRadius: 1 }} />
                        </Grid>
                        <Grid item xs={12} sm={5} md={5}>
                            <DatePicker label="End Date (Created)" value={endDate} onChange={setEndDate} minDate={startDate} slotProps={{ textField: { fullWidth: true, size: 'small' } }} sx={{ bgcolor: darkMode ? 'grey.700' : 'background.paper', borderRadius: 1 }} />
                        </Grid>
                        <Grid item xs={12} sm={2} md={2}>
                            <MuiButton fullWidth variant="contained" onClick={fetchSummary} disabled={isLoading} startIcon={isLoading ? <CircularProgress size={16} color="inherit"/> : <FaFilter size="0.8em"/>}>Apply</MuiButton>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {isLoading && ( <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box> )}
            {error && ( <Alert severity="error" sx={{ my: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert> )}

            {summaryData && !isLoading && (
                <Paper elevation={3} sx={{ p: {xs: 2, sm: 3}, bgcolor: darkMode ? 'grey.850' : 'background.paper', borderRadius: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ textAlign: 'center', mb: 3, color: darkMode? 'grey.400' : 'text.secondary' }}>
                         Summary for: {summaryData.filterCriteria?.startDate !== 'N/A' ? summaryData.filterCriteria.startDate : 'All Time'} to {summaryData.filterCriteria?.endDate !== 'N/A' ? summaryData.filterCriteria.endDate : 'Present'}
                    </Typography>

                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        <Grid item xs={12} sm={6} md={3}><StatCard title="Total Tickets" value={summaryData.totalTickets} icon={FaTicketAlt} darkMode={darkMode} /></Grid>
                        <Grid item xs={12} sm={6} md={3}><StatCard title="Open" value={summaryData.byStatus?.Open} icon={FaFolderOpen} color={theme.palette.info.main} darkMode={darkMode} /></Grid>
                        <Grid item xs={12} sm={6} md={3}><StatCard title="In Progress" value={summaryData.byStatus?.['In Progress']} icon={FaSpinner} color={theme.palette.warning.main} darkMode={darkMode} /></Grid>
                        <Grid item xs={12} sm={6} md={3}><StatCard title="Resolved" value={summaryData.byStatus?.Resolved} icon={FaCheckCircle} color={theme.palette.success.main} darkMode={darkMode} /></Grid>
                    </Grid>

                    <Grid container spacing={3}>
                        {majorIssue && (
                            <Grid item xs={12} md={6}>
                                 <Paper elevation={1} sx={{ p: 2, height: '100%', bgcolor: darkMode ? 'grey.700' : 'grey.100', borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                         <FaExclamationTriangle style={{ marginRight: '10px', fontSize: '1.3em', color: theme.palette.error.main }} />
                                        <Typography variant="h6" component="h3" sx={{color: darkMode ? 'grey.100' : 'text.primary'}}>Major Issue Faced</Typography>
                                    </Box>
                                    <Typography variant="h5" component="p" sx={{ fontWeight:'bold', mb:0.5, color: darkMode ? theme.palette.error.light : theme.palette.error.dark }}>{majorIssue.issue_type}</Typography>
                                    <Typography variant="body1" sx={{color: darkMode ? 'grey.300' : 'text.secondary'}}>{majorIssue.count} reported tickets</Typography>
                                 </Paper>
                            </Grid>
                        )}
                        {summaryData.byIssueType && summaryData.byIssueType.length > 0 && (
                             <Grid item xs={12} md={majorIssue ? 6 : 12}>
                                 <Paper elevation={1} sx={{ p: 2, height: '100%', bgcolor: darkMode ? 'grey.700' : 'grey.100', borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                         <FaListOl style={{ marginRight: '10px', fontSize: '1.3em', color: darkMode ? 'grey.400' : 'grey.600' }} />
                                        <Typography variant="h6" component="h3" sx={{color: darkMode ? 'grey.100' : 'text.primary'}}>Issue Types by Frequency</Typography>
                                    </Box>
                                    <List dense sx={{maxHeight: 200, overflow: 'auto'}}>
                                        {summaryData.byIssueType.map((item, index) => (
                                            <React.Fragment key={item.issue_type}>
                                                <ListItem disableGutters sx={{py: 0.75}}>
                                                    <ListItemText primary={item.issue_type} primaryTypographyProps={{ variant: 'body1', color: darkMode ? 'grey.200' : 'text.secondary' }} />
                                                    <Typography variant="body1" sx={{ fontWeight: 'medium', color: darkMode ? 'grey.100' : 'text.primary' }}>{item.count}</Typography>
                                                </ListItem>
                                                {index < summaryData.byIssueType.length - 1 && <Divider light sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}} />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                 </Paper>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            )}
            {!summaryData && !isLoading && !error && (
                 <Paper elevation={1} sx={{p:2, textAlign:'center', bgcolor: darkMode ? 'grey.800' : 'grey.50', color: darkMode ? 'grey.400' : 'text.secondary', borderRadius: 2}}>
                     <Typography>Apply date filters to generate a summary, or view all-time summary.</Typography>
                 </Paper>
            )}
        </Box>
    );
};

export default TicketSummaryReport;          