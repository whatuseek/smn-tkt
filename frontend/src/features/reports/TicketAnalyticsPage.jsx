// src/features/reports/TicketAnalyticsPage.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useAdminDashboardContext } from '../../layouts/AdminDashboardLayout';
import axiosInstance from '../../api/axiosInstance';
import {
    Box, Typography, Paper, CircularProgress, Alert, Grid, Button as MuiButton,
    FormControl, InputLabel, Select, MenuItem,
    List, ListItem, ListItemText, ListItemIcon,
     Card, CardContent,
    Accordion, AccordionSummary, AccordionDetails,
    useMediaQuery,
    RadioGroup, FormControlLabel, Radio, FormLabel
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { format, startOfDay, endOfDay, isValid } from 'date-fns';
import {
    FaFilter, FaChevronDown, FaExclamationTriangle, FaListOl,
    FaChartBar, FaChartLine, FaChartArea, FaChartPie, FaClock, FaCalendarCheck, FaTasks
} from 'react-icons/fa';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, AreaChart, Area,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell,
    LabelList
} from 'recharts';

// --- StatCard and CustomTooltip components (no changes from your last correct version) ---
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

const CustomTooltip = ({ active, payload, label, chartType }) => {
    const theme = useTheme();
    if (active && payload && payload.length) {
        const dataPoint = payload[0];
        const originalData = dataPoint.payload;
        const titleLabel = chartType === 'pie' || chartType === 'statusPie' || chartType === 'issuePie' ? dataPoint.name : `Hour: ${originalData?.label || label || 'N/A'}`;
        const displayValue = dataPoint.value;
        const percentValue = dataPoint.percent;
        let details = `${displayValue} tickets`;
        if ((chartType === 'pie' || chartType === 'statusPie' || chartType === 'issuePie') && percentValue !== undefined) {
            details += ` (${(percentValue * 100).toFixed(0)}%)`;
        }
        return (
            <Paper elevation={3} sx={{ p: 1, bgcolor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="caption" display="block" gutterBottom sx={{ color: theme.palette.text.secondary }}> {titleLabel} </Typography>
                <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 'medium' }}> {details} </Typography>
            </Paper>
        );
    }
    return null;
};
CustomTooltip.propTypes = { active: PropTypes.bool, payload: PropTypes.arrayOf( PropTypes.shape({ payload: PropTypes.object, name: PropTypes.string, value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), color: PropTypes.string, dataKey: PropTypes.string, formatter: PropTypes.func, unit: PropTypes.string, type: PropTypes.string, stroke: PropTypes.string, fill: PropTypes.string, percent: PropTypes.number, }) ), label: PropTypes.string, chartType: PropTypes.string, };
// --- End StatCard and CustomTooltip ---

