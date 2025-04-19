// frontend/src/components/TicketList.jsx
import { useEffect, useState, useMemo } from 'react';
import axiosInstance from '../api/axiosInstance';
import PropTypes from 'prop-types';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle,
    Button, Snackbar, Alert as MuiAlert,
    IconButton as MuiIconButton, CircularProgress, Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import {
    FaSpinner, FaCheckCircle, FaExclamationCircle, FaEnvelopeOpenText,
    FaCircleNotch, FaThumbsUp
} from "react-icons/fa";

const TicketList = ({ onDataChange = () => { }, darkMode = false, searchQuery, issueType, status, setUploadStatus }) => {
    // --- State ---
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTicket, setEditingTicket] = useState(null);
    const [editedValues, setEditedValues] = useState({});
    const [expandedAddressId, setExpandedAddressId] = useState(null);
    const [editingStatusId, setEditingStatusId] = useState(null);
    const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
    const [ticketToDeleteId, setTicketToDeleteId] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });
    const [isSaving, setIsSaving] = useState(null); // Keep as ID for card-specific indicator
    // --- Change isDeleting to boolean ---
    const [isDeleting, setIsDeleting] = useState(false); // Initialize to false
    // --- Keep isUpdatingStatus as ID for card-specific indicator ---
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(null);

    // --- Constants & Memos ---
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const cardVariants = { hidden: { opacity: 0, y: 20, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } }, exit: { opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.25 } } };
    const availableIssueTypes = useMemo(() => ["Speed Issue", "Cable Complaint", "Recharge Related", "No Internet", "Others"], []);

    // --- Handlers & Logic ---
    const fetchTickets = async () => { setIsLoading(true); try { const params = new URLSearchParams(); if (issueType) params.append('issue_type', issueType.toUpperCase()); if (status) params.append('status', status); const queryString = params.toString(); const url = `/api/admin/tickets${queryString ? `?${queryString}` : ''}`; const response = await axiosInstance.get(url); const ticketsWithTimestamps = response.data.map((ticket) => ({ ...ticket, _id: ticket._id, formattedTimestamp: moment(ticket.updatedAt || ticket.createdAt || new Date()).format('DD-MM-YYYY hh:mm:ss A'), })); setTickets(ticketsWithTimestamps); } catch (error) { console.error('Error fetching tickets:', error); const errorMsg = error.response?.data?.message || 'Failed to fetch tickets.'; setNotification({ open: true, message: errorMsg, severity: 'error' }); if (setUploadStatus) setUploadStatus({ message: errorMsg, type: 'error', source: 'ticketListFetch' }); setTickets([]); } finally { setIsLoading(false); } };
    useEffect(() => { fetchTickets(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [issueType, status]);
    const handleCloseNotification = (event, reason) => { if (reason === 'clickaway') return; setNotification({ ...notification, open: false }); };
    const confirmDelete = (id) => { setTicketToDeleteId(id); setConfirmDeleteDialogOpen(true); };
    const cancelDelete = () => { setConfirmDeleteDialogOpen(false); setTicketToDeleteId(null); setIsDeleting(false); }; // Also reset boolean

    const handleDelete = async () => {
        if (!ticketToDeleteId) return;
        const idToDelete = ticketToDeleteId;
        setConfirmDeleteDialogOpen(false);
        // --- Set boolean deleting state ---
        setIsDeleting(true); // Set to true when starting delete
        // ---
        setTicketToDeleteId(null); // Clear the ID state
        setNotification({ open: false, message: '', severity: 'info' });
        if (setUploadStatus) setUploadStatus({ message: 'Deleting ticket...', type: 'info', source: `ticketDelete-${idToDelete}` });

        try {
            await axiosInstance.delete(`/api/admin/tickets/${idToDelete}`);
            setTickets(prevTickets => prevTickets.filter(ticket => ticket._id !== idToDelete));
            setNotification({ open: true, message: 'Ticket deleted!', severity: 'success' });
            if (setUploadStatus) setUploadStatus({ message: 'Ticket deleted successfully!', type: 'success', source: `ticketDelete-${idToDelete}` });
            onDataChange();
        } catch (error) {
            console.error('Error deleting ticket:', error);
            const errorMsg = error.response?.data?.message || 'Failed to delete ticket.';
            setNotification({ open: true, message: errorMsg, severity: 'error' });
            if (setUploadStatus) setUploadStatus({ message: errorMsg, type: 'error', source: `ticketDelete-${idToDelete}` });
        } finally {
            // --- Reset boolean deleting state ---
            setIsDeleting(false); // Set back to false when done
            // ---
        }
    };
    const handleEdit = (ticket) => { setEditingTicket(ticket._id); setEditedValues({ issue_type: ticket.issue_type || '', location: ticket.location || '', comments: ticket.comments || '', mobile_number: ticket.mobile_number || '', }); setEditingStatusId(null); };
    const handleCancelEdit = () => { setEditingTicket(null); setEditedValues({}); };
    const handleInputChange = (field, value) => { setEditedValues(prev => ({ ...prev, [field]: value })); };
    const handleSave = async (ticketId) => { setNotification({ open: false, message: '', severity: 'info' }); let updateData = { ...editedValues }; if (!updateData.issue_type) { const msg = 'Issue Type is required.'; setNotification({ open: true, message: msg, severity: 'warning' }); if (setUploadStatus) setUploadStatus({ message: msg, type: 'warning', source: `ticketSave-${ticketId}` }); return; } if (!updateData.location || !updateData.location.trim()) { const msg = 'Address is required.'; setNotification({ open: true, message: msg, severity: 'warning' }); if (setUploadStatus) setUploadStatus({ message: msg, type: 'warning', source: `ticketSave-${ticketId}` }); return; } if (updateData.mobile_number) { const cleanedMobile = String(updateData.mobile_number).replace(/\D/g, ''); if (!/^\d{10}$/.test(cleanedMobile)) { const msg = 'Mobile must be 10 digits.'; setNotification({ open: true, message: msg, severity: 'warning' }); if (setUploadStatus) setUploadStatus({ message: msg, type: 'warning', source: `ticketSave-${ticketId}` }); return; } updateData.mobile_number = cleanedMobile; } else { updateData.mobile_number = null; } setIsSaving(ticketId); if (setUploadStatus) setUploadStatus({ message: 'Saving changes...', type: 'info', source: `ticketSave-${ticketId}` }); try { const response = await axiosInstance.put(`/api/admin/tickets/${ticketId}`, updateData); if (response.status === 200 && response.data) { const updatedTicketFromApi = response.data; setTickets(prevTickets => prevTickets.map((ticket) => ticket._id === ticketId ? { ...updatedTicketFromApi, formattedTimestamp: moment(updatedTicketFromApi.updatedAt || new Date()).format('DD-MM-YYYY hh:mm:ss A') } : ticket)); setEditingTicket(null); setEditedValues({}); setNotification({ open: true, message: 'Ticket updated!', severity: 'success' }); if (setUploadStatus) setUploadStatus({ message: 'Ticket updated successfully!', type: 'success', source: `ticketSave-${ticketId}` }); onDataChange(); } else { throw new Error('Invalid response from server.'); } } catch (error) { console.error('Error updating ticket:', error); const errorMsg = error.response?.data?.message || 'Failed to update ticket.'; setNotification({ open: true, message: errorMsg, severity: 'error' }); if (setUploadStatus) setUploadStatus({ message: errorMsg, type: 'error', source: `ticketSave-${ticketId}` }); } finally { setIsSaving(null); } };
    const handleStatusChange = async (ticketId, newStatus) => { const originalTickets = [...tickets]; setIsUpdatingStatus(ticketId); setEditingStatusId(null); if (setUploadStatus) setUploadStatus({ message: 'Updating status...', type: 'info', source: `ticketStatus-${ticketId}` }); try { await axiosInstance.put(`/api/admin/tickets/${ticketId}/status`, { status: newStatus }); setTickets(prevTickets => prevTickets.map(ticket => ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket)); setNotification({ open: true, message: `Status changed to ${newStatus}`, severity: 'success' }); if (setUploadStatus) setUploadStatus({ message: `Status updated to ${newStatus}`, type: 'success', source: `ticketStatus-${ticketId}` }); onDataChange(); } catch (error) { console.error('Error updating status:', error); const errorMsg = error.response?.data?.message || 'Failed to update status.'; setNotification({ open: true, message: errorMsg, severity: 'error' }); if (setUploadStatus) setUploadStatus({ message: errorMsg, type: 'error', source: `ticketStatus-${ticketId}` }); setTickets(originalTickets); } finally { setIsUpdatingStatus(null); } };{ /* ... (status change logic uses isUpdatingStatus state with ID) ... */ }
    const handleViewMoreClick = (ticketId) => { setExpandedAddressId(prevId => (prevId === ticketId ? null : ticketId)); };
    const filteredTickets = useMemo(() => tickets.filter(ticket => { if (status && ticket.status !== status) return false; if (issueType && ticket.issue_type?.toUpperCase() !== issueType.toUpperCase()) return false; if (searchQuery) { const searchTerm = searchQuery.toLowerCase(); return (ticket.ticket_id?.toLowerCase().includes(searchTerm) || ticket.issue_type?.toLowerCase().includes(searchTerm) || ticket.user_id?.toLowerCase().includes(searchTerm) || ticket.location?.toLowerCase().includes(searchTerm) || ticket.comments?.toLowerCase().includes(searchTerm) || ticket.mobile_number?.includes(searchTerm)); } return true; }), [tickets, status, issueType, searchQuery]);
    const getStatusColor = (status) => { switch (status) { case 'Open': return `bg-blue-100 text-blue-800 ${darkMode ? 'dark:bg-blue-900 dark:text-blue-100' : ''}`; case 'In Progress': return `bg-orange-100 text-orange-800 ${darkMode ? 'dark:bg-orange-900 dark:text-orange-100' : ''}`; case 'Resolved': return `bg-green-100 text-green-800 ${darkMode ? 'dark:bg-green-900 dark:text-green-100' : ''}`; default: return `bg-gray-100 text-gray-800 ${darkMode ? "dark:bg-gray-700 dark:text-gray-100" : ""}`; } };

    // --- JSX ---
    return (
        <div className={`font-raleway space-y-6 ${darkMode ? "text-white" : "text-gray-700"}`}>
            {/* Snackbar & Dialogs */}
            <Snackbar open={notification.open} autoHideDuration={4000} onClose={handleCloseNotification} anchorOrigin={{ vertical: 'top', horizontal: 'center' }} >
                <MuiAlert onClose={handleCloseNotification} severity={notification.severity} variant="filled" sx={{ width: '100%', display: 'flex', alignItems: 'center' }} icon={notification.severity === 'success' ? <FaCheckCircle fontSize="inherit" /> : notification.severity === 'error' ? <FaExclamationCircle fontSize="inherit" /> : notification.severity === 'warning' ? <FaExclamationCircle fontSize="inherit" /> : <FaCircleNotch fontSize="inherit" className="animate-spin" />} > {notification.message} </MuiAlert>
            </Snackbar>
            <Dialog open={confirmDeleteDialogOpen} onClose={cancelDelete} PaperProps={{ style: { backgroundColor: darkMode ? '#1f2937' : '#ffffff', color: darkMode ? '#ffffff' : '#000000' } }} >
                <DialogTitle>{"Confirm Delete"}</DialogTitle>
                <DialogContent><DialogContentText sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}> Are you sure you want to delete this ticket? This action cannot be undone. </DialogContentText></DialogContent>
                <DialogActions><Button onClick={cancelDelete} sx={{ color: darkMode ? '#9ca3af' : '#1976d2' }}>Cancel</Button><Button onClick={handleDelete} sx={{ color: darkMode ? '#f87171' : '#d32f2f' }} autoFocus disabled={isDeleting}> {isDeleting ? 'Deleting...' : 'Delete'} </Button></DialogActions>
            </Dialog>

            {/* Loading Indicator */}
            {isLoading ? (<div className="flex justify-center items-center p-10"><FaSpinner className={`animate-spin text-3xl ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} /><span className="ml-3 text-lg">Loading tickets...</span></div>)
                : (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" >
                        <AnimatePresence>
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map((ticket) => (
                                    <motion.div key={ticket._id} layout variants={cardVariants} initial="hidden" animate="visible" exit="exit" className={`font-raleway rounded-lg shadow-md p-4 flex flex-col justify-between relative border ${editingTicket === ticket._id ? (darkMode ? 'bg-gray-700/80 border-blue-500/50' : 'bg-blue-50/50 border-blue-300/70') : (darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')} transition-colors duration-300 ease-in-out`} >
                                        {/* Loading Overlay */}
                                        <AnimatePresence> {(isSaving === ticket._id || isDeleting === ticket._id || isUpdatingStatus === ticket._id) && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute inset-0 bg-black/40 dark:bg-black/60 flex flex-col items-center justify-center rounded-lg z-10 backdrop-blur-sm" > <CircularProgress size={30} color="inherit" sx={{ color: 'white' }} /> <span className="text-white text-xs mt-2"> {isSaving === ticket._id ? 'Saving...' : isDeleting === ticket._id ? 'Deleting...' : 'Updating...'} </span> </motion.div>)} </AnimatePresence>

                                        {/* Ticket Content - Use Box as the main content wrapper */}
                                        <Box className={(isSaving === ticket._id || isDeleting === ticket._id || isUpdatingStatus === ticket._id) ? 'opacity-60' : ''}>
                                            <h3 className="font-semibold text-lg mb-2 break-words">Ticket ID: {ticket.ticket_id || 'N/A'}</h3>
                                            {/* Issue Type */}
                                            <div className="mb-2 space-x-2 flex items-center"> <strong className="flex-shrink-0">Issue Type:</strong> {editingTicket === ticket._id ? (<select value={editedValues.issue_type} onChange={(e) => handleInputChange('issue_type', e.target.value)} className={`flex-grow font-raleway px-2 py-1 border rounded text-sm w-full ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'}`} > {availableIssueTypes.map((type) => (<option className="font-raleway" key={type} value={type}>{type}</option>))} </select>) : (<span className={`font-raleway px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}> {ticket.issue_type || 'N/A'} </span>)} </div>
                                            {/* User ID */}
                                            <div className="mb-2 space-x-2"> <strong>User ID:</strong> <span>{ticket.user_id || 'N/A'}</span> </div>
                                            {/* Mobile Number */}
                                            <div className="mb-2 flex items-center space-x-2"> <strong className="flex-shrink-0">Mobile No:</strong> {editingTicket === ticket._id ? (<input type="tel" value={editedValues.mobile_number} onChange={(e) => handleInputChange('mobile_number', e.target.value)} className={`flex-grow font-raleway px-2 py-1 border rounded text-sm w-full ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'}`} placeholder="10 digits" maxLength={10} />) : (<span>{ticket.mobile_number || 'N/A'}</span>)} </div>
                                            {/* Address */}
                                            <div className="mb-2">
                                                <strong>Address:</strong>
                                                {editingTicket === ticket._id ? (
                                                    <input type="text" value={editedValues.location} onChange={(e) => handleInputChange('location', e.target.value)} className={`font-raleway px-2 py-1 border rounded text-sm w-full mt-1 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'}`} placeholder="Enter full address" />
                                                ) : (
                                                    <div className={`relative text-sm break-words ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        {/* --- FIX: Use robust check before accessing length --- */}
                                                        {(typeof ticket.location === 'string' && ticket.location.trim()) ? (
                                                            <>
                                                                <span>
                                                                    {expandedAddressId === ticket._id || ticket.location.length <= 100
                                                                        ? ticket.location
                                                                        : `${ticket.location.substring(0, 100)}...`}
                                                                </span>
                                                                {/* Show button only if it's a string AND longer than 100 */}
                                                                {ticket.location.length > 100 && (
                                                                    <button onClick={() => handleViewMoreClick(ticket._id)} className={`font-raleway text-xs ml-1 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} focus:outline-none`}>
                                                                        {expandedAddressId === ticket._id ? '(Less)' : '(More)'}
                                                                    </button>
                                                                )}
                                                            </>
                                                        ) : (
                                                            // Display N/A if location is null, undefined, empty string, or not a string
                                                            'N/A'
                                                        )}
                                                        {/* --- END FIX --- */}
                                                    </div>
                                                )}
                                            </div>
                                            {/* Status */}
                                            <div className="mb-2 space-x-2 flex items-center"> <strong className="flex-shrink-0">Status:</strong> {isUpdatingStatus === ticket._id ? <CircularProgress size={16} sx={{ ml: 1 }} /> : editingStatusId === ticket._id ? (<select value={ticket.status} onChange={(e) => handleStatusChange(ticket._id, e.target.value)} onBlur={() => setEditingStatusId(null)} autoFocus className={`font-raleway px-2 py-1 rounded text-xs font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-gray-200 border-gray-300'}`} > <option value="Open"> Open</option> <option value="In Progress"> In Progress</option> <option value="Resolved"> Resolved</option> </select>) : (<span className={`font-raleway px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 ${getStatusColor(ticket.status)}`} onClick={() => !editingTicket && setEditingStatusId(ticket._id)} style={{ cursor: editingTicket ? 'default' : 'pointer' }} title={editingTicket ? '' : "Click to change status"}> {ticket.status === 'Open' && <FaEnvelopeOpenText className="inline" />} {ticket.status === 'In Progress' && <FaCircleNotch className="inline animate-spin" />} {ticket.status === 'Resolved' && <FaThumbsUp className="inline" />} <span className="ml-1">{ticket.status || 'N/A'}</span> </span>)} </div>
                                            {/* Submitted Timestamp */}
                                            <div className="mb-2 text-sm"> <strong>Submitted:</strong> <span>{ticket.formattedTimestamp || 'N/A'}</span> </div>
                                            {/* Comments */}
                                            <div className="mb-4"> <strong>Comments:</strong> {editingTicket === ticket._id ? (<textarea value={editedValues.comments} onChange={(e) => handleInputChange('comments', e.target.value)} className={`font-raleway px-2 py-1 border rounded text-sm w-full mt-1 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'}`} rows="3" placeholder="Enter comments..." />) : (<p className={`text-sm break-words ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{ticket.comments || 'N/A'}</p>)} </div>
                                        </Box> {/* End of Box wrapper */}

                                        {/* Action Buttons Area */}
                                        <div className={`flex space-x-2 mt-auto pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            {editingTicket === ticket._id ? (
                                                <> {/* Save/Cancel Buttons */}
                                                    <MuiIconButton onClick={() => handleSave(ticket._id)} size="small" className={`p-1 ${darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-800'}`} title="Save" aria-label="save" disabled={isSaving === ticket._id}> {isSaving === ticket._id ? <CircularProgress size={18} color="inherit" /> : <SaveIcon fontSize="small" />} </MuiIconButton>
                                                    <MuiIconButton onClick={handleCancelEdit} size="small" className={`p-1 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`} title="Cancel" aria-label="cancel" disabled={isSaving === ticket._id}> <CancelIcon fontSize="small" /> </MuiIconButton>
                                                </>
                                            ) : (
                                                <> {/* Edit/Delete Buttons */}
                                                    <MuiIconButton onClick={() => handleEdit(ticket)} size="small" className={`p-1 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`} title="Edit" aria-label="edit" disabled={isDeleting === ticket._id || isUpdatingStatus === ticket._id}> <EditIcon fontSize="small" /> </MuiIconButton>
                                                    <MuiIconButton onClick={() => confirmDelete(ticket._id)} size="small" className={`p-1 ml-auto ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`} title="Delete" aria-label="delete" disabled={isDeleting === ticket._id || isUpdatingStatus === ticket._id}> {isDeleting === ticket._id ? <CircularProgress size={18} color="inherit" /> : <DeleteIcon fontSize="small" />} </MuiIconButton>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (<div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400"> No tickets found matching your criteria. </div>)}
                        </AnimatePresence>
                    </motion.div>
                )}
        </div>
    );
};

// Prop Types
TicketList.propTypes = {
    onDataChange: PropTypes.func,
    darkMode: PropTypes.bool,
    searchQuery: PropTypes.string,
    issueType: PropTypes.string,
    status: PropTypes.string,
    setUploadStatus: PropTypes.func,
};

export default TicketList;