/* eslint-disable no-unused-vars */
// frontend/src/features/tickets/TicketList.jsx
import { useEffect, useState, useMemo, Fragment, useCallback } from 'react';
import PropTypes from 'prop-types';
import axiosInstance from '../../api/axiosInstance';
import { motion, AnimatePresence } from 'framer-motion';
import {
    IconButton as MuiIconButton, CircularProgress, Box,
    Snackbar, Alert as MuiAlert, Dialog, DialogTitle,
    DialogContent, DialogContentText, Button as MuiButton, Grid,
    TextField, Select, MenuItem, FormControl, Typography,
    useTheme, Divider, Tooltip, InputLabel,
    Paper, useMediaQuery
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import FilterListIcon from '@mui/icons-material/FilterList';
import CloseIcon from '@mui/icons-material/Close';

import {
    FaSpinner, FaCheckCircle, FaExclamationCircle, FaEnvelopeOpenText,
    FaCircleNotch, FaThumbsUp, FaInfoCircle, FaTimes,
    FaSearchMinus, FaChevronDown, FaChevronUp
} from "react-icons/fa";
import { useAdminDashboardContext } from '../../layouts/AdminDashboardLayout';

// --- Helper Functions (formatTimestampLocal, InfoRow) ---
// (These are the same as in DashboardHomePage.jsx, ideally they'd be in a shared utils file)
const formatTimestampLocal = (isoString) => { /* ... same as above ... */
    if (!isoString) return 'N/A';
    try {
        const dateObject = new Date(isoString);
        if (isNaN(dateObject.getTime())) { return 'Invalid Date'; }
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, };
        return new Intl.DateTimeFormat('en-US', options).format(dateObject);
    } catch (e) { console.error('Error formatting date:', e); return 'Invalid Date'; }
};
const InfoRow = ({ label, value, isValueBlock = false, children, valueSx, labelSx, darkMode, valueClassName = "text-sm sm:text-[0.9rem]" }) => { /* ... same as above ... */
    return (
    <Box sx={{ display: 'flex', flexDirection: isValueBlock ? 'column' : 'row', alignItems: isValueBlock ? 'flex-start' : 'baseline', mb: 1.5, lineHeight: 1.5, }}>
        <Typography variant="caption" component="strong" sx={{ minWidth: '85px', display: 'inline-block', color: darkMode ? 'grey.400' : 'text.secondary', fontWeight: 500, fontSize: '0.78rem', mr: isValueBlock ? 0 : 0.75, mb: isValueBlock ? 0.35 : 0, ...labelSx }} > {label}: </Typography>
        {children ? children : (<Typography variant="body2" component="span" className={valueClassName} sx={{ color: darkMode ? 'grey.100' : 'text.primary', wordBreak: 'break-word', fontWeight: 500, ...valueSx }} > {value || 'N/A'} </Typography>)}
    </Box>
)};
InfoRow.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.oneOfType([PropTypes.string, PropTypes.node]), isValueBlock: PropTypes.bool, children: PropTypes.node, valueSx: PropTypes.object, labelSx: PropTypes.object, darkMode: PropTypes.bool.isRequired, valueClassName: PropTypes.string,};
// --- End Helper Functions ---

// --- EXACT SAME COLOR LOGIC as DashboardHomePage for consistency ---
const getStatusBadgeTailwindClasses = (statusType, darkMode) => {
    const baseBadgeOnlyClasses = "font-raleway px-2.5 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1";
    switch (statusType) {
        case "Open": return `${baseBadgeOnlyClasses} ${darkMode ? "bg-blue-700 text-blue-100" : "bg-blue-500 text-white"}`;
        case "In Progress": return `${baseBadgeOnlyClasses} ${darkMode ? "bg-amber-600 text-amber-100" : "bg-amber-500 text-white"}`;
        case "Resolved": return `${baseBadgeOnlyClasses} ${darkMode ? "bg-emerald-700 text-emerald-100" : "bg-emerald-500 text-white"}`;
        default: return `${baseBadgeOnlyClasses} ${darkMode ? "bg-gray-600 text-gray-200" : "bg-gray-400 text-gray-700"}`;
    }
};
// --- END COLOR LOGIC ---


const TicketList = () => {
    const theme = useTheme();
    const {
        darkMode, teamUserMap, searchQuery, setSearchQuery, issueType, setIssueType,
        filteredStatus, setFilteredStatus,
        availableIssueTypes: contextAvailableIssueTypes,
        handleResetFilters: contextHandleResetFilters,
        setUploadStatus, handleTicketDataChange
    } = useAdminDashboardContext();

    // ... (All other state and hooks: tickets, isLoading, editingTicket, etc. - NO CHANGES)
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTicket, setEditingTicket] = useState(null);
    const [editedValues, setEditedValues] = useState({});
    const [expandedContent, setExpandedContent] = useState({});
    const [editingStatusId, setEditingStatusId] = useState(null);
    const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
    const [ticketToDeleteId, setTicketToDeleteId] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const [isSaving, setIsSaving] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(null);
    const [isProcessingCard, setIsProcessingCard] = useState(null);
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const [showFilters, setShowFilters] = useState(!isMobile);
    useEffect(() => { setShowFilters(!isMobile); }, [isMobile]);
    const containerVariants = useMemo(() => ({ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } }), []);
    const cardVariants = useMemo(() => ({ hidden: { opacity: 0, y: 20, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } }, exit: { opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.25 } } }), []);
    const availableIssueTypesForDropdown = useMemo(() => contextAvailableIssueTypes && contextAvailableIssueTypes.length > 0 ? contextAvailableIssueTypes : ["Speed Issue", "Cable Complaint", "Recharge Related", "No Internet", "Others"], [contextAvailableIssueTypes] );
    const getUserDisplay = useCallback((userId) => { if (!userId || !teamUserMap || teamUserMap.size === 0) return 'Unknown'; const userInfo = teamUserMap.get(userId); return userInfo?.display_name || userInfo?.email || 'Unknown User'; }, [teamUserMap]);
    const getUserEmail = useCallback((userId) => { if (!userId || !teamUserMap || teamUserMap.size === 0) return 'Unknown Email'; const userInfo = teamUserMap.get(userId); return userInfo?.email || 'Unknown Email'; }, [teamUserMap]);
    const fetchTickets = useCallback(async () => { setIsLoading(true); setNotification({ open: false, message: '', severity: 'info' }); try { const params = new URLSearchParams(); if (filteredStatus) { params.append('status', filteredStatus); } const queryString = params.toString(); const url = `/api/admin/tickets${queryString ? `?${queryString}` : ''}`; const response = await axiosInstance.get(url); setTickets(response.data || []); } catch (error) { const errorMsg = error.response?.data?.message || 'Failed to fetch tickets.'; setNotification({ open: true, message: errorMsg, severity: 'error' }); if (setUploadStatus) setUploadStatus({ message: errorMsg, type: 'error', source: 'ticketListFetch' }); setTickets([]); } finally { setIsLoading(false); } }, [filteredStatus, setUploadStatus]);
    useEffect(() => { if (teamUserMap) { fetchTickets(); } else { setIsLoading(false); setTickets([]);} }, [fetchTickets, teamUserMap]);
    const handleCloseNotification = useCallback((event, reason) => { if (reason === 'clickaway') return; setNotification(prev => ({ ...prev, open: false })); }, []);
    const confirmDelete = useCallback((id) => { setTicketToDeleteId(id); setConfirmDeleteDialogOpen(true); }, []);
    const cancelDelete = useCallback(() => { setConfirmDeleteDialogOpen(false); setTicketToDeleteId(null); setIsDeleting(false); }, []);
    const handleDelete = useCallback(async () => { if (!ticketToDeleteId) return; const idToDelete = ticketToDeleteId; setIsDeleting(true); setIsProcessingCard(idToDelete); setNotification({ open: false, message: '', severity: 'info' }); if (setUploadStatus) setUploadStatus({ message: 'Deleting ticket...', type: 'info', source: `ticketDelete-${idToDelete}` }); try { await axiosInstance.delete(`/api/admin/tickets/${idToDelete}`); setTickets(prevTickets => prevTickets.filter(ticket => ticket._id !== idToDelete)); setNotification({ open: true, message: 'Ticket deleted!', severity: 'success' }); if (setUploadStatus) setUploadStatus({ message: 'Ticket deleted!', type: 'success', source: `ticketDelete-${idToDelete}` }); handleTicketDataChange(); setConfirmDeleteDialogOpen(false); setTicketToDeleteId(null); } catch (error) { const errorMsg = error.response?.data?.message || 'Failed to delete ticket.'; setNotification({ open: true, message: errorMsg, severity: 'error' }); if (setUploadStatus) setUploadStatus({ message: errorMsg, type: 'error', source: `ticketDelete-${idToDelete}` }); setConfirmDeleteDialogOpen(false); setTicketToDeleteId(null); } finally { setIsDeleting(false); setIsProcessingCard(null); } }, [ticketToDeleteId, setUploadStatus, handleTicketDataChange]);
    const handleEdit = useCallback((ticket) => { setEditingTicket(ticket._id); setEditedValues({ issue_type: ticket.issue_type || '', location: ticket.location || '', comments: ticket.comments || '', mobile_number: ticket.mobile_number || '', }); setEditingStatusId(null); }, []);
    const handleCancelEdit = useCallback(() => { setEditingTicket(null); setEditedValues({}); }, []);
    const handleInputChange = useCallback((field, value) => { setEditedValues(prev => ({ ...prev, [field]: value })); }, []);
    const handleSave = useCallback(async (ticketId) => { setNotification({ open: false, message: '', severity: 'info' }); let updateData = { ...editedValues }; if (!updateData.issue_type) { setNotification({ open: true, message: 'Issue Type is required.', severity: 'warning' }); return; } if (!updateData.location?.trim()) { setNotification({ open: true, message: 'Address is required.', severity: 'warning' }); return; } if (updateData.mobile_number) { const cleaned = String(updateData.mobile_number).replace(/\D/g, ''); if (!/^\d{10}$/.test(cleaned)) { setNotification({ open: true, message: 'Mobile number must be 10 digits.', severity: 'warning' }); return; } updateData.mobile_number = cleaned; } else { updateData.mobile_number = null; } const finalUpdateData = { issue_type: updateData.issue_type, location: updateData.location.trim(), comments: updateData.comments ? updateData.comments.trim() : '', mobile_number: updateData.mobile_number }; setIsSaving(ticketId); setIsProcessingCard(ticketId); if (setUploadStatus) setUploadStatus({ message: 'Saving changes...', type: 'info', source: `ticketSave-${ticketId}` }); try { const response = await axiosInstance.put(`/api/admin/tickets/${ticketId}`, finalUpdateData); if (response.status === 200 && response.data) { const updated = response.data; setTickets(p => p.map((t) => t._id === ticketId ? updated : t)); setEditingTicket(null); setEditedValues({}); setNotification({ open: true, message: 'Ticket updated successfully!', severity: 'success' }); if (setUploadStatus) setUploadStatus({ message: 'Ticket updated!', type: 'success', source: `ticketSave-${ticketId}` }); handleTicketDataChange(); } else { throw new Error('Invalid server response while updating ticket.'); } } catch (error) { const msg = error.response?.data?.message || 'Failed to update ticket.'; setNotification({ open: true, message: msg, severity: 'error' }); if (setUploadStatus) setUploadStatus({ message: msg, type: 'error', source: `ticketSave-${ticketId}` }); } finally { setIsSaving(null); setIsProcessingCard(null); } }, [editedValues, setUploadStatus, handleTicketDataChange]);
    const handleStatusChange = useCallback(async (ticketId, newStatus) => { const originalTickets = [...tickets]; setIsUpdatingStatus(ticketId); setIsProcessingCard(ticketId); setEditingStatusId(null); if (setUploadStatus) setUploadStatus({ message: 'Updating status...', type: 'info', source: `ticketStatus-${ticketId}` }); try { const response = await axiosInstance.put(`/api/admin/tickets/${ticketId}/status`, { status: newStatus }); if (response.status === 200 && response.data) { const updated = response.data; setTickets(p => p.map(t => t._id === ticketId ? updated : t)); setNotification({ open: true, message: `Status changed to ${newStatus}`, severity: 'success' }); if (setUploadStatus) setUploadStatus({ message: `Ticket status updated.`, type: 'success', source: `ticketStatus-${ticketId}` }); handleTicketDataChange(); } else { throw new Error('Invalid server response on status update.'); } } catch (error) { const msg = error.response?.data?.message || 'Failed to update status.'; setNotification({ open: true, message: msg, severity: 'error' }); if (setUploadStatus) setUploadStatus({ message: msg, type: 'error', source: `ticketStatus-${ticketId}` }); setTickets(originalTickets); } finally { setIsUpdatingStatus(null); setIsProcessingCard(null); } }, [tickets, setUploadStatus, handleTicketDataChange]);
    const toggleExpandContent = useCallback((ticketId, type) => { const key = `${ticketId}_${type}`; setExpandedContent(prev => ({ ...prev, [key]: !prev[key] })); }, []);
    const filteredTickets = useMemo(() => tickets.filter(ticket => { if (filteredStatus && ticket.status !== filteredStatus) return false; if (issueType && ticket.issue_type?.toUpperCase() !== issueType.toUpperCase()) return false; if (searchQuery) { const searchTerm = searchQuery.toLowerCase(); return ( ticket.ticket_id?.toLowerCase().includes(searchTerm) || ticket.issue_type?.toLowerCase().includes(searchTerm) || ticket.user_id?.toLowerCase().includes(searchTerm) || ticket.location?.toLowerCase().includes(searchTerm) || ticket.comments?.toLowerCase().includes(searchTerm) || ticket.mobile_number?.includes(searchTerm) ); } return true; }), [tickets, filteredStatus, issueType, searchQuery] );
    const handleLocalResetAndGlobal = () => { if(contextHandleResetFilters) contextHandleResetFilters(); };
    const editInputBaseClass = `font-raleway px-2 py-1.5 border rounded text-sm w-full mt-0.5 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'}`;
    const editInputFocusClass = `${darkMode ? 'focus:ring-sky-500 focus:border-sky-500' : 'focus:ring-indigo-500 focus:border-indigo-500'}`;
    const headerHeight = '64px';


    return (
        <Fragment>
            {/* ... (Snackbar and Dialog remain the same) ... */}
             <Snackbar open={notification.open} autoHideDuration={4000} onClose={handleCloseNotification} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} sx={{ zIndex: 1400 }}><MuiAlert onClose={handleCloseNotification} severity={notification.severity} variant="filled" sx={{ width: '100%', display: 'flex', alignItems: 'center' }} icon={false}><span style={{ marginRight: '8px', display: 'flex', alignItems: 'center' }}> {notification.severity === 'success' && <FaCheckCircle />} {notification.severity === 'error' && <FaExclamationCircle />} {notification.severity === 'warning' && <FaExclamationCircle />} {notification.severity === 'info' && <FaInfoCircle />} </span>{notification.message}</MuiAlert></Snackbar>
            <Dialog open={confirmDeleteDialogOpen} onClose={cancelDelete} PaperProps={{ sx: { bgcolor: darkMode ? 'grey.900' : 'background.paper', color: darkMode ? 'grey.100' : 'text.primary', borderRadius: 2 } }}><DialogTitle id="confirm-delete-dialog-title">Confirm Delete</DialogTitle><DialogContent><DialogContentText id="confirm-delete-dialog-description" sx={{ color: darkMode ? 'grey.300' : 'text.secondary' }}>Are you sure you want to delete this ticket? This action cannot be undone.</DialogContentText></DialogContent><MuiButton onClick={cancelDelete} sx={{ color: darkMode ? 'grey.400' : 'text.secondary' }}>Cancel</MuiButton><MuiButton onClick={handleDelete} color="error" variant="contained" disabled={isDeleting} startIcon={isDeleting ? <CircularProgress size={16} color="inherit" /> : null}>Delete</MuiButton></Dialog>

            {/* Filter Toggle Button (no change) */}
            <MuiIconButton onClick={() => setShowFilters(!showFilters)} size="medium" aria-expanded={showFilters} aria-controls="filter-panel-list" sx={{ position: 'fixed', top: `calc(${headerHeight} + ${theme.spacing(1)})`, right: theme.spacing(isMobile ? 2 : 3), zIndex: 1050, bgcolor: darkMode ? 'rgba(71, 85, 105, 0.8)' : 'rgba(226, 232, 240, 0.8)', backdropFilter: 'blur(5px)', color: darkMode ? 'grey.100' : theme.palette.primary.main, '&:hover': { bgcolor: darkMode ? 'rgba(96, 112, 131, 0.9)' : 'rgba(203, 213, 225, 0.9)' }, boxShadow: theme.shadows[4], borderRadius: '8px', p: 0.75, }}> {showFilters ? <CloseIcon fontSize="small" /> : <FilterListIcon fontSize="small" />} {(searchQuery || issueType || filteredStatus) && !showFilters && ( <Box component="span" sx={{ width: 7, height: 7, bgcolor: 'error.main', borderRadius: '50%', position: 'absolute', top: 6, right: 6 }} title="Filters active" /> )} </MuiIconButton>

            {/* Sticky Filter Panel (InputLabel for Select fixed) */}
            <Box sx={{ position: 'sticky', top: headerHeight, zIndex: 20, }}>
                <AnimatePresence>
                    {showFilters && (
                        <motion.div key="filter-panel-list-content" id="filter-panel-list" initial={{ y: "-100%", opacity: 0.5 }} animate={{ y: "0%", opacity: 1 }} exit={{ y: "-100%", opacity: 0 }} transition={{ type: "tween", duration: 0.3, ease: "circOut" }}>
                            <Paper elevation={4} sx={{ p: { xs: 1.5, sm: 2, md: 2 }, borderRadius: '0 0 12px 12px', bgcolor: darkMode ? 'rgba(30, 41, 59, 0.97)' : 'rgba(255, 255, 255, 0.97)', backdropFilter: 'blur(8px)', border: darkMode ? `1px solid ${theme.palette.grey[700]}` : `1px solid ${theme.palette.grey[200]}`, borderTop: 'none', mb: 2, }}>
                                <Grid container spacing={{ xs: 1.5, sm: 2 }} alignItems="flex-end">
                                     <Grid item xs={12} md={filteredStatus ? 5 : 6} lg={filteredStatus ? 5 : 6}><TextField fullWidth variant="outlined" size="small" placeholder="Search tickets..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: darkMode ? 'grey.700' : 'rgba(255,255,255,0.8)'}, input: { color: darkMode ? 'white' : 'text.primary', fontSize: '0.9rem', py: '10.5px' } }} /></Grid>
                                    <Grid item xs={12} sm={6} md={filteredStatus ? 4 : 4} lg={filteredStatus ? 3 : 4}>
                                        <FormControl fullWidth size="small" variant="outlined">
                                            {/* <InputLabel id="issue-type-filter-label-list" shrink={!!issueType} sx={{ color: darkMode ? 'grey.400' : 'text.secondary', '&.Mui-focused': {color: darkMode ? theme.palette.primary.light : theme.palette.primary.main } }}>Issue Type</InputLabel> */}
                                            <Select labelId="issue-type-filter-label-list" value={issueType} onChange={(e) => setIssueType(e.target.value)} displayEmpty label="" sx={{ borderRadius: '8px', bgcolor: darkMode ? 'grey.700' : 'rgba(255,255,255,0.8)', color: darkMode ? 'white' : 'text.primary', '.MuiSelect-icon': { color: darkMode ? 'grey.300' : 'action.active' }, '& .MuiOutlinedInput-input': { fontSize: '0.9rem', py: '10.5px'}, '& .MuiSelect-select em': { fontStyle: 'normal', color: darkMode ? 'grey.500' : 'grey.600' } }} MenuProps={{ PaperProps: { sx: { bgcolor: darkMode ? 'grey.800' : 'background.paper', color: darkMode ? 'white' : 'text.primary' } } }} >
                                                <MenuItem value=""><em>All Issues</em></MenuItem>
                                                {availableIssueTypesForDropdown.map((type) => (<MenuItem key={type} value={type.toUpperCase()}>{type}</MenuItem>))}
                                            </Select>
                                        </FormControl>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={filteredStatus ? 3 : 2} lg={2}><MuiButton fullWidth variant="outlined" onClick={handleLocalResetAndGlobal} sx={{ borderRadius: '8px', py: '8.5px', color: darkMode ? 'grey.300' : 'text.secondary', borderColor: darkMode ? 'grey.600' : 'grey.400', '&:hover': { bgcolor: darkMode ? 'grey.700' : 'grey.100', borderColor: darkMode ? 'grey.500' : 'grey.500' } }} > Reset </MuiButton></Grid>
                                     {filteredStatus && ( <Grid item xs={12} md="auto" lg="auto" sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, justifyContent: {xs:'flex-start', md:'flex-end'} }}><Typography variant="caption" sx={{ fontStyle: 'italic', color: darkMode ? 'grey.300' : 'text.secondary', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}> Status: <strong style={{color: darkMode ? theme.palette.info.light : theme.palette.info.dark, fontWeight: 'bold', marginLeft: '4px', marginRight: '2px'}}>{filteredStatus}</strong> <MuiIconButton size="small" onClick={() => setFilteredStatus(null)} title="Clear status filter" sx={{ml:0, p: 0.25, color: darkMode ? 'grey.400' : 'grey.600', '&:hover': {color: darkMode? theme.palette.error.light : theme.palette.error.dark, bgcolor: 'transparent'}}}><FaTimes style={{fontSize: '0.7rem'}}/></MuiIconButton> </Typography> </Grid> )}
                                </Grid>
                            </Paper>
                        </motion.div>
                    )}
                </AnimatePresence>
            </Box>

            {/* Ticket List Rendering */}
            <div className={`font-raleway min-h-[calc(100vh-200px)] ${darkMode ? "text-white" : "text-gray-700"}`}>
                {isLoading ? ( <div className="flex justify-center items-center p-10"><FaSpinner className={`animate-spin text-3xl ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} /><span className="ml-3 text-lg">Loading tickets...</span></div>
                ) : (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-8">
                        <AnimatePresence>
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map((ticket) => {
                                    const isAddressExpanded = expandedContent[`${ticket._id}_address`];
                                    const isCommentsExpanded = expandedContent[`${ticket._id}_comments`];
                                    const locationText = ticket.location || '';
                                    const commentsText = ticket.comments || '';
                                    const canExpandAddress = locationText.length > 100;
                                    const canExpandComments = commentsText.trim() !== '' && commentsText.trim() !== 'N/A' && commentsText.length > 100;
                                    const currentTicketStatusClasses = getStatusBadgeTailwindClasses(ticket.status, darkMode); // Use the shared helper

                                    return (
                                        <motion.div key={ticket._id} layout variants={cardVariants} initial="hidden" animate="visible" exit="exit" className={`rounded-xl shadow-lg flex flex-col justify-between relative border p-4 sm:p-5 ${editingTicket === ticket._id ? (darkMode ? 'bg-gray-700/80 border-sky-500 ring-2 ring-sky-500/70' : 'bg-sky-50/80 border-sky-400 ring-2 ring-sky-400/70') : (darkMode ? 'bg-gray-800 border-gray-700 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-400')} transition-all duration-300 ease-in-out`} >
                                            <AnimatePresence>{(isProcessingCard === ticket._id) && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/60 dark:bg-black/75 flex items-center justify-center rounded-xl z-20 backdrop-blur-sm" > <FaSpinner className="animate-spin text-white text-3xl" /> </motion.div>)}</AnimatePresence>
                                            <Box className={(isProcessingCard === ticket._id) ? 'opacity-40 pointer-events-none' : ''}>
                                                <Typography variant="h6" component="h3" className="text-base sm:text-lg md:text-xl" sx={{ mb: 2.5, fontWeight: '600', color: darkMode? theme.palette.primary.light : theme.palette.primary.main, wordBreak: 'break-word', lineHeight: 1.3 }} > Ticket ID: {ticket.ticket_id || 'N/A'} </Typography>
                                                <Box sx={{mb: 1.5}}>
                                                    <InfoRow label="Issue Type" darkMode={darkMode} valueClassName="text-sm sm:text-[0.9rem]">
                                                        {editingTicket === ticket._id ? ( <select value={editedValues.issue_type || ''} onChange={(e) => handleInputChange('issue_type', e.target.value)} className={`${editInputBaseClass} ${editInputFocusClass}`}><option value="" disabled>Select Type</option>{availableIssueTypesForDropdown.map((type) => (<option className="font-raleway" key={type} value={type}>{type}</option>))}</select>
                                                        ) : ( <span className={currentTicketStatusClasses}> {ticket.issue_type || 'N/A'} </span> )} {/* MODIFIED: Issue Type badge uses status colors */}
                                                    </InfoRow>
                                                    <InfoRow label="User ID" value={ticket.user_id} darkMode={darkMode} valueClassName="text-sm sm:text-[0.9rem]" />
                                                    <InfoRow label="Mobile No." darkMode={darkMode}> {editingTicket === ticket._id ? ( <input type="tel" value={editedValues.mobile_number || ''} onChange={(e) => handleInputChange('mobile_number', e.target.value)} className={`${editInputBaseClass} ${editInputFocusClass}`} placeholder="10 digits" maxLength={10} /> ) : ( <Typography variant="body2" component="span" className="text-sm sm:text-[0.9rem]" sx={{ color: darkMode ? 'grey.100' : 'text.primary', fontWeight: 500 }}>{ticket.mobile_number || 'N/A'}</Typography> )} </InfoRow>
                                                    <InfoRow label="Address" isValueBlock darkMode={darkMode} valueClassName="text-xs sm:text-sm"> {editingTicket === ticket._id ? ( <input type="text" value={editedValues.location || ''} onChange={(e) => handleInputChange('location', e.target.value)} className={`${editInputBaseClass} ${editInputFocusClass}`} placeholder="Enter full address" /> ) : ( <Typography component="div" variant="body2" className="text-xs sm:text-sm" sx={{color: darkMode ? 'grey.200' : 'grey.700', lineHeight: 1.45, mt: 0.25 }}> <span> {isAddressExpanded || !canExpandAddress ? locationText : `${locationText.substring(0, 100)}...`} </span> {canExpandAddress && ( <Tooltip title={isAddressExpanded ? "Show Less" : "Show More"} placement="top"><MuiIconButton size="small" onClick={() => toggleExpandContent(ticket._id, 'address')} sx={{p:0.25, ml:0.5, color: darkMode ? 'sky.300': 'primary.main', '&:hover': {bgcolor: darkMode? 'rgba(125,211,252,0.1)' : 'rgba(25,118,210,0.05)'} }}>{isAddressExpanded ? <FaChevronUp size="0.8em"/> : <FaChevronDown size="0.8em"/>}</MuiIconButton></Tooltip> )} {(!locationText || locationText.trim() === '') && 'N/A'} </Typography> )} </InfoRow>
                                                    <InfoRow label="Status" darkMode={darkMode}> {isUpdatingStatus === ticket._id ? (<FaSpinner className="animate-spin ml-1 text-sm" />) : editingStatusId === ticket._id ? ( <select value={ticket.status} onChange={(e) => handleStatusChange(ticket._id, e.target.value)} onBlur={() => setEditingStatusId(null)} autoFocus className={`font-raleway px-2 py-1 rounded text-xs font-semibold appearance-none focus:outline-none focus:ring-2 ${darkMode ? 'focus:ring-sky-400' : 'focus:ring-sky-500'} ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-gray-200 border-gray-300'}`} > <option value="Open"> Open</option> <option value="In Progress"> In Progress</option> <option value="Resolved"> Resolved</option> </select> ) : ( <Tooltip title={editingTicket ? '' : "Click to change status"} placement="top"><span className={`${currentTicketStatusClasses} cursor-pointer`} onClick={() => !editingTicket && setEditingStatusId(ticket._id)}> {ticket.status === 'Open' && <FaEnvelopeOpenText />} {ticket.status === 'In Progress' && <FaCircleNotch className="animate-spin" />} {ticket.status === 'Resolved' && <FaThumbsUp />} <span className="ml-1">{ticket.status || 'N/A'}</span> </span></Tooltip> )} </InfoRow>
                                                </Box>
                                                <Divider sx={{ my: 2, borderColor: darkMode ? 'grey.700' : 'grey.300' }} />
                                                <Box sx={{ fontSize: '0.8rem', color: darkMode ? 'grey.400' : 'text.secondary', mb: (commentsText && commentsText.trim() !== '' && commentsText.trim() !== 'N/A') ? 1.5 : 2.5}}> <Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap:'wrap', alignItems: 'center', mb: 0.5 }}><Typography variant="caption" sx={{color: darkMode ? 'grey.500' : 'grey.600'}}>Created: {formatTimestampLocal(ticket.originalCreatedAt)}</Typography>{ticket.created_by_auth_id && <Tooltip title={`Created by: ${getUserEmail(ticket.created_by_auth_id)}`}><Typography variant="caption" sx={{color: darkMode ? 'grey.500' : 'grey.600'}}> By: {getUserDisplay(ticket.created_by_auth_id)}</Typography></Tooltip>}</Box> {ticket.originalUpdatedAt && ticket.originalUpdatedAt !== ticket.originalCreatedAt && ticket.last_edited_by_auth_id && (<Box sx={{ display: 'flex', justifyContent: 'space-between', flexWrap:'wrap', alignItems: 'center', mt: 0.5 }}><Typography variant="caption" sx={{color: darkMode ? 'grey.500' : 'grey.600'}}>Edited: {formatTimestampLocal(ticket.originalUpdatedAt)}</Typography><Tooltip title={`Edited by: ${getUserEmail(ticket.last_edited_by_auth_id)}`}><Typography variant="caption" sx={{color: darkMode ? 'grey.500' : 'grey.600'}}> By: {getUserDisplay(ticket.last_edited_by_auth_id)}</Typography></Tooltip></Box>)} </Box>
                                                {commentsText && commentsText.trim() !== '' && commentsText.trim() !== 'N/A' && (<Fragment><Divider sx={{ my: 2, borderColor: darkMode ? 'grey.700' : 'grey.300' }} /><InfoRow label="Comments" isValueBlock darkMode={darkMode} valueClassName="text-xs sm:text-sm">{editingTicket === ticket._id ? (<textarea value={editedValues.comments || ''} onChange={(e) => handleInputChange('comments', e.target.value)} className={`${editInputBaseClass} ${editInputFocusClass}`} rows="3" placeholder="Enter comments..." />) : (<Typography component="div" variant="body2" className="text-xs sm:text-sm" sx={{color: darkMode ? 'grey.200' : 'grey.700', lineHeight: 1.45, mt: 0.25, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}><span>{isCommentsExpanded || !canExpandComments ? commentsText : `${commentsText.substring(0, 100)}...`}</span>{canExpandComments && ( <Tooltip title={isCommentsExpanded ? "Show Less" : "Show More"} placement="top"><MuiIconButton size="small" onClick={() => toggleExpandContent(ticket._id, 'comments')} sx={{p:0.25, ml:0.5, display: 'inline', verticalAlign: 'middle', color: darkMode ? 'sky.300': 'primary.main', '&:hover': {bgcolor: darkMode? 'rgba(125,211,252,0.1)' : 'rgba(25,118,210,0.05)'}}}>{isCommentsExpanded ? <FaChevronUp size="0.8em"/> : <FaChevronDown size="0.8em"/>}</MuiIconButton></Tooltip> )}</Typography>)}</InfoRow></Fragment>)}
                                            </Box>
                                            <Box sx={{ mt: 'auto', pt: 2, borderTop: 1, borderColor: darkMode ? 'grey.600' : 'grey.300' }}><div className={`flex items-center space-x-1 sm:space-x-2`}>{editingTicket === ticket._id ? ( <Fragment><Tooltip title="Save Changes" placement="top" arrow><Box component="span" sx={{ display: 'inline-block', cursor: (isSaving === ticket._id) ? 'not-allowed' : 'pointer' }}><MuiIconButton onClick={() => handleSave(ticket._id)} size="small" sx={{ color: darkMode ? theme.palette.success.light : theme.palette.success.main, '&:hover': { bgcolor: darkMode ? 'rgba(102, 187, 106, 0.2)' : 'rgba(46, 125, 50, 0.1)' }, p: {xs: 0.75, sm: 1} }} aria-label="save" disabled={isSaving === ticket._id}> {isSaving === ticket._id ? <CircularProgress size={20} color="inherit" /> : <SaveIcon fontSize="small" />} </MuiIconButton></Box></Tooltip><Tooltip title="Cancel Edit" placement="top" arrow><Box component="span" sx={{ display: 'inline-block', cursor: (isSaving === ticket._id) ? 'not-allowed' : 'pointer' }}><MuiIconButton onClick={handleCancelEdit} size="small" sx={{ color: darkMode? 'grey.300' : 'text.secondary', '&:hover': { bgcolor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)' }, p: {xs: 0.75, sm: 1} }} aria-label="cancel" disabled={isSaving === ticket._id}> <CancelIcon fontSize="small" /> </MuiIconButton></Box></Tooltip></Fragment> ) : ( <Fragment><Tooltip title="Edit Ticket" placement="top" arrow><Box component="span" sx={{ display: 'inline-block', cursor: (!!isProcessingCard || !!editingTicket) ? 'not-allowed' : 'pointer' }}><MuiIconButton onClick={() => handleEdit(ticket)} size="small" sx={{ color: darkMode ? theme.palette.primary.light : theme.palette.primary.main, '&:hover': { bgcolor: darkMode ? 'rgba(144, 202, 249, 0.15)' : 'rgba(25, 118, 210, 0.1)' }, p: {xs: 0.75, sm: 1} }} aria-label="edit" disabled={!!isProcessingCard || !!editingTicket}> <EditIcon fontSize="small" /> </MuiIconButton></Box></Tooltip><Tooltip title="Delete Ticket" placement="top" arrow><Box component="span" sx={{ display: 'inline-block', cursor: (!!isProcessingCard || !!editingTicket) ? 'not-allowed' : 'pointer' }}><MuiIconButton onClick={() => confirmDelete(ticket._id)} size="small" sx={{ ml: 'auto', color: darkMode ? theme.palette.error.light : theme.palette.error.main, '&:hover': { bgcolor: darkMode ? 'rgba(244, 67, 54, 0.2)' : 'rgba(211, 47, 47, 0.1)' }, p: {xs: 0.75, sm: 1} }} aria-label="delete" disabled={!!isProcessingCard || !!editingTicket}> <DeleteIcon fontSize="small" /> </MuiIconButton></Box></Tooltip></Fragment> )}</div></Box>
                                        </motion.div>
                                    )
                                })
                            ) : ( <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center"><FaSearchMinus size="3.5em" className="mb-4 opacity-50" /><Typography variant="h6" component="p" sx={{mb:1}}> No tickets found. </Typography><Typography variant="body2" sx={{color: darkMode ? 'grey.500' : 'grey.600'}}> Try adjusting your search or filter criteria. </Typography></div> )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </Fragment>
    );
};

export default TicketList;