// --- Generic Pie Label Renderer (no changes from your last correct version) ---
const RADIAN_CONST = Math.PI / 180;
const renderGenericPieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, index, isMobile, darkMode, theme, dataLength, colorsArray }) => {
    const MIN_PERCENT_FOR_OUTSIDE_LABEL = isMobile ? 0.10 : 0.07;
    const MIN_PERCENT_FOR_ANY_LABEL = 0.03;
    if (percent < MIN_PERCENT_FOR_ANY_LABEL) return null;
    const labelFontSize = isMobile ? '8px' : '10px';
    const textFill = darkMode ? theme.palette.grey[200] : theme.palette.text.secondary;
    if (percent >= MIN_PERCENT_FOR_OUTSIDE_LABEL || dataLength <= 4) {
        const radiusForLineStart = outerRadius + (isMobile ? 2 : 3);
        const radiusForText = outerRadius + (isMobile ? 12 : (name.length > 15 ? 25 : 20) );
        const xStart = cx + radiusForLineStart * Math.cos(-midAngle * RADIAN_CONST);
        const yStart = cy + radiusForLineStart * Math.sin(-midAngle * RADIAN_CONST);
        const xEnd = cx + (radiusForText - (isMobile? 4:6)) * Math.cos(-midAngle * RADIAN_CONST);
        const yEnd = cy + (radiusForText - (isMobile? 4:6)) * Math.sin(-midAngle * RADIAN_CONST);
        const xTextPos = cx + radiusForText * Math.cos(-midAngle * RADIAN_CONST);
        const yTextPos = cy + radiusForText * Math.sin(-midAngle * RADIAN_CONST);
        const textAnchor = Math.cos(-midAngle * RADIAN_CONST) >= 0 ? 'start' : 'end';
        const lineStroke = darkMode ? theme.palette.grey[600] : theme.palette.grey[500];
        return (
            <g>
                <path d={`M${xStart},${yStart}L${xEnd},${yEnd}`} stroke={lineStroke} fill="none" strokeWidth={0.5}/>
                <circle cx={xEnd} cy={yEnd} r={1.5} fill={lineStroke} stroke="none"/>
                <text x={xTextPos + (textAnchor === 'start' ? 3 : -3)} y={yTextPos} textAnchor={textAnchor} fill={textFill} dominantBaseline="central" fontSize={labelFontSize} fontWeight="medium">
                    {`${name} (${(percent * 100).toFixed(0)}%)`}
                </text>
            </g>
        );
    } else {
        const radiusForInsideLabel = innerRadius + (outerRadius - innerRadius) * 0.5;
        const x = cx + radiusForInsideLabel * Math.cos(-midAngle * RADIAN_CONST);
        const y = cy + radiusForInsideLabel * Math.sin(-midAngle * RADIAN_CONST);
        const sliceColor = colorsArray[index % colorsArray.length];
        const insideLabelFill = theme.palette.getContrastText(sliceColor || (darkMode ? theme.palette.grey[800] : theme.palette.common.white));
        if (outerRadius - innerRadius > 15) {
            return (
                <text x={x} y={y} fill={insideLabelFill} textAnchor="middle" dominantBaseline="central" fontSize={labelFontSize} fontWeight="bold">
                    {`${(percent * 100).toFixed(0)}%`}
                </text>
            );
        }
        return null;
    }
};
renderGenericPieLabel.propTypes = { cx: PropTypes.number, cy: PropTypes.number, midAngle: PropTypes.number, innerRadius: PropTypes.number, outerRadius: PropTypes.number, percent: PropTypes.number, name: PropTypes.string, index: PropTypes.number, isMobile: PropTypes.bool, darkMode: PropTypes.bool, theme: PropTypes.object, dataLength: PropTypes.number, colorsArray: PropTypes.array, };
// --- End Generic Pie Label Renderer ---


// Main Page Component
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
    const [filtersExpanded, setFiltersExpanded] = useState(false);
    const [chartType, setChartType] = useState('bar');

    // --- DEFINED STATUS COLORS to match DashboardHomePage Stat Cards ---
    const STATUS_COLORS_LIGHT = {
        Open: '#3B82F6',        // bg-blue-500
        'In Progress': '#F59E0B', // bg-amber-500 (or #F97316 for orange-500)
        Resolved: '#10B981',      // bg-emerald-500
        Default: '#9CA3AF'       // A fallback grey like gray-400
    };
    const STATUS_COLORS_DARK = {
        Open: '#1D4ED8',        // bg-blue-700
        'In Progress': '#D97706', // bg-amber-600
        Resolved: '#059669',      // bg-emerald-700
        Default: '#4B5563'       // A fallback dark grey like gray-600
    };
    const currentStatusColors = useMemo(() => darkMode ? STATUS_COLORS_DARK : STATUS_COLORS_LIGHT, [darkMode]);
    // --- END DEFINED STATUS COLORS ---

    const issueTypeOptions = useMemo(() => { return (availableIssueTypes && availableIssueTypes.length > 0) ? availableIssueTypes : ["Speed Issue", "Cable Complaint", "Recharge Related", "No Internet", "Others"]; }, [availableIssueTypes]);

    const fetchCombinedReportData = useCallback(async () => {
        setIsLoading(true); setError(''); setReportData(null);
        if (setUploadStatus) setUploadStatus({ message: '', type: '', source: '' });
        if (startDate && !isValid(startDate)) { setError("Invalid Start Date."); setIsLoading(false); return; }
        if (endDate && !isValid(endDate)) { setError("Invalid End Date."); setIsLoading(false); return; }
        if (startDate && endDate && endDate < startDate) { setError("End Date cannot be before Start Date."); setIsLoading(false); return; }
        const params = new URLSearchParams();
        if (startDate) { params.append('startDate', format(startOfDay(startDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")); }
        if (endDate) { params.append('endDate', format(endOfDay(endDate), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")); }
        if (issueType && chartType !== 'pie') { params.append('issueType', issueType); }
        try { const response = await axiosInstance.get(`/api/reports/tickets/combined`, { params }); setReportData(response.data); }
        catch (err) { setError(err.response?.data?.message || err.message || "Failed data fetch."); if (setUploadStatus) setUploadStatus({ message: err.response?.data?.message || err.message || "Failed.", type: 'error', source: 'combinedReportFetch' }); }
        finally { setIsLoading(false); }
    }, [startDate, endDate, issueType, chartType, setUploadStatus]);

    useEffect(() => { fetchCombinedReportData(); }, [fetchCombinedReportData]);
    useEffect(() => { if (chartType === 'pie' && issueType !== '') { setIssueType(''); } }, [chartType, issueType]);

    const hourlyChartData = useMemo(() => reportData?.hourlyDistribution || [], [reportData]);
    const issueFrequencyData = useMemo(() => reportData?.byIssueType || [], [reportData]);
    const majorIssue = useMemo(() => issueFrequencyData?.[0], [issueFrequencyData]);
    const MUI_CHART_COLORS_MEMO = useMemo(() => [ theme.palette.primary.main, theme.palette.secondary.main, theme.palette.success.main, theme.palette.error.main, theme.palette.warning.main, theme.palette.info.main, '#3f51b5', '#f50057', '#4caf50', '#ff9800', '#2196f3', '#795548' ], [theme]);

    const chartTypeOptions = [
        { value: 'bar', label: 'Bar', icon: <FaChartBar size="0.9em"/> }, { value: 'line', label: 'Line', icon: <FaChartLine size="0.9em"/> },
        { value: 'area', label: 'Area', icon: <FaChartArea size="0.9em"/> }, { value: 'pie', label: 'Pie (Types)', icon: <FaChartPie size="0.9em"/> },
    ];

    const TOP_N_ISSUES = 5;
    const topIssueFrequencyChartData = useMemo(() => {
        if (!issueFrequencyData || issueFrequencyData.length === 0) return [];
        const sortedIssues = [...issueFrequencyData].sort((a, b) => b.count - a.count);
        const topN = sortedIssues.slice(0, TOP_N_ISSUES);
        if (sortedIssues.length > TOP_N_ISSUES) {
            const othersCount = sortedIssues.slice(TOP_N_ISSUES).reduce((sum, issue) => sum + issue.count, 0);
            if (othersCount > 0) { topN.push({ issue_type: 'OTHERS', count: othersCount }); }
        }
        return topN.reverse();
    }, [issueFrequencyData]);

    const peakActivityHoursData = useMemo(() => {
        if (!hourlyChartData || hourlyChartData.length === 0) return [];
        const sortedHours = [...hourlyChartData].sort((a, b) => b.count - a.count);
        if (hourlyChartData.every(h => h.count ===0)) return [];
        let peaks = []; let lastCount = -1;
        for (let i = 0; i < sortedHours.length && peaks.length < 3; i++) {
            if (sortedHours[i].count > 0) { if (peaks.length > 0 && sortedHours[i].count < lastCount && peaks.length >=1 && lastCount > 1) break;
                peaks.push({label: sortedHours[i].label, count: sortedHours[i].count});
                lastCount = sortedHours[i].count; }
            else { break; }
        }
        return peaks;
    }, [hourlyChartData]);

    const statusDistributionData = useMemo(() => {
        if (!reportData?.byStatus) return [];
        return Object.entries(reportData.byStatus).map(([name, value]) => ({ name, value })).filter(d => d.value > 0);
    }, [reportData?.byStatus]);

    return (
        <Box sx={{ mb: 4 }}>
            {/* ... (Page Title and Filter Accordion remain the same) ... */}
            <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 2 }}> Ticket Analytics & Insights </Typography>
            <Accordion expanded={filtersExpanded} onChange={() => setFiltersExpanded(!filtersExpanded)} sx={{ bgcolor: darkMode ? 'grey.800' : 'grey.50', color: darkMode ? 'grey.100' : 'text.primary', boxShadow: 2, borderRadius: 2, mb: 3, '&.Mui-expanded': { mb: 2, }, '&:before': { display: 'none', } }} disableGutters elevation={1} >
                <AccordionSummary expandIcon={<FaChevronDown style={{ color: darkMode ? theme.palette.grey[400] : theme.palette.action.active }} />} aria-controls="filter-criteria-content" id="filter-criteria-header" sx={{ borderBottom: filtersExpanded ? `1px solid ${theme.palette.divider}` : 'none', minHeight: '48px', '&.Mui-expanded': { minHeight: '48px' } }} >
                    <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>Filter Criteria</Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 2, borderTop: filtersExpanded ? `1px solid ${theme.palette.divider}` : 'none' }}>
                    <Grid container spacing={2} alignItems="flex-end">
                        <Grid item xs={12} sm={6} md={4}><DatePicker label="Start Date" value={startDate} onChange={setStartDate} slotProps={{ textField: { fullWidth: true, size: 'small', error: !!error && (error.includes("Start Date") || error.includes("date range")) } }} sx={{ bgcolor: 'transparent', '& .MuiInputBase-input': { color: theme.palette.text.primary }, '& .MuiSvgIcon-root': { color: theme.palette.action.active }, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }, '& .MuiInputLabel-root': { color: theme.palette.text.secondary } }} /></Grid>
                        <Grid item xs={12} sm={6} md={4}><DatePicker label="End Date" value={endDate} onChange={setEndDate} minDate={startDate} slotProps={{ textField: { fullWidth: true, size: 'small', error: !!error && (error.includes("End Date") || error.includes("date range")) } }} sx={{ bgcolor: 'transparent', '& .MuiInputBase-input': { color: theme.palette.text.primary }, '& .MuiSvgIcon-root': { color: theme.palette.action.active }, '& .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }, '& .MuiInputLabel-root': { color: theme.palette.text.secondary } }} /></Grid>
                        <Grid item xs={12} sm={12} md={4}>
                            <FormControl fullWidth size="small" disabled={chartType === 'pie'} sx={{ bgcolor: 'transparent' }}>
                                <InputLabel id="a-it-label" sx={{ color: chartType === 'pie' ? theme.palette.text.disabled : theme.palette.text.secondary }}>Issue Type (for Bar/Line/Area)</InputLabel>
                                <Select labelId="a-it-label" value={issueType} label="Issue Type (for Bar/Line/Area)" onChange={(e) => setIssueType(e.target.value)} disabled={chartType === 'pie'} sx={{ color: chartType === 'pie' ? theme.palette.text.disabled : theme.palette.text.primary, '.MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.divider }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'primary.main' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: theme.palette.text.primary }, '.MuiSvgIcon-root ': { fill: chartType === 'pie' ? theme.palette.action.disabled : theme.palette.action.active } }} MenuProps={{ PaperProps: { sx: { bgcolor: theme.palette.background.paper, color: theme.palette.text.primary } } }} >
                                    <MenuItem value=""><em>All Issue Types</em></MenuItem>
                                    {issueTypeOptions.map((type) => (<MenuItem key={type} value={type.toUpperCase()}>{type}</MenuItem>))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}><MuiButton variant="contained" onClick={fetchCombinedReportData} disabled={isLoading} startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <FaFilter size="0.8em" />}>Apply Filters & Analyze</MuiButton></Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>

            {isLoading && (<Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>)}
            {error && (<Alert severity="error" sx={{ my: 2, borderRadius: 1.5 }} onClose={() => setError('')}>{error}</Alert>)}

            {reportData && !isLoading && (
                <Paper elevation={3} sx={{ p: { xs: 2, sm: 3 }, bgcolor: darkMode ? 'grey.850' : 'background.paper', borderRadius: 2 }}>
                    <Typography variant="subtitle1" color="text.secondary" gutterBottom sx={{ textAlign: 'center', mb: 1, color: darkMode ? 'grey.400' : 'text.secondary' }}>Summary for: {reportData.filterCriteria?.startDate !== 'N/A' ? reportData.filterCriteria.startDate : 'All Time'} to {reportData.filterCriteria?.endDate !== 'N/A' ? reportData.filterCriteria.endDate : 'Present'}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 3, borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                        <FormControl component="fieldset" size="small">
                            <FormLabel component="legend" sx={{ fontSize: '0.8rem', color: theme.palette.text.secondary, mb: 0.5, width: '100%', textAlign: 'center' }}>Chart Visualization</FormLabel>
                            <RadioGroup row name="chart-type-selector" value={chartType} onChange={(e) => setChartType(e.target.value)} sx={{justifyContent: 'center'}}>
                                {chartTypeOptions.map(option => ( <FormControlLabel key={option.value} value={option.value} control={<Radio size="small" sx={{color: darkMode ? 'grey.500' : 'default','&.Mui-checked':{color: 'primary.main'}}} />} label={<Box sx={{display: 'flex', alignItems: 'center', gap: 0.5}}>{option.icon}{option.label}</Box>} sx={{mr: isMobile ? 0.5 : 1.5 }} /> ))}
                            </RadioGroup>
                        </FormControl>
                    </Box>
                    <Paper elevation={2} sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: darkMode ? 'grey.800' : 'background.paper', borderRadius: 2, mb: 3 }}>
                        <Typography variant="h6" gutterBottom sx={{ color: darkMode ? 'grey.100' : 'text.primary', textAlign: 'center' }}> {chartType === 'pie' ? 'Issue Type Distribution' : 'Hourly Ticket Distribution'} </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2, color: darkMode ? 'grey.300' : 'text.secondary' }}> Period: {reportData.filterCriteria?.startDate !== 'N/A' ? reportData.filterCriteria.startDate : 'Start'} to {reportData.filterCriteria?.endDate !== 'N/A' ? reportData.filterCriteria.endDate : 'End'} {chartType !== 'pie' && ` | For: ${issueType || 'All Issues'}`} </Typography>
                        {chartType === 'bar' && ((hourlyChartData.reduce((sum, item) => sum + item.count, 0) > 0) ? (<Box sx={{ height: 350, width: '100%' }}><ResponsiveContainer width="100%" height="100%"><BarChart data={hourlyChartData} margin={{ top: 5, right: isMobile ? 5 : 30, left: 20, bottom: isMobile ? 35 : 20 }} ><CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} /><XAxis dataKey="label" tick={{ fontSize: isMobile ? 8 : 9, fill: theme.palette.text.secondary }} interval={isMobile ? 2 : 0} angle={isMobile ? -45 : -30} textAnchor="end" height={isMobile ? 60 : 50} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: theme.palette.text.secondary }} label={{ value: 'Tickets', angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary, fontSize: 12, dy: 60, dx: -5 }} /> <Tooltip content={<CustomTooltip chartType={chartType} />} /> <Legend wrapperStyle={{ fontSize: "12px", color: theme.palette.text.secondary, paddingTop: '10px' }} payload={[{ value: 'Tickets Created', type: 'square', color: MUI_CHART_COLORS_MEMO[0] }]} /> <Bar dataKey="count" name="Tickets Created" >{hourlyChartData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.count > 0 ? MUI_CHART_COLORS_MEMO[index % MUI_CHART_COLORS_MEMO.length] : 'transparent'} />))}</Bar> </BarChart></ResponsiveContainer></Box>) : (<Typography sx={{ mt: 2, textAlign: 'center', fontStyle: 'italic', color: darkMode ? 'grey.400' : 'text.secondary' }}>No data for hourly bar chart.</Typography>))}
                        {chartType === 'line' && ((hourlyChartData.reduce((sum, item) => sum + item.count, 0) > 0) ? (<Box sx={{ height: 350, width: '100%' }}><ResponsiveContainer width="100%" height="100%"><LineChart data={hourlyChartData} margin={{ top: 5, right: isMobile ? 15 : 30, left: 20, bottom: isMobile ? 35 : 20 }} ><CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} /><XAxis dataKey="label" tick={{ fontSize: isMobile ? 8 : 9, fill: theme.palette.text.secondary }} interval={isMobile ? 2 : 0} angle={isMobile ? -45 : -30} textAnchor="end" height={isMobile ? 60 : 50} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: theme.palette.text.secondary }} label={{ value: 'Tickets', angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary, fontSize: 12, dy: 60, dx: -5 }} /> <Tooltip content={<CustomTooltip chartType={chartType} />} /> <Legend wrapperStyle={{ fontSize: "12px", color: theme.palette.text.secondary, paddingTop: '10px' }} /> <Line type="monotone" dataKey="count" name="Tickets Created" stroke={theme.palette.primary.main} strokeWidth={2} dot={{ r: 3, fill: theme.palette.primary.main }} activeDot={{ r: 6, stroke: theme.palette.background.paper, strokeWidth: 2 }} /> </LineChart></ResponsiveContainer></Box>) : (<Typography sx={{ mt: 2, textAlign: 'center', fontStyle: 'italic', color: darkMode ? 'grey.400' : 'text.secondary' }}>No data for hourly line chart.</Typography>))}
                        {chartType === 'area' && ((hourlyChartData.reduce((sum, item) => sum + item.count, 0) > 0) ? (<Box sx={{ height: 350, width: '100%' }}><ResponsiveContainer width="100%" height="100%"><AreaChart data={hourlyChartData} margin={{ top: 5, right: isMobile ? 15 : 30, left: 20, bottom: isMobile ? 35 : 20 }} ><defs><linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={theme.palette.primary.main} stopOpacity={0.8} /><stop offset="95%" stopColor={theme.palette.primary.main} stopOpacity={0.1} /></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={theme.palette.divider} /><XAxis dataKey="label" tick={{ fontSize: isMobile ? 8 : 9, fill: theme.palette.text.secondary }} interval={isMobile ? 2 : 0} angle={isMobile ? -45 : -30} textAnchor="end" height={isMobile ? 60 : 50} /><YAxis allowDecimals={false} tick={{ fontSize: 10, fill: theme.palette.text.secondary }} label={{ value: 'Tickets', angle: -90, position: 'insideLeft', fill: theme.palette.text.secondary, fontSize: 12, dy: 60, dx: -5 }} /><Tooltip content={<CustomTooltip chartType={chartType} />} /><Legend wrapperStyle={{ fontSize: "12px", color: theme.palette.text.secondary, paddingTop: '10px' }} /><Area type="monotone" dataKey="count" name="Tickets Created" stroke={theme.palette.primary.main} fillOpacity={1} fill="url(#colorCount)" /></AreaChart></ResponsiveContainer></Box>) : (<Typography sx={{ textAlign: 'center', fontStyle: 'italic', color: darkMode ? 'grey.400' : 'text.secondary' }}>No data for hourly area chart.</Typography>))}
                        {chartType === 'pie' && ((issueFrequencyData.length > 0) ? (<Box sx={{ height: 350, width: '100%' }}><ResponsiveContainer width="100%" height="100%"><PieChart ><Pie data={issueFrequencyData} cx="50%" cy="50%" labelLine={false} outerRadius={isMobile ? 70 : 100} fill="#8884d8" dataKey="count" nameKey="issue_type" label={(props) => renderGenericPieLabel({...props, isMobile, darkMode, theme, dataLength: issueFrequencyData.length, colorsArray: MUI_CHART_COLORS_MEMO})} >{issueFrequencyData.map((entry, index) => (<Cell key={`cell-main-pie-${index}`} fill={MUI_CHART_COLORS_MEMO[index % MUI_CHART_COLORS_MEMO.length]} />))}</Pie><Tooltip content={<CustomTooltip chartType="issuePie"/>} /><Legend layout="vertical" verticalAlign="middle" align="right" wrapperStyle={{ fontSize: "10px" }} /></PieChart></ResponsiveContainer></Box>) : (<Typography sx={{ textAlign: 'center', fontStyle: 'italic', color: darkMode ? 'grey.400' : 'text.secondary' }}>No issue type data for pie chart.</Typography>))}
                    </Paper>

                    <Grid container spacing={3} sx={{ mb: 3 }}>
                        {majorIssue && (<Grid item xs={12} md={6} lg={4}><Paper elevation={1} sx={{ p: 2, height: '100%', bgcolor: darkMode ? 'grey.700' : 'grey.100', borderRadius: 2 }}><Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><FaExclamationTriangle style={{ marginRight: '10px', fontSize: '1.3em', color: theme.palette.error.main }} /><Typography variant="h6" component="h3" sx={{ color: darkMode ? 'grey.100' : 'text.primary' }}>Major Issue Faced</Typography></Box><Typography variant="h5" component="p" sx={{ fontWeight: 'bold', mb: 0.5, color: darkMode ? theme.palette.error.light : theme.palette.error.dark }}>{majorIssue.issue_type}</Typography><Typography variant="body1" sx={{ color: darkMode ? 'grey.300' : 'text.secondary' }}>{majorIssue.count} reported tickets</Typography></Paper></Grid>)}
                        {topIssueFrequencyChartData.length > 0 && (<Grid item xs={12} md={6} lg={4}><Paper elevation={1} sx={{ p: 2, height: '100%', bgcolor: darkMode ? 'grey.700' : 'grey.100', borderRadius: 2 }}><Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}><FaListOl style={{ marginRight: '10px', fontSize: '1.3em', color: darkMode ? theme.palette.info.light : theme.palette.info.main }} /><Typography variant="h6" component="h3" sx={{ color: darkMode ? 'grey.100' : 'text.primary' }}>Top Issue Types</Typography></Box><Box sx={{ height: 200, width: '100%' }}><ResponsiveContainer width="100%" height="100%"><BarChart layout="vertical" data={topIssueFrequencyChartData} margin={{ top: 0, right: 30, left: 10, bottom: 0 }}><CartesianGrid strokeDasharray="3 3" stroke={darkMode ? theme.palette.grey[600] : theme.palette.grey[300]} /><XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: theme.palette.text.secondary }} /><YAxis type="category" dataKey="issue_type" width={isMobile? 80: 100} tick={{ fontSize: isMobile ? 9: 10, fill: theme.palette.text.secondary, width: isMobile? 70:90 }} interval={0} /><Tooltip formatter={(value) => [`${value} tickets`]} /><Bar dataKey="count" barSize={isMobile ? 15 : 20} radius={[0, 4, 4, 0]}>{topIssueFrequencyChartData.map((entry, index) => ( <Cell key={`cell-issue-${index}`} fill={MUI_CHART_COLORS_MEMO[index % MUI_CHART_COLORS_MEMO.length]} /> ))}<LabelList dataKey="count" position="right" style={{ fontSize: '10px', fill: darkMode? theme.palette.grey[300] : theme.palette.text.secondary }}/></Bar></BarChart></ResponsiveContainer></Box></Paper></Grid>)}
                        {peakActivityHoursData.length > 0 && (<Grid item xs={12} md={6} lg={4}><Paper elevation={1} sx={{ p: 2, height: '100%', bgcolor: darkMode ? 'grey.700' : 'grey.100', borderRadius: 2 }}><Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}><FaClock style={{ marginRight: '10px', fontSize: '1.3em', color: darkMode ? theme.palette.warning.light : theme.palette.warning.main }} /><Typography variant="h6" component="h3" sx={{ color: darkMode ? 'grey.100' : 'text.primary' }}>Peak Activity Hours</Typography></Box><List dense sx={{pt:0}}> {peakActivityHoursData.map((peak, index) => (<ListItem key={index} disableGutters sx={{py:0.25}}> <ListItemIcon sx={{minWidth: 28, color: darkMode ? theme.palette.warning.light : theme.palette.warning.main }}> <FaCalendarCheck size="0.9em"/> </ListItemIcon> <ListItemText primary={`${peak.label}: ${peak.count} tickets`} primaryTypographyProps={{variant: 'body2', color: darkMode ? 'grey.200' : 'text.secondary'}} /> </ListItem>))} </List></Paper></Grid>)}
                        
                        {/* Status Distribution Pie Chart - Using Specific Colors */}
                        {statusDistributionData.length > 0 && (
                            <Grid item xs={12} md={6} lg={4}>
                                <Paper elevation={1} sx={{ p: 2, height: '100%', bgcolor: darkMode ? 'grey.700' : 'grey.100', borderRadius: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5 }}>
                                        <FaTasks style={{ marginRight: '10px', fontSize: '1.3em', color: darkMode ? theme.palette.success.light : theme.palette.success.main }} />
                                        <Typography variant="h6" component="h3" sx={{ color: darkMode ? 'grey.100' : 'text.primary' }}>
                                            Ticket Status Distribution
                                        </Typography>
                                    </Box>
                                    <Box sx={{ height: isMobile ? 200 : 220, width: '100%' }}>
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart margin={{ top: 20, right: 20, bottom: (isMobile && statusDistributionData.length > 3) ? 40 : 30, left: 20 }}>
                                                <Pie
                                                    data={statusDistributionData}
                                                    dataKey="value"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    outerRadius={isMobile ? 50 : 60}
                                                    labelLine={false}
                                                    label={(props) => renderGenericPieLabel({...props, isMobile, darkMode, theme, dataLength: statusDistributionData.length, colorsArray: [currentStatusColors.Open, currentStatusColors['In Progress'], currentStatusColors.Resolved, currentStatusColors.Default] })} // Pass currentStatusColors
                                                >
                                                    {statusDistributionData.map((entry, index) => {
                                                        let color = currentStatusColors.Default; // Fallback color
                                                        if (entry.name === 'Open') color = currentStatusColors.Open;
                                                        else if (entry.name === 'In Progress') color = currentStatusColors['In Progress'];
                                                        else if (entry.name === 'Resolved') color = currentStatusColors.Resolved;
                                                        return <Cell key={`cell-status-dist-${index}`} fill={color} />;
                                                    })}
                                                </Pie>
                                                <Tooltip content={<CustomTooltip chartType="statusPie" />} />
                                                {(!isMobile || statusDistributionData.some(d => (reportData.totalTickets > 0 && (d.value / reportData.totalTickets) < (isMobile ? 0.08 : 0.05))) ) && (
                                                    <Legend
                                                        wrapperStyle={{ fontSize: "10px", paddingTop: isMobile ? '5px' : '10px' }}
                                                        verticalAlign="bottom"
                                                        align="center"
                                                        layout="horizontal"
                                                        iconSize={8}
                                                        payload={ // Custom legend payload to ensure colors match
                                                            statusDistributionData.map(entry => ({
                                                                value: entry.name,
                                                                type: 'square',
                                                                color: currentStatusColors[entry.name] || currentStatusColors.Default
                                                            }))
                                                        }
                                                    />
                                                )}
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </Box>
                                </Paper>
                            </Grid>
                        )}
                    </Grid>
                </Paper>
            )}
            {!reportData && !isLoading && !error && (<Paper elevation={1} sx={{ p: 2, textAlign: 'center', bgcolor: darkMode ? 'grey.800' : 'grey.50', color: darkMode ? 'grey.400' : 'text.secondary', borderRadius: 2 }}> <Typography>Apply date filters to view analytics.</Typography> </Paper>)}
        </Box>
    );
};

export default TicketAnalyticsPage;