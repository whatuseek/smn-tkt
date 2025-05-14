// frontend/src/pages/admin/DashboardHomePage.jsx
import { useState, useEffect, useCallback, Fragment } from 'react';
import {
    Typography, useTheme, Paper, List, ListItemButton, ListItemText, ListItemAvatar,
    Avatar, Divider, Button, Box, CircularProgress,
    Skeleton, Dialog, DialogTitle, DialogContent, IconButton as MuiIconButton,
    Grid,ListItem,
    Accordion, AccordionSummary, AccordionDetails, Tooltip
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { motion } from 'framer-motion';
import {
    FaTicketAlt, FaEnvelopeOpenText, FaCircleNotch, FaThumbsUp,
    FaChartBar, FaFileExport, FaAngleRight, FaBoxOpen, FaExclamationCircle,
    FaUser, FaMobileAlt, FaMapMarkerAlt, FaCommentDots, FaCalendarAlt, FaUserEdit,
    FaInfoCircle, FaTasks
} from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { useAdminDashboardContext } from '../../layouts/AdminDashboardLayout';
import axiosInstance from '../../api/axiosInstance';
import PropTypes from 'prop-types';

// Helper for STAT CARD classes (Source of Truth for colors)
const getStatCardBaseClasses = () => `rounded-xl shadow-lg p-4 flex flex-col items-start cursor-pointer transition-all duration-200 ease-in-out hover:shadow-xl hover:-translate-y-1 active:scale-[0.97] active:brightness-90 border`;

const getStatusSpecificStatCardClasses = (statusType, darkMode) => {
    const base = getStatCardBaseClasses();
    switch (statusType) {
        case "Total": return `${base} ${darkMode ? "bg-slate-700 text-slate-100 border-slate-600 hover:bg-slate-600" : "bg-slate-100 text-slate-800 border-slate-300 hover:bg-slate-200"}`;
        case "Open": return `${base} ${darkMode ? "bg-blue-700 text-blue-100 border-blue-600 hover:bg-blue-600" : "bg-blue-500 text-white border-blue-600 hover:bg-blue-600"}`;
        case "In Progress": return `${base} ${darkMode ? "bg-amber-600 text-amber-100 border-amber-500 hover:bg-amber-500" : "bg-amber-500 text-white border-amber-600 hover:bg-amber-600"}`;
        case "Resolved": return `${base} ${darkMode ? "bg-emerald-700 text-emerald-100 border-emerald-600 hover:bg-emerald-600" : "bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600"}`;
        default: return `${base} ${darkMode ? "bg-gray-700 text-gray-200 border-gray-600 hover:bg-gray-600" : "bg-gray-100 text-gray-800 border-gray-300 hover:bg-gray-200"}`;
    }
};

// Shared helper for BADGE/AVATAR colors based on Stat Card Logic
const getStatusBasedTailwindColors = (statusType, darkMode) => {
    switch (statusType) {
        case "Open": return { bg: darkMode ? "bg-blue-700" : "bg-blue-500", text: darkMode ? "text-blue-100" : "text-white", avatarText: darkMode ? "text-blue-100" : "text-white" };
        case "In Progress": return { bg: darkMode ? "bg-amber-600" : "bg-amber-500", text: darkMode ? "text-amber-100" : "text-white", avatarText: darkMode ? "text-amber-100" : "text-white" };
        case "Resolved": return { bg: darkMode ? "bg-emerald-700" : "bg-emerald-500", text: darkMode ? "text-emerald-100" : "text-white", avatarText: darkMode ? "text-emerald-100" : "text-white" };
        default: return { bg: darkMode ? "bg-gray-600" : "bg-gray-400", text: darkMode ? "text-gray-200" : "text-gray-800", avatarText: darkMode ? "text-gray-200" : "text-gray-800" };
    }
};

const formatTimestampLocal = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        const dateObject = new Date(isoString);
        if (isNaN(dateObject.getTime())) { return 'Invalid Date'; }
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true, };
        return new Intl.DateTimeFormat('en-US', options).format(dateObject);
    } catch (e) { console.error("Error formatting date:", e); return 'Invalid Date'; }
};

