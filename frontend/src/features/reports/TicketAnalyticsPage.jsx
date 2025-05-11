// src/features/reports/TicketAnalyticsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAdminDashboardContext } from '../../layouts/AdminDashboardLayout';
import axiosInstance from '../../api/axiosInstance';
import {
    Box, Typography, Paper, CircularProgress, Alert, Grid, Button as MuiButton,
    FormControl, InputLabel, Select, MenuItem,
    List, ListItem, ListItemText, Divider, Card, CardContent,
    Accordion, AccordionSummary, AccordionDetails,
    useMediaQuery,
    RadioGroup, FormControlLabel, Radio, FormLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, startOfDay, endOfDay, isValid } from 'date-fns';
import { FaFilter, FaChevronDown, FaTicketAlt, FaFolderOpen, FaSpinner, FaCheckCircle, FaExclamationTriangle, FaListOl } from 'react-icons/fa';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

// Reusable Stat Card component (No changes needed here)
const StatCard = ({ title, value, icon, color, darkMode, variant = "h4" }) => {
    const theme = useTheme();
    return (
        <Card elevation={2} sx={{ bgcolor: darkMode ? 'grey.700' : 'grey.100', color: darkMode ? 'grey.100' : 'text.primary', height: '100%', borderRadius: 2, display: 'flex', flexDirection: 'column' }}>
            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}> {icon && React.createElement(icon, { style: { marginRight: '10px', fontSize: '1.2em', color: color || (darkMode ? theme.palette.grey[400] : theme.palette.grey[600]) } })} <Typography variant="overline" sx={{ color: darkMode ? 'grey.300' : 'text.secondary', lineHeight: 1.2 }}>{title}</Typography> </Box>
                <Typography variant={variant} component="div" sx={{ fontWeight: 'bold', textAlign: 'center', mt: 'auto' }}> {value === undefined || value === null ? '0' : value} </Typography>
            </CardContent>
        </Card>
    );
};
StatCard.propTypes = { title: PropTypes.string.isRequired, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), icon: PropTypes.elementType, color: PropTypes.string, darkMode: PropTypes.bool.isRequired, variant: PropTypes.string, };


// **** CUSTOM TOOLTIP COMPONENT - USING 'data' VARIABLE ****
const CustomTooltip = ({ active, payload, label }) => {
    const theme = useTheme();

    if (active && payload && payload.length) {
        // Assign payload to data variable
        const data = payload[0].payload;
        // Use the label from the payload ('data' variable) instead of the direct 'label' prop
        const displayLabel = data?.label || label || 'N/A'; // Use data.label, fallback to prop label
        const displayValue = payload[0].value;

        return (
            <Paper elevation={3} sx={{ p: 1, bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" display="block" gutterBottom sx={{ color: theme.palette.text.secondary }}>
                    {/* Use the displayLabel derived from 'data' */}
                    Hour: {displayLabel}
                </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 'medium' }}>
                    {`${displayValue} tickets`}
                </Typography>
            </Paper>
        );
    }
    return null;
};

CustomTooltip.propTypes = {
    active: PropTypes.bool,
    payload: PropTypes.arrayOf(
        PropTypes.shape({
            payload: PropTypes.shape({
                label: PropTypes.string, // We expect label inside payload.payload
                count: PropTypes.number,
                hour: PropTypes.number,
            }),
            value: PropTypes.number,
            name: PropTypes.string,
        })
    ),
    label: PropTypes.string, // Recharts also passes the axis label directly
};
// **** END CUSTOM TOOLTIP COMPONENT ****


// Main Page Component (Logic remains the same)
const TicketAnalyticsPage = () => {
    const { darkMode, setUploadStatus, availableIssueTypes } = useAdminDashboardContext();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const [reportData, setReportData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);
    const [issueType, setIssueType] = useState('');
    const [filtersExpanded, setFiltersExpanded] = useState(!isMobile);
    const [chartType, setChartType] = useState('bar');

    const issueTypeOptions = useMemo(() => { return (availableIssueTypes && availableIssueTypes.length > 0) ? availableIssueTypes : ["Speed Issue", "Cable Complaint", "Recharge Related", "No Internet", "Others"]; }, [availableIssueTypes]);
    const fetchCombinedReportData = useCallback(async () => { setIsLoading(true); setError(''); setReportData(null); if (setUploadStatus) setUploadStatus({ message: '', type: '', source: '' }); if (startDate && !isValid(startDate)) { setError("Invalid Start Date."); setIsLoading(false); return; } if (endDate && !isValid(endDate)) { setError("Invalid End Date."); setIsLoading(false); return; } if (startDate && endDate && endDate < startDate) { setError("End Date cannot be before Start Date."); setIsLoading(false); return; } const params = new URLSearchParams(); if (startDate) { params.append('startDate', format(startOfDay(startDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")); } if (endDate) { params.append('endDate', format(endOfDay(endDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")); } if (issueType && chartType !== 'pie') { params.append('issueType', issueType); } try { const response = await axiosInstance.get(`/api/reports/tickets/combined`, { params }); setReportData(response.data); } catch (err) { setError(err.response?.data?.message || err.message || "Failed data fetch."); if (setUploadStatus) setUploadStatus({ message: err.response?.data?.message || err.message || "Failed.", type: 'error', source: 'combinedReportFetch' }); } finally { setIsLoading(false); } }, [startDate, endDate, issueType, chartType, setUploadStatus]);
    useEffect(() => { fetchCombinedReportData(); }, [fetchCombinedReportData]);
    useEffect(() => { setFiltersExpanded(!isMobile); }, [isMobile]);
    useEffect(() => { if (chartType === 'pie' && issueType !== '') { setIssueType(''); } }, [chartType, issueType]);

    const hourlyChartData = useMemo(() => reportData?.hourlyDistribution || [], [reportData]);
    const issueFrequencyData = useMemo(() => reportData?.byIssueType || [], [reportData]);
    const activeHoursData = useMemo(() => hourlyChartData.filter(d => d.count > 0), [hourlyChartData]);
    const majorIssue = useMemo(() => issueFrequencyData?.[0], [issueFrequencyData]);
    const MUI_CHART_COLORS_MEMO = useMemo(() => [theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main, theme.palette.error.main, theme.palette.warning.main, theme.palette.info.main, theme.palette.primary.light, theme.palette.secondary.light, theme.palette.success.light, theme.palette.error.light, theme.palette.warning.light, theme.palette.info.light,], [theme]);

    return (
        <Box sx={{ mb: 4 }}>
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 2 }}> Ticket Analytics & Insights </Typography>
            {/* Collapsible Filter Section */}
            <Accordion expanded={filtersExpanded} onChange={() => setFiltersExpanded(!filtersExpanded)} sx={{ bgcolor: darkMode ? 'grey.800' : 'grey.50', color: darkMode ? 'grey.100' : 'text.primary', boxShadow: 2, borderRadius: 2, mb: 3, '&.Mui-expanded': { mb: 2, }, '&:before': { display: 'none', } }} disableGutters elevation={1} >
                <AccordionSummary expandIcon={<FaChevronDown style={{ color: darkMode ? theme.palette.grey[400] : theme.palette.action.active }} />} aria-controls="filter-criteria-content" id="filter-criteria-header" sx={{ borderBottom: filtersExpanded ? `1px solid ${theme.palette.divider}` : 'none', minHeight: '48px', '&.Mui-expanded': { minHeight: '48px' } }} > <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Filter Criteria</Typography> </AccordionSummary>
                <AccordionDetails sx={{ p: 2, borderTop: filtersExpanded ? `1px solid ${theme.palette.divider}` : 'none' }}>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6} md={3}> <DatePicker label="Start Date" value={startDate} onChange={setStartDate} slotProps={{ textField: { fullWidth: true, size: 'small', error: !!error && (error.includes("Start Date") || error.includes("date range")) } }} sx={{ bgcolor: 'transparent', '& .MuiInputBase-input': { color: theme.palette.text.primary }, '& .MuiSvgIcon-root': { color: theme.palette.action.active }, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }, '& .MuiInputLabel-root': { color: theme.palette.text.secondary } }} /> </Grid>
                        <Grid item xs={12} sm={6} md={3}> <DatePicker label="End Date" value={endDate} onChange={setEndDate} minDate={startDate} slotProps={{ textField: { fullWidth: true, size: 'small', error: !!error && (error.includes("End Date") || error.includes("date range")) } }} sx={{ bgcolor: 'transparent', '& .MuiInputBase-input': { color: theme.palette.text.primary }, '& .MuiSvgIcon-root': { color: theme.palette.action.active }, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }, '& .MuiInputLabel-root': { color: theme.palette.text.secondary } }} /> </Grid>

                        
                        <Grid item xs={12} sm={12} md={6} lg={3}> <FormControl fullWidth size="small" disabled={chartType === 'pie'} sx={{ bgcolor: 'transparent' }}> <InputLabel id="a-it-label" sx={{ color: chartType === 'pie' ? theme.palette.text.disabled : theme.palette.text.secondary }}>Issue Type (N/A for Pie)</InputLabel> <Select labelId="a-it-label" value={issueType} label="Issue Type (N/A for Pie)" onChange={(e) => setIssueType(e.target.value)} disabled={chartType === 'pie'} sx={{ color: chartType === 'pie' ? theme.palette.text.disabled : theme.palette.text.primary, '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.primary }, '.MuiSvgIcon-root ': { fill: chartType === 'pie' ? theme.palette.action.disabled : theme.palette.action.active } }} MenuProps={{ PaperProps: { sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary } } }} > <MenuItem value=""><em>All Issue Types</em></MenuItem> {issueTypeOptions.map((type) => (<MenuItem key={type} value={type.toUpperCase()}>{type}</MenuItem>))} </Select> </FormControl> </Grid>
                        <Grid item xs={12} sm={6} md={4} lg={2}> <FormControl component="fieldset" size="small"> <FormLabel component="legend" sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary, mb: -0.5 }}>Chart Type</FormLabel> <RadioGroup row name="chart-type-selector" value={chartType} onChange={(e) => setChartType(e.target.value)} > <FormControlLabel value="bar" control={<Radio size="small" sx={{ color: darkMode ? 'grey.500' : 'default', '&.Mui-checked': { color: 'primary.main' } }} />} label="Bar" /> <FormControlLabel value="line" control={<Radio size="small" sx={{ color: darkMode ? 'grey.500' : 'default', '&.Mui-checked': { color: 'primary.main' } }} />} label="Line" /> <FormControlLabel value="area" control={<Radio size="small" sx={{ color: darkMode ? 'grey.500' : 'default', '&.Mui-checked': { color: 'primary.main' } }} />} label="Area" /> <FormControlLabel value="pie" control={<Radio size="small" sx={{ color: darkMode ? 'grey.500' : 'default', '&.Mui-checked': { color: 'primary.main' } }} />} label="Pie (Types)" /> </RadioGroup> </FormControl> </Grid>
                        <Grid item xs={12} sm={6} md={2} lg={1}> <MuiButton fullWidth variant="contained" onClick={fetchCombinedReportData} disabled={isLoading} startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <FaFilter size="0.8em" />}>Analyze</MuiButton> </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            

            {/* Display Area */}
            {isLoading && (<Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>)}
            {error && (<Alert severity="error" sx={{ my: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>)}

            {reportData && !isLoading && (
                <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, bgcolor: darkMode ? 'grey.850' : 'background.paper', borderRadius: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ textAlign: 'center', mb: 3, color: darkMode ? 'grey.400' : 'text.secondary' }}> Summary for: {reportData.filterCriteria?.startDate !== 'N/A' ? reportData.filterCriteria.startDate : 'All Time'} to {reportData.filterCriteria?.endDate !== 'N/A' ? reportData.filterCriteria.endDate : 'Present'} </Typography>
                    
{/* Chart Cards */}
                    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: darkMode ? 'grey.800' : 'background.paper', borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: darkMode ? 'grey.100' : 'text.primary', textAlign: 'center' }}>
                            {chartType === 'pie' ? 'Issue Type Distribution' : 'Hourly Ticket Distribution'}
                            {chartType !== 'pie' && ` (${chartType.charAt(0).toUpperCase() + chartType.slice(1)} Chart)`}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2, color: darkMode ? 'grey.300' : 'text.secondary' }}> Period: {reportData.filterCriteria?.startDate !== 'N/A' ? reportData.filterCriteria.startDate : 'Start'} to {reportData.filterCriteria?.endDate !== 'N/A' ? reportData.filterCriteria.endDate : 'End'} {chartType !== 'pie' && ` | For: ${reportData.filterCriteria?.issueType || 'All Issues'}`} </Typography>
                        {/* Conditional Chart Rendering */}
                        {chartType === 'bar' && ((hourlyChartData.reduce((sum, item) => sum + item.count, 0) > 0) ? (<Box sx={{ height: 350, width: '100%' }}><ResponsiveContainer width="100%" height="100%"><BarChart data={hourlyChartData} margin={{ top: 5, right: isMobile ? 5 : 30, left: 20, bottom: isMobile ? 35 : 20 }} ><CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} /><XAxis dataKey="label" tick={{ fontSize: isMobile ? 8 : 9, fill: theme.palette.text.secondary }} interval={isMobile ? 2 : 0} angle={isMobile ? -45 : -30} textAnchor="end" height={isMobile ? 60 : 50} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: theme.palette.text.secondary }} label={{ value: 'Tickets', angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary, fontSize: 12, dy: 60, dx: -5 }} /> <Tooltip content={<CustomTooltip />} /> <Legend wrapperStyle={{ fontSize: "12px", color: theme.palette.text.secondary, paddingTop: '10px' }} payload={[{ value: 'Tickets Created', type: 'square', color: MUI_CHART_COLORS_MEMO[0] }]} /> <Bar dataKey="count" name="Tickets Created" >{hourlyChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.count > 0 ? MUI_CHART_COLORS_MEMO[index % MUI_CHART_COLORS_MEMO.length] : 'transparent'} />))}</Bar> </BarChart></ResponsiveContainer></Box>) : (<Typography sx={{ mt: 2, textAlign: 'center', fontStyle: 'italic', color: darkMode ? 'grey.400' : 'text.secondary' }}>No data for hourly bar chart.</Typography>))}
                        {chartType === 'line' && ((hourlyChartData.reduce((sum, item) => sum + item.count, 0) > 0) ? (<Box sx={{ height: 350, width: '100%' }}><ResponsiveContainer width="100%" height="100%"><LineChart data={hourlyChartData} margin={{ top: 5, right: isMobile ? 15 : 30, left: 20, bottom: isMobile ? 35 : 20 }} ><CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} /><XAxis dataKey="label" tick={{ fontSize: isMobile ? 8 : 9, fill: theme.palette.text.secondary }} interval={isMobile ? 2 : 0} angle={isMobile ? -45 : -30} textAnchor="end" height={isMobile ? 60 : 50} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: theme.palette.text.secondary }} label={{ value: 'Tickets', angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary, fontSize: 12, dy: 60, dx: -5 }} /> <Tooltip content={<CustomTooltip />} /> <Legend wrapperStyle={{ fontSize: "12px", color: theme.palette.text.secondary, paddingTop: '10px' }} /> <Line type="monotone" dataKey="count" name="Tickets Created" stroke={theme.palette.primary.main} strokeWidth={2} dot={{ r: 3, fill: theme.palette.primary.main }} activeDot={{ r: 6, stroke: theme.palette.background.paper, strokeWidth: 2 }} /> </LineChart></ResponsiveContainer></Box>) : (<Typography sx={{ mt: 2, textAlign: 'center', fontStyle: 'italic', color: darkMode ? 'grey.400' : 'text.secondary' }}>No data for hourly line chart.</Typography>))}
                        {chartType === 'area' && ((hourlyChartData.reduce((sum, item) => sum + item.count, 0) > 0) ? (<Box sx={{ height: 350, width: '100%' }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={hourlyChartData} margin={{ top: 5, right: isMobile ? 15 : 30, left: 20, bottom: isMobile ? 35 : 20 }} ><defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} /><stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} /><XAxis dataKey="label" tick={{ fontSize: isMobile ? 8 : 9, fill: theme.palette.text.secondary }} interval={isMobile ? 2 : 0} angle={isMobile ? -45 : -30} textAnchor="end" height={isMobile ? 60 : 50} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: theme.palette.text.secondary }} label={{ value: 'Tickets', angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary, fontSize: 12, dy: 60, dx: -5 }} /><Tooltip content={<CustomTooltip />} /><Legend wrapperStyle={{ fontSize: "12px", color: theme.palette.text.secondary, paddingTop: '10px' }} /><Area type="monotone" dataKey="count" name="Tickets Created" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorCount)" /></AreaChart></ResponsiveContainer></Box>) : (<Typography sx={{ textAlign: 'center', fontStyle: 'italic', color: darkMode ? 'grey.400' : 'text.secondary' }}>No data for hourly area chart.</Typography>))}
                        {chartType === 'pie' && ((issueFrequencyData.length > 0) ? (<Box sx={{ height: 350, width: '100%' }}><ResponsiveContainer width="100%" height="100%"><PieChart ><Pie data={issueFrequencyData} cx="50%" cy="50%" labelLine={false} outerRadius={isMobile ? 80 : 120} fill="#8884d8" dataKey="count" nameKey="issue_type" >{issueFrequencyData.map((entry, index) => (<Cell key={`cell-${index}`} fill={MUI_CHART_COLORS_MEMO[index % MUI_CHART_COLORS_MEMO.length]} />))}</Pie><Tooltip formatter={(value, name) => [`${value} tickets`, name]} /><Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: "10px" }} /></PieChart></ResponsiveContainer></Box>) : (<Typography sx={{ textAlign: 'center', fontStyle: 'italic', color: darkMode ? 'grey.400' : 'text.secondary' }}>No issue type data for pie chart.</Typography>))}
                    </Paper>

                    {/* Major Issue Card */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        {majorIssue && (<Grid item xs={12} md={chartType === 'pie' ? 12 : 6}> <Paper elevation={1} sx={{ p: 2, height: '100%', bgcolor: darkMode ? 'grey.700' : 'grey.100', borderRadius: 2 }}> <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}> <FaExclamationTriangle style={{ marginRight: '10px', fontSize: '1.3em', color: theme.palette.error.main }} /> <Typography variant="h6" component="h3" sx={{ color: darkMode ? 'grey.100' : 'text.primary' }}>Major Issue Faced</Typography> </Box> <Typography variant="h5" component="p" sx={{ fontWeight: 'bold', mb: 0.5, color: darkMode ? theme.palette.error.light : theme.palette.error.dark }}>{majorIssue.issue_type}</Typography> <Typography variant="body1" sx={{ color: darkMode ? 'grey.300' : 'text.secondary' }}>{majorIssue.count} reported tickets</Typography> </Paper> </Grid>)}
                        {issueFrequencyData.length > 0 && (<Grid item xs={12} md={(majorIssue && chartType !== 'pie') ? 6 : 12}> <Paper elevation={1} sx={{ p: 2, height: '100%', bgcolor: darkMode ? 'grey.700' : 'grey.100', borderRadius: 2 }}> <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}> <FaListOl style={{ marginRight: '10px', fontSize: '1.3em', color: darkMode ? 'grey.400' : 'grey.600' }} /> <Typography variant="h6" component="h3" sx={{ color: darkMode ? 'grey.100' : 'text.primary' }}>Issue Types by Frequency</Typography> </Box> <List dense sx={{ maxHeight: 200, overflow: 'auto' }}> {issueFrequencyData.map((item, index) => (<React.Fragment key={item.issue_type}> <ListItem disableGutters sx={{ py: 0.75 }}> <ListItemText primary={item.issue_type} primaryTypographyProps={{ variant: 'body1', color: darkMode ? 'grey.200' : 'text.secondary' }} /> <Typography variant="body1" sx={{ fontWeight: 'medium', color: darkMode ? 'grey.100' : 'text.primary' }}>{item.count}</Typography> </ListItem> {index < issueFrequencyData.length - 1 && <Divider light sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />} </React.Fragment>))} </List> </Paper> </Grid>)}
                    </Grid>

                    {/* Stat Cards */}
                    <Grid container spacing={3} sx={{ mb: 4 }}>
                        <Grid item xs={12} sm={6} md={3}><StatCard title="Total Tickets" value={reportData.totalTickets} icon={FaTicketAlt} darkMode={darkMode} /></Grid>
                        <Grid item xs={12} sm={6} md={3}><StatCard title="Open" value={reportData.byStatus?.Open} icon={FaFolderOpen} color={theme.palette.info.main} darkMode={darkMode} /></Grid>
                        <Grid item xs={12} sm={6} md={3}><StatCard title="In Progress" value={reportData.byStatus?.['In Progress']} icon={FaSpinner} color={theme.palette.warning.main} darkMode={darkMode} /></Grid>
                        <Grid item xs={12} sm={6} md={3}><StatCard title="Resolved" value={reportData.byStatus?.Resolved} icon={FaCheckCircle} color={theme.palette.success.main} darkMode={darkMode} /></Grid>
                    </Grid>

                    

                    
                    {/* **** USE activeHoursData FOR THIS LIST **** */}
                    {chartType !== 'pie' && activeHoursData.length > 0 && (
                        <Grid container justifyContent="center" sx={{ mt: 3 }}>
                            <Grid item xs={12} sm={10} md={8} lg={6}>
                                <Paper elevation={1} sx={{ p: 2, bgcolor: darkMode ? 'grey.700' : 'grey.100', borderRadius: 2 }}>
                                    <Typography variant="subtitle1" gutterBottom sx={{ color: darkMode ? 'grey.100' : 'text.primary', mb: 1 }}>Active Hours Summary (Hourly Chart)</Typography>
                                    <List dense sx={{ maxHeight: 200, overflowY: 'auto' }}>
                                        {activeHoursData.map((entry, index) => (
                                            <React.Fragment key={`active-${entry.label}`}>
                                                <ListItem disableGutters sx={{ py: 0.2 }}>
                                                    <ListItemText primary={entry.label} primaryTypographyProps={{ variant: 'body2', color: darkMode ? 'grey.200' : 'text.secondary' }} />
                                                    <Typography variant="body2" sx={{ fontWeight: 'medium', color: darkMode ? 'grey.100' : 'text.primary', pl: 1 }}> {entry.count} {entry.count === 1 ? "ticket" : "tickets"} </Typography>
                                                </ListItem>
                                                {index < activeHoursData.length - 1 && <Divider light sx={{ borderColor: darkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)' }} />}
                                            </React.Fragment>
                                        ))}
                                    </List>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}
                    {/* **** END ACTIVE HOURS SUMMARY USAGE **** */}
                </Paper>
            )}
            {!reportData && !isLoading && !error && (<Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: darkMode ? 'grey.800' : 'grey.50', color: darkMode ? 'grey.400' : 'text.secondary', borderRadius: 2 }}> <Typography>Apply date filters to view analytics.</Typography> </Paper>)}
        </Box>
    );
};

export default TicketAnalyticsPage;