const TicketDetailRow = ({ label, value, icon: IconComponent, darkMode, children }) => {
    const theme = useTheme();
    const iconSize = '1.05em';
    const iconMarginRight = '12px';
    return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 1.8, lineHeight: 1.6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', minWidth: '120px', mr: 1 }}>
            {IconComponent && <IconComponent style={{ marginRight: iconMarginRight, fontSize: iconSize, color: darkMode ? theme.palette.grey[500] : theme.palette.grey[600], flexShrink: 0 }} /> }
            {!IconComponent && <Box sx={{width: `calc(${iconSize} + ${iconMarginRight})`, flexShrink:0}} /> }
            <Typography variant="body2" component="strong" sx={{ color: darkMode ? 'grey.300' : 'text.secondary', fontWeight: 500, flexShrink: 0 }}>{label}:</Typography>
        </Box>
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>{children ? children : (<Typography variant="body2" sx={{ color: darkMode ? 'grey.100' : 'text.primary', wordBreak: 'break-word' }}>{value || 'N/A'}</Typography>)}</Box>
    </Box>
)};
TicketDetailRow.propTypes = { label: PropTypes.string.isRequired, value: PropTypes.string, icon: PropTypes.elementType, darkMode: PropTypes.bool.isRequired, children: PropTypes.node, };


const DashboardHomePage = () => {
    const {
        nameToDisplay, darkMode,
        totalTickets, openTickets, inProgressTickets, resolvedTickets, // Using all from context
        handleNavigateToTicketsWithFilter,
        teamUserMap,
    } = useAdminDashboardContext();
    const theme = useTheme();
    const navigate = useNavigate();

    const [recentTickets, setRecentTickets] = useState([]);
    const [isLoadingRecent, setIsLoadingRecent] = useState(true);
    const [recentTicketsError, setRecentTicketsError] = useState('');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isRecentTicketsExpanded, setIsRecentTicketsExpanded] = useState(false);

    const getUserDisplay = useCallback((userId) => { if (!userId || !teamUserMap || teamUserMap.size === 0) return 'Unknown'; const userInfo = teamUserMap.get(userId); return userInfo?.display_name || userInfo?.email || 'Unknown User'; }, [teamUserMap]);
    
    // This function can be removed if not used anywhere else in this specific file after changes
    // const getStatusColorClassesModal = useCallback((status) => { ... });

    const fetchRecentTickets = useCallback(async () => {
        setIsLoadingRecent(true); setRecentTicketsError('');
        try { const response = await axiosInstance.get('/api/admin/tickets?_sort=created_at&_order=desc&_limit=6'); setRecentTickets(response.data || []); }
        catch (error) { console.error("Failed to fetch recent tickets:", error); const errorMsg = error.response?.data?.message || "Could not load recent tickets data."; setRecentTicketsError(errorMsg); setRecentTickets([]); }
        finally { setIsLoadingRecent(false); }
    }, []);

    useEffect(() => { fetchRecentTickets(); }, [fetchRecentTickets]);

    const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

    // Use values from context directly for the loading check as well
    if (totalTickets === undefined || openTickets === undefined || inProgressTickets === undefined || resolvedTickets === undefined) {
        return ( <div className="mt-6 p-4 text-center"> <CircularProgress size={32} sx={{color: darkMode ? 'grey.400' : 'primary.main'}}/> <Typography sx={{color: darkMode ? 'grey.400' : 'text.secondary', mt:1}}>Loading dashboard stats...</Typography> </div> );
    }

    const statCardData = [
        { title: "Total Tickets", value: totalTickets, icon: FaTicketAlt, statusType: "Total", action: () => handleNavigateToTicketsWithFilter(null) },
        { title: "Open", value: openTickets, icon: FaEnvelopeOpenText, statusType: "Open", action: () => handleNavigateToTicketsWithFilter("Open") },
        { title: "In Progress", value: inProgressTickets, icon: FaCircleNotch, statusType: "In Progress", action: () => handleNavigateToTicketsWithFilter("In Progress") },
        { title: "Resolved", value: resolvedTickets, icon: FaThumbsUp, statusType: "Resolved", action: () => handleNavigateToTicketsWithFilter("Resolved") }
    ];

    const reportLinks = [
        { title: "Ticket Details Export", description: "Download comprehensive ticket data.", icon: FaFileExport, path: "/admin-dashboard/reports/tickets" },
        { title: "Ticket Analytics", description: "Visualize trends and issue distributions.", icon: FaChartBar, path: "/admin-dashboard/reports/analytics" }
    ];

    const renderRecentTicketGridSkeletons = () => (
        <Grid container spacing={1.5}>
            {[...Array(3)].map((_, i) => (
                <Grid item xs={4} sm={4} md={4} key={`skeleton-grid-item-${i}`}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 1 }}>
                        <Skeleton variant="circular" width={48} height={48} sx={{bgcolor: darkMode ? 'grey.700' : 'grey.300', mb: 0.5}} />
                        <Skeleton variant="text" width="80%" height={18} sx={{bgcolor: darkMode ? 'grey.700' : 'grey.300'}}/>
                    </Box>
                </Grid>
            ))}
        </Grid>
    );

    const handleRecentTicketClick = (ticket) => { setSelectedTicket(ticket); setIsModalOpen(true); };
    const handleCloseModal = () => { setIsModalOpen(false); setSelectedTicket(null); };

    return (
        <Fragment>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mt-6">
                <Typography variant="h5" component="h1" sx={{ mb: 3, color: darkMode ? 'white' : 'text.primary', fontWeight: 'medium' }}>
                    Welcome{nameToDisplay ? `, ${nameToDisplay}` : ''}!
                </Typography>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5 mb-6 sm:mb-8">
                    {statCardData.map((card) => ( <div key={card.title} onClick={card.action} className={getStatusSpecificStatCardClasses(card.statusType, darkMode)} title={`View ${card.statusType === "Total" ? "All" : card.statusType} Tickets`} role="button" tabIndex={0} onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') card.action(); }} > <div className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-1.5 flex items-center gap-1 sm:gap-1.5 ${card.statusType === "Total" ? (darkMode ? 'text-slate-300' : 'text-slate-600') : (darkMode ? 'text-inherit' : 'text-inherit')} `}> <card.icon className={`${card.statusType === "In Progress" ? "animate-spin" : ""} text-sm sm:text-base ${card.statusType === "Total" ? (darkMode ? 'text-slate-400' : 'text-slate-500') : (darkMode ? 'opacity-80' : 'opacity-90')}`} /> {card.title} </div> <div className={`text-3xl sm:text-4xl font-bold ${darkMode && card.statusType !== "Total" ? 'text-white' : 'text-inherit'}`}> {card.value} </div> </div> ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                    <Paper elevation={2} sx={{ bgcolor: darkMode ? 'grey.850' : 'white', borderRadius: '12px', overflow: 'hidden' }}>
                        <Accordion
                            expanded={isRecentTicketsExpanded}
                            onChange={() => setIsRecentTicketsExpanded(!isRecentTicketsExpanded)}
                            disableGutters elevation={0}
                            sx={{ '&:before': { display: 'none' }, bgcolor: 'transparent' }}
                        >
                            <AccordionSummary expandIcon={<ExpandMoreIcon sx={{color: darkMode ? 'grey.400' : 'text.secondary'}} />} aria-controls="recent-tickets-content" id="recent-tickets-header" sx={{ p: {xs: 2, sm: 2.5}, borderBottom: isRecentTicketsExpanded ? 1 : 0, borderColor: darkMode? 'grey.700' : 'grey.200', minHeight: 'auto', '& .MuiAccordionSummary-content': { my: 0, justifyContent: 'space-between', alignItems: 'center' }, }}>
                                <Typography variant="h6" component="h2" sx={{ color: darkMode ? 'grey.100' : 'text.primary', fontWeight: 500 }}>Recent Tickets</Typography>
                                { !isRecentTicketsExpanded && !isLoadingRecent && recentTickets.length > 0 && <Typography variant="caption" sx={{color: darkMode ? 'grey.400' : 'text.secondary'}}>({recentTickets.length} items)</Typography> }
                                { isRecentTicketsExpanded && ( <Button size="small" onClick={(e) => { e.stopPropagation(); handleNavigateToTicketsWithFilter(null);}} endIcon={<FaAngleRight />} sx={{color: darkMode? theme.palette.primary.light : theme.palette.primary.main, textTransform: 'none', '&:hover': {bgcolor: darkMode ? 'rgba(144,202,249,0.1)' : 'rgba(25,118,210,0.05)'}, mr: -1}}>View All</Button> )}
                            </AccordionSummary>
                            <AccordionDetails sx={{ p: {xs: 1, sm: 1.5} }}>
                                {isLoadingRecent ? ( renderRecentTicketGridSkeletons()
                                ) : recentTicketsError ? ( <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent:'center', alignItems: 'center', height: '100px', color: darkMode ? theme.palette.error.light : theme.palette.error.dark, textAlign: 'center', p: 1 }}> <FaExclamationCircle size="1.5em" style={{ opacity: 0.8, marginBottom: '8px' }} /> <Typography variant="caption" sx={{ fontStyle: 'italic', mb:0.5 }}>{recentTicketsError}</Typography> <Button size="small" variant="text" onClick={fetchRecentTickets} sx={{mt: 0.5, color: 'inherit', '&:hover': {bgcolor: darkMode? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}}}>Try Again</Button> </Box>
                                ) : recentTickets.length > 0 ? (
                                    <Grid container spacing={1.5}>
                                        {recentTickets.map((ticket) => {
                                            const statusColors = getStatusBasedTailwindColors(ticket.status, darkMode);
                                            return (
                                                <Grid item xs={4} key={ticket.ticket_id || ticket._id}>
                                                    <Tooltip title={<Fragment><Typography variant="caption" component="div">{ticket.issue_type}</Typography><Typography variant="caption" component="div">{formatTimestampLocal(ticket.originalCreatedAt || ticket.created_at)}</Typography></Fragment>} placement="top">
                                                        <Box onClick={() => handleRecentTicketClick(ticket)} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 1, height: {xs: 90, sm: 100}, borderRadius: '10px', cursor: 'pointer', textAlign: 'center', border: `1px solid ${darkMode ? theme.palette.grey[700] : theme.palette.grey[300]}`, '&:hover': { borderColor: statusColors.bg.replace('bg-','border-'), boxShadow: theme.shadows[3] } }}>
                                                            <Avatar className={`${statusColors.bg} ${statusColors.avatarText}`} sx={{ width: 36, height: 36, fontSize: '1rem', mb: 0.5 }}>
                                                                {ticket.issue_type ? ticket.issue_type.charAt(0).toUpperCase() : 'T'}
                                                            </Avatar>
                                                            <Typography variant="caption" sx={{ color: darkMode ? theme.palette.primary.light : theme.palette.primary.main, fontWeight: 'medium', noWrap: true, width: '100%', fontSize: '0.7rem' }}>{ticket.ticket_id}</Typography>
                                                            <Typography variant="caption" sx={{color: darkMode ? 'grey.400' : 'text.secondary', display: {xs: 'none', sm: 'block'}, fontSize: '0.65rem', noWrap: true, width: '100%'}}>{ticket.issue_type.length > 15 ? ticket.issue_type.substring(0,12) + "..." : ticket.issue_type}</Typography>
                                                        </Box>
                                                    </Tooltip>
                                                </Grid>
                                            );
                                        })}
                                    </Grid>
                                ) : ( <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent:'center', alignItems: 'center', height: '100px', color: darkMode ? 'grey.500' : 'grey.600', textAlign: 'center', p: 1}}> <FaBoxOpen size="2em" style={{ opacity: 0.7, marginBottom: '10px' }} /> <Typography sx={{ fontStyle: 'italic', fontSize: '0.85rem' }}>No recent tickets.</Typography> </Box> )}
                            </AccordionDetails>
                        </Accordion>
                    </Paper>

                    <Paper elevation={2} sx={{ p: {xs: 2, sm: 2.5}, bgcolor: darkMode ? 'grey.850' : 'white', borderRadius: '12px', minHeight: {md: '320px'} }}>
                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5,  pb: 1.5, borderBottom: 1, borderColor: darkMode? 'grey.700' : 'grey.200'}}> <Typography variant="h6" component="h2" sx={{ color: darkMode ? 'grey.100' : 'text.primary', fontWeight: 500 }}>Reports Quick Access</Typography> <Button size="small" onClick={() => navigate("/admin-dashboard/reports")} endIcon={<FaAngleRight />} sx={{color: darkMode? theme.palette.primary.light : theme.palette.primary.main, textTransform: 'none', '&:hover': {bgcolor: darkMode ? 'rgba(144,202,249,0.1)' : 'rgba(25,118,210,0.05)'}}}>All Reports</Button> </Box>
                        <List disablePadding> {reportLinks.map((report, index) => ( <Fragment key={report.title}><ListItem disablePadding><ListItemButton onClick={() => navigate(report.path)} sx={{ py: 1.5, borderRadius: '6px', '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'grey.100' }}}><ListItemAvatar sx={{minWidth: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}><Avatar sx={{ bgcolor: 'transparent', width: 38, height: 38 }}><report.icon style={{ color: darkMode ? theme.palette.primary.light : theme.palette.primary.main, fontSize: '1.5rem' }} /></Avatar></ListItemAvatar><ListItemText primary={report.title} secondary={report.description} primaryTypographyProps={{ fontWeight: 500, fontSize: '1rem', color: darkMode ? 'grey.100' : 'text.primary' }} secondaryTypographyProps={{ fontSize: '0.85rem', color: darkMode ? 'grey.400' : 'text.secondary' }} /></ListItemButton></ListItem>{index < reportLinks.length - 1 && <Divider sx={{borderColor: darkMode ? 'grey.700' : 'grey.200'}}/>}</Fragment> ))} </List>
                    </Paper>
                </div>
            </motion.div>

            {selectedTicket && (
                <Dialog open={isModalOpen} onClose={handleCloseModal} maxWidth="sm" fullWidth PaperProps={{sx: { borderRadius: '12px', bgcolor: darkMode? 'grey.800' : 'grey.50'}}} >
                    <DialogTitle sx={{ bgcolor: darkMode? 'grey.700' : 'grey.100', color: darkMode? 'grey.100':'text.primary', borderBottom: 1, borderColor: darkMode? 'grey.600' : 'grey.300', py: 1.5, px: {xs:2, sm:3} }}>
                        <Box sx={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}> <Typography variant="h6" component="span" sx={{fontWeight: 500}}> Ticket Details: {selectedTicket.ticket_id} </Typography> <MuiIconButton onClick={handleCloseModal} size="small" sx={{color: darkMode ? 'grey.400': 'text.secondary', '&:hover': {bgcolor: darkMode ? 'grey.600':'grey.200'} }}><CloseIcon /></MuiIconButton> </Box>
                    </DialogTitle>
                    <DialogContent sx={{p: {xs: 2, sm:3}, bgcolor: darkMode? 'grey.800' : 'grey.50', pt: {xs: 3, sm: 3.5} }}>
                        {(() => {
                            const modalStatusStyleInfo = getStatusBasedTailwindColors(selectedTicket.status, darkMode);
                            const modalBadgeBase = "font-raleway px-2.5 py-1 text-xs font-medium rounded-full";
                            return (
                                <>
                                    <TicketDetailRow label="Issue Type" icon={FaInfoCircle} darkMode={darkMode}> <span className={`${modalBadgeBase} ${modalStatusStyleInfo.bg} ${modalStatusStyleInfo.text}`}> {selectedTicket.issue_type || 'N/A'} </span> </TicketDetailRow>
                                    <TicketDetailRow label="Status" icon={FaTasks} darkMode={darkMode}> <span className={`${modalBadgeBase} ${modalStatusStyleInfo.bg} ${modalStatusStyleInfo.text} inline-flex items-center gap-1`}> {selectedTicket.status === 'Open' && <FaEnvelopeOpenText />} {selectedTicket.status === 'In Progress' && <FaCircleNotch className="animate-spin" />} {selectedTicket.status === 'Resolved' && <FaThumbsUp />} <span className="ml-1">{selectedTicket.status || 'N/A'}</span> </span> </TicketDetailRow>
                                </>
                            );
                        })()}
                        <TicketDetailRow label="User ID" value={selectedTicket.user_id} icon={FaUser} darkMode={darkMode} />
                        <TicketDetailRow label="Mobile No" value={selectedTicket.mobile_number} icon={FaMobileAlt} darkMode={darkMode}/>
                        <TicketDetailRow label="Address" value={selectedTicket.location} icon={FaMapMarkerAlt} darkMode={darkMode}/>
                        <Divider sx={{my: 2.5, borderColor: darkMode ? 'grey.700':'grey.300'}}/>
                        <TicketDetailRow label="Comments" icon={FaCommentDots} darkMode={darkMode}><Typography variant="body2" sx={{whiteSpace: 'pre-wrap', color: darkMode? 'grey.200': 'text.secondary', fontStyle: (selectedTicket.comments && selectedTicket.comments.trim() !== '' && selectedTicket.comments.trim() !== 'N/A') ? 'normal' : 'italic', lineHeight: 1.6 }}>{(selectedTicket.comments && selectedTicket.comments.trim() !== '' && selectedTicket.comments.trim() !== 'N/A') ? selectedTicket.comments : 'No comments provided.'}</Typography></TicketDetailRow>
                        <Divider sx={{my: 2.5, borderColor: darkMode ? 'grey.700':'grey.300'}}/>
                        <TicketDetailRow label="Created At" value={formatTimestampLocal(selectedTicket.originalCreatedAt || selectedTicket.created_at)} icon={FaCalendarAlt} darkMode={darkMode}/>
                        {selectedTicket.created_by_auth_id && <TicketDetailRow label="Created By" value={getUserDisplay(selectedTicket.created_by_auth_id)} icon={FaUserEdit} darkMode={darkMode} />}
                        {selectedTicket.originalUpdatedAt && selectedTicket.originalUpdatedAt !== (selectedTicket.originalCreatedAt || selectedTicket.created_at) && selectedTicket.last_edited_by_auth_id && ( <Fragment><TicketDetailRow label="Last Updated" value={formatTimestampLocal(selectedTicket.originalUpdatedAt)} icon={FaCalendarAlt} darkMode={darkMode}/><TicketDetailRow label="Updated By" value={getUserDisplay(selectedTicket.last_edited_by_auth_id)} icon={FaUserEdit} darkMode={darkMode}/></Fragment> )}
                    </DialogContent>
                </Dialog>
            )}
        </Fragment>
    );
};

export default DashboardHomePage;