
// frontend/src/components/TicketList.jsx

import { useEffect, useState, useMemo, Fragment } from 'react';
import axiosInstance from '../api/axiosInstance';
import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';

// --- MUI Imports ---
// Only used for Action Buttons in this version
import {
    IconButton as MuiIconButton, CircularProgress, Box
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
// --- End MUI Imports ---

// --- React Icons Imports ---
// Icons used for Notifications and Status/Spinners in this version
import {
    FaSpinner, FaCheckCircle, FaExclamationCircle, FaEnvelopeOpenText,
    FaCircleNotch, FaThumbsUp,
    FaInfoCircle // Used in notifications
} from "react-icons/fa";

// **** ADD CLIENT-SIDE FORMATTING FUNCTION ****
const formatTimestampLocal = (isoString) => {
    if (!isoString) return 'N/A';
    try {
        // Create a Date object from the ISO string (TIMESTAMPTZ from Supabase)
        const dateObject = new Date(isoString);

        // Check if the date object is valid
        if (isNaN(dateObject.getTime())) {
            console.error("Frontend: Error parsing timestamp into valid Date object:", isoString);
            return 'Invalid Date';
        }

        // Define formatting options
        const options = {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: 'numeric', minute: '2-digit', second: '2-digit',
            hour12: true,
            // No timeZone needed here - Intl defaults to user's local timezone!
        };

        // Format using the user's locale and the specified options.
        return new Intl.DateTimeFormat('en-US', options).format(dateObject);

    } catch (e) {
        console.error("Frontend: Error formatting timestamp:", isoString, e);
        return 'Invalid Date';
    }
};
// **** END CLIENT-SIDE FORMATTING FUNCTION ****

// Accept teamUserMap prop
const TicketList = ({
    onDataChange = () => { },
    darkMode = false,
    searchQuery,
    issueType,
    status,
    setUploadStatus,
    teamUserMap
}) => {
    // --- State ---
    const [tickets, setTickets] = useState([]); // Internal state for fetched tickets
    const [isLoading, setIsLoading] = useState(true); // Manages internal loading state
    const [editingTicket, setEditingTicket] = useState(null);
    const [editedValues, setEditedValues] = useState({});
    const [expandedAddressId, setExpandedAddressId] = useState(null);
    const [editingStatusId, setEditingStatusId] = useState(null);
    const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
    const [ticketToDeleteId, setTicketToDeleteId] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' }); // Uses Tailwind notification
    const [isSaving, setIsSaving] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(null);
    const [isProcessingCard, setIsProcessingCard] = useState(null);

    // --- Constants & Memos ---
    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.05 } } };
    const cardVariants = { hidden: { opacity: 0, y: 20, scale: 0.98 }, visible: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 25 } }, exit: { opacity: 0, scale: 0.9, y: -10, transition: { duration: 0.25 } } };
    const availableIssueTypes = useMemo(() => ["Speed Issue", "Cable Complaint", "Recharge Related", "No Internet", "Others"], []);

    // --- Helper functions for user display ---
    const getUserDisplay = (userId) => {
        if (!userId || !teamUserMap || teamUserMap.size === 0) return 'Unknown';
        const userInfo = teamUserMap.get(userId);
        // console.log(`User Info for ${userId}:`, userInfo); // Check this specific user's data

        return userInfo?.display_name || userInfo?.email || 'Unknown User';
    };
    const getUserEmail = (userId) => {
        if (!userId || !teamUserMap || teamUserMap.size === 0) return 'Unknown Email';
        const userInfo = teamUserMap.get(userId);
        return userInfo?.email || 'Unknown Email';
    };

    // --- Internal Data Fetching ---
    const fetchTickets = async () => {
        setIsLoading(true);
        setNotification({ open: false, message: '', severity: 'info' });
        try {
            const params = new URLSearchParams();
            if (issueType) params.append('issue_type', issueType.toUpperCase());
            if (status) params.append('status', status);
            const queryString = params.toString();
            const url = `/api/admin/tickets${queryString ? `?${queryString}` : ''}`;
            const response = await axiosInstance.get(url);
            setTickets(response.data || []);
        } catch (error) {
            console.error('Error fetching tickets:', error);
            const errorMsg = error.response?.data?.message || 'Failed to fetch tickets.';
            setNotification({ open: true, message: errorMsg, severity: 'error' });
            if (setUploadStatus) setUploadStatus({ message: errorMsg, type: 'error', source: 'ticketListFetch' });
            setTickets([]);
        } finally {
            setIsLoading(false);
        }
    };

    // --- useEffect to Fetch Tickets ---
    useEffect(() => {
        fetchTickets();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [issueType, status]);

    // --- Handlers & Logic ---
    const handleCloseNotification = (event, reason) => { if (reason === 'clickaway') return; setNotification({ ...notification, open: false }); };
    const confirmDelete = (id) => { setTicketToDeleteId(id); setConfirmDeleteDialogOpen(true); };
    const cancelDelete = () => { setConfirmDeleteDialogOpen(false); setTicketToDeleteId(null); setIsDeleting(false); };

    const handleDelete = async () => {
        if (!ticketToDeleteId) return;
        const idToDelete = ticketToDeleteId;
        setIsDeleting(true);
        setConfirmDeleteDialogOpen(false);
        setTicketToDeleteId(null);
        setIsProcessingCard(idToDelete);
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
            setIsDeleting(false);
            setIsProcessingCard(null);
        }
    };

    const handleEdit = (ticket) => {
        setEditingTicket(ticket._id);
        setEditedValues({
            issue_type: ticket.issue_type || '',
            location: ticket.location || '',
            comments: ticket.comments || '',
            mobile_number: ticket.mobile_number || '',
        });
        setEditingStatusId(null);
    };
    const handleCancelEdit = () => { setEditingTicket(null); setEditedValues({}); };
    const handleInputChange = (field, value) => { setEditedValues(prev => ({ ...prev, [field]: value })); };

    const handleSave = async (ticketId) => {
        setNotification({ open: false, message: '', severity: 'info' });
        let updateData = { ...editedValues };
        // Validation
        if (!updateData.issue_type) { const msg = 'Issue Type is required.'; setNotification({ open: true, message: msg, severity: 'warning' }); if (setUploadStatus) setUploadStatus({ message: msg, type: 'warning', source: `ticketSave-${ticketId}` }); return; }
        if (!updateData.location || !updateData.location.trim()) { const msg = 'Address is required.'; setNotification({ open: true, message: msg, severity: 'warning' }); if (setUploadStatus) setUploadStatus({ message: msg, type: 'warning', source: `ticketSave-${ticketId}` }); return; }
        if (updateData.mobile_number) { const cleanedMobile = String(updateData.mobile_number).replace(/\D/g, ''); if (!/^\d{10}$/.test(cleanedMobile)) { const msg = 'Mobile must be 10 digits.'; setNotification({ open: true, message: msg, severity: 'warning' }); if (setUploadStatus) setUploadStatus({ message: msg, type: 'warning', source: `ticketSave-${ticketId}` }); return; } updateData.mobile_number = cleanedMobile; } else { updateData.mobile_number = null; }
        // Prepare final payload
        const finalUpdateData = {
            issue_type: updateData.issue_type,
            location: updateData.location.trim(),
            comments: updateData.comments ? updateData.comments.trim() : '',
            mobile_number: updateData.mobile_number
        };

        setIsSaving(ticketId);
        setIsProcessingCard(ticketId);
        if (setUploadStatus) setUploadStatus({ message: 'Saving changes...', type: 'info', source: `ticketSave-${ticketId}` });
        try {
            const response = await axiosInstance.put(`/api/admin/tickets/${ticketId}`, finalUpdateData);
            if (response.status === 200 && response.data) {
                const updatedTicketFromApi = response.data;
                setTickets(prevTickets => prevTickets.map((ticket) => ticket._id === ticketId ? { ...updatedTicketFromApi } : ticket));
                setEditingTicket(null); setEditedValues({});
                setNotification({ open: true, message: 'Ticket updated!', severity: 'success' });
                if (setUploadStatus) setUploadStatus({ message: 'Ticket updated successfully!', type: 'success', source: `ticketSave-${ticketId}` });
                onDataChange();
            } else { throw new Error('Invalid response from server.'); }
        } catch (error) {
            console.error('Error updating ticket:', error);
            const errorMsg = error.response?.data?.message || 'Failed to update ticket.';
            setNotification({ open: true, message: errorMsg, severity: 'error' });
            if (setUploadStatus) setUploadStatus({ message: errorMsg, type: 'error', source: `ticketSave-${ticketId}` });
        } finally {
            setIsSaving(null);
            setIsProcessingCard(null);
        }
    };

    const handleStatusChange = async (ticketId, newStatus) => {
        const originalTickets = [...tickets];
        setIsUpdatingStatus(ticketId);
        setIsProcessingCard(ticketId);
        setEditingStatusId(null);
        if (setUploadStatus) setUploadStatus({ message: 'Updating status...', type: 'info', source: `ticketStatus-${ticketId}` });
        try {
            const response = await axiosInstance.put(`/api/admin/tickets/${ticketId}/status`, { status: newStatus });
            if (response.status === 200 && response.data) {
                const updatedTicketFromApi = response.data;
                setTickets(prevTickets => prevTickets.map(ticket => ticket._id === ticketId ? { ...updatedTicketFromApi } : ticket));
                setNotification({ open: true, message: `Status changed to ${newStatus}`, severity: 'success' });
                if (setUploadStatus) setUploadStatus({ message: `Status updated to ${newStatus}`, type: 'success', source: `ticketStatus-${ticketId}` });
                onDataChange();
            } else { throw new Error('Invalid response from server during status update.'); }
        } catch (error) {
            console.error('Error updating status:', error);
            const errorMsg = error.response?.data?.message || 'Failed to update status.';
            setNotification({ open: true, message: errorMsg, severity: 'error' });
            if (setUploadStatus) setUploadStatus({ message: errorMsg, type: 'error', source: `ticketStatus-${ticketId}` });
            setTickets(originalTickets);
        } finally {
            setIsUpdatingStatus(null);
            setIsProcessingCard(null);
        }
    };

    const handleViewMoreClick = (ticketId) => { setExpandedAddressId(prevId => (prevId === ticketId ? null : ticketId)); };

    // --- Filter logic ---
    const filteredTickets = useMemo(() => tickets.filter(ticket => {
        if (status && ticket.status !== status) return false;
        if (issueType && ticket.issue_type?.toUpperCase() !== issueType.toUpperCase()) return false;
        if (searchQuery) {
            const searchTerm = searchQuery.toLowerCase();
            return (
                ticket.ticket_id?.toLowerCase().includes(searchTerm) ||
                ticket.issue_type?.toLowerCase().includes(searchTerm) ||
                ticket.user_id?.toLowerCase().includes(searchTerm) ||
                ticket.location?.toLowerCase().includes(searchTerm) ||
                ticket.comments?.toLowerCase().includes(searchTerm) ||
                ticket.mobile_number?.includes(searchTerm)
            );
        }
        return true;
    }), [tickets, status, issueType, searchQuery]);

    // --- Status color helper ---
    const getStatusColor = (status) => {
        switch (status) {
            case 'Open': return `bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200`;
            case 'In Progress': return `bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200`;
            case 'Resolved': return `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200`;
            default: return `bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
        }
    };

    // --- Tailwind classes for reuse ---
    const notificationBaseClasses = "fixed top-5 left-1/2 transform -translate-x-1/2 z-50 p-3 md:p-4 rounded-md shadow-lg text-sm font-medium flex items-center gap-2 max-w-md w-11/12";
    const notificationSeverityClasses = { success: "bg-green-600 text-white", error: "bg-red-600 text-white", warning: "bg-yellow-500 text-black", info: "bg-blue-600 text-white" };
    const dialogOverlayClasses = "fixed inset-0 bg-black bg-opacity-70 z-40 flex items-center justify-center p-4";
    const dialogContentClasses = `relative z-50 p-6 rounded-lg shadow-xl w-full max-w-sm ${darkMode ? 'bg-gray-800 text-gray-100' : 'bg-white text-gray-900'}`;
    const buttonBaseClasses = "px-4 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
    const primaryButtonClasses = `${buttonBaseClasses} ${darkMode ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white' : 'bg-red-500 hover:bg-red-600 focus:ring-red-500 text-white'}`;
    const secondaryButtonClasses = `${buttonBaseClasses} ${darkMode ? 'bg-gray-600 hover:bg-gray-500 focus:ring-gray-400 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 focus:ring-gray-400 text-gray-700'}`;

    // --- JSX ---
    return (
        <Fragment>
            {/* Tailwind Notification */}
            <AnimatePresence>
                {notification.open && (
                    <motion.div
                        key="notification"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                        className={`${notificationBaseClasses} ${notificationSeverityClasses[notification.severity] || notificationSeverityClasses.info}`}
                    >
                        {notification.severity === 'success' && <FaCheckCircle />}
                        {notification.severity === 'error' && <FaExclamationCircle />}
                        {notification.severity === 'warning' && <FaExclamationCircle />}
                        {notification.severity === 'info' && <FaInfoCircle />}
                        <span>{notification.message}</span>
                        <button onClick={handleCloseNotification} className="ml-auto text-current opacity-70 hover:opacity-100 text-lg font-bold">×</button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tailwind Confirmation Dialog */}
            <AnimatePresence>
                {confirmDeleteDialogOpen && (
                    <motion.div
                        key="dialog-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={dialogOverlayClasses}
                        onClick={cancelDelete}
                    >
                        <motion.div
                            key="dialog-content"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
                            className={dialogContentClasses}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-semibold mb-3">Confirm Delete</h3>
                            <p className={`text-sm mb-5 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                Are you sure you want to delete this ticket? This action cannot be undone.
                            </p>
                            <div className="flex justify-end gap-3">
                                <button onClick={cancelDelete} className={secondaryButtonClasses}>
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={isDeleting}
                                    className={`${primaryButtonClasses} w-24 flex justify-center items-center`}
                                >
                                    {isDeleting ? <FaSpinner className="animate-spin" /> : 'Delete'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main Ticket List Area */}
            <div className={`font-raleway ${darkMode ? "text-white" : "text-gray-700"}`}>
                {isLoading ? (
                    <div className="flex justify-center items-center p-10">
                        <FaSpinner className={`animate-spin text-3xl ${darkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                        <span className="ml-3 text-lg">Loading tickets...</span>
                    </div>
                ) : (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence>
                            {filteredTickets.length > 0 ? (
                                filteredTickets.map((ticket) => (
                                    <motion.div
                                        key={ticket._id}
                                        layout
                                        variants={cardVariants}
                                        initial="hidden"
                                        animate="visible"
                                        exit="exit"
                                        className={`rounded-lg shadow-md p-4 flex flex-col justify-between relative border ${editingTicket === ticket._id ? (darkMode ? 'bg-gray-700/80 border-blue-500/50' : 'bg-blue-50/50 border-blue-300/70') : (darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200')} transition-colors duration-300 ease-in-out`}
                                    >
                                        {/* Loading Overlay */}
                                        <AnimatePresence>
                                            {(isProcessingCard === ticket._id) && (
                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                    className="absolute inset-0 bg-black/40 dark:bg-black/60 flex items-center justify-center rounded-lg z-10 backdrop-blur-sm"
                                                >
                                                    <FaSpinner className="animate-spin text-white text-2xl" />
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Ticket Content */}
                                        <Box className={(isProcessingCard === ticket._id) ? 'opacity-50 pointer-events-none' : ''} sx={{ mb: 2 }}>
                                            <h3 className="font-semibold text-lg mb-2 break-words">Ticket ID: {ticket.ticket_id || 'N/A'}</h3>
                                            <div className="mb-2 space-x-2 flex items-center">
                                                <strong className="flex-shrink-0 w-20">Issue Type:</strong>
                                                {editingTicket === ticket._id ? (
                                                    <select
                                                        value={editedValues.issue_type || ''}
                                                        onChange={(e) => handleInputChange('issue_type', e.target.value)}
                                                        className={`flex-grow font-raleway px-2 py-1 border rounded text-sm w-full ${darkMode ? 'text-white bg-gray-700 border-gray-600 focus:ring-blue-500 focus:border-blue-500' : 'text-gray-900 bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                                    >
                                                        {availableIssueTypes.map((type) => (
                                                            <option className="font-raleway" key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={`font-raleway px-2.5 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                                                        {ticket.issue_type || 'N/A'}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mb-2 space-x-2">
                                                <strong className="w-20 inline-block">User ID:</strong>
                                                <span>{ticket.user_id || 'N/A'}</span>
                                            </div>
                                            <div className="mb-2 flex items-center space-x-2">
                                                <strong className="flex-shrink-0 w-20">MobileNo:</strong>
                                                {editingTicket === ticket._id ? (
                                                    <input
                                                        type="tel"
                                                        value={editedValues.mobile_number || ''}
                                                        onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                                                        className={`flex-grow font-raleway px-2 py-1 border rounded text-sm w-full ${darkMode ? 'text-white bg-gray-700 border-gray-600 focus:ring-blue-500 focus:border-blue-500' : 'text-gray-900 bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                                        placeholder="10 digits"
                                                        maxLength={10}
                                                    />
                                                ) : (
                                                    <span>{ticket.mobile_number || 'N/A'}</span>
                                                )}
                                            </div>
                                            <div className="mb-2">
                                                <strong className="block mb-0.5">Address:</strong>
                                                {editingTicket === ticket._id ? (
                                                    <input
                                                        type="text"
                                                        value={editedValues.location || ''}
                                                        onChange={(e) => handleInputChange('location', e.target.value)}
                                                        className={`font-raleway px-2 py-1 border rounded text-sm w-full mt-1 ${darkMode ? 'text-white bg-gray-700 border-gray-600 focus:ring-blue-500 focus:border-blue-500' : 'text-gray-900 bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                                        placeholder="Enter full address"
                                                    />
                                                ) : (
                                                    <div className={`relative text-sm break-words ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                        {(typeof ticket.location === 'string' && ticket.location.trim()) ? (
                                                            <Fragment>
                                                                <span>
                                                                    {expandedAddressId === ticket._id || ticket.location.length <= 100 ? ticket.location : `${ticket.location.substring(0, 100)}...`}
                                                                </span>
                                                                {ticket.location.length > 100 && (
                                                                    <button
                                                                        onClick={() => handleViewMoreClick(ticket._id)}
                                                                        className={`font-raleway text-xs ml-1 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} focus:outline-none`}
                                                                    >
                                                                        {expandedAddressId === ticket._id ? '(Less)' : '(More)'}
                                                                    </button>
                                                                )}
                                                            </Fragment>
                                                        ) : ('N/A')}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="mb-2 space-x-2 flex items-center">
                                                <strong className="flex-shrink-0 w-20">Status:</strong>
                                                {isUpdatingStatus === ticket._id ? (
                                                    <FaSpinner className="animate-spin ml-1 text-sm" />
                                                ) : editingStatusId === ticket._id ? (
                                                    <select
                                                        value={ticket.status}
                                                        onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                                                        onBlur={() => setEditingStatusId(null)}
                                                        autoFocus
                                                        className={`font-raleway px-2 py-1 rounded text-xs font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-gray-200 border-gray-300'}`}
                                                    >
                                                        <option value="Open"> Open</option>
                                                        <option value="In Progress"> In Progress</option>
                                                        <option value="Resolved"> Resolved</option>
                                                    </select>
                                                ) : (
                                                    <span
                                                        className={`font-raleway px-2 py-1 text-xs font-semibold rounded-full inline-flex items-center gap-1 cursor-pointer ${getStatusColor(ticket.status)}`}
                                                        onClick={() => !editingTicket && setEditingStatusId(ticket._id)}
                                                        title={editingTicket ? '' : "Click to change status"}
                                                    >
                                                        {ticket.status === 'Open' && <FaEnvelopeOpenText />}
                                                        {ticket.status === 'In Progress' && <FaCircleNotch className="animate-spin" />}
                                                        {ticket.status === 'Resolved' && <FaThumbsUp />}
                                                        <span className="ml-1">{ticket.status || 'N/A'}</span>
                                                    </span>
                                                )}
                                            </div>

                                            {/* ==== MODIFIED TIMESTAMP DISPLAY ==== */}
                                        {/* Created Timestamp / By */}
                                        <div className="mb-1 text-sm">
                                            <strong>Created:</strong>
                                            {/* Use the new frontend formatter with original timestamp */}
                                            <span>{formatTimestampLocal(ticket.originalCreatedAt)}</span>
                                        </div>
                                        {ticket.created_by_auth_id && (
                                            <div className="mb-1 text-xs text-gray-500 dark:text-gray-400 truncate" title={`Created by: ${getUserEmail(ticket.created_by_auth_id)}`}>
                                                <strong className="mr-1">By:</strong>
                                                <span>{getUserDisplay(ticket.created_by_auth_id)}</span>
                                            </div>
                                        )}

                                        {/* Edited Timestamp / By */}
                                        {/* Only show Edited section if it's different from Created */}
                                        {ticket.originalUpdatedAt && ticket.originalUpdatedAt !== ticket.originalCreatedAt && (
                                            <Fragment>
                                                <div className="mt-2 pt-1 border-t border-dashed border-gray-300 dark:border-gray-600 mb-1 text-sm">
                                                    <strong>Edited:</strong>
                                                     {/* Use the new frontend formatter with original timestamp */}
                                                    <span>{formatTimestampLocal(ticket.originalUpdatedAt)}</span>
                                                </div>
                                                {ticket.last_edited_by_auth_id && (
                                                    <div className="mb-2 text-xs text-gray-500 dark:text-gray-400 truncate" title={`Edited by: ${getUserEmail(ticket.last_edited_by_auth_id)}`}>
                                                        <strong className="mr-1">By:</strong>
                                                        <span>{getUserDisplay(ticket.last_edited_by_auth_id)}</span>
                                                    </div>
                                                )}
                                            </Fragment>
                                        )}
                                        {/* ==== END MODIFIED TIMESTAMP DISPLAY ==== */}

                                            {/* Comments */}
                                            <div className="mt-2 mb-4">
                                                <strong className="block mb-0.5">Comments:</strong>
                                                {editingTicket === ticket._id ? (
                                                    <textarea
                                                        value={editedValues.comments || ''}
                                                        onChange={(e) => handleInputChange('comments', e.target.value)}
                                                        className={`font-raleway px-2 py-1 border rounded text-sm w-full mt-1 ${darkMode ? 'text-white bg-gray-700 border-gray-600 focus:ring-blue-500 focus:border-blue-500' : 'text-gray-900 bg-white border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'}`}
                                                        rows="3"
                                                        placeholder="Enter comments..."
                                                    />
                                                ) : (
                                                    <p className={`text-sm break-words ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{ticket.comments || 'N/A'}</p>
                                                )}
                                            </div>
                                        </Box>

                                        {/* Action Buttons Area (Using MUI Icons) */}
                                        <div className={`flex items-center space-x-1 mt-auto pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                            {editingTicket === ticket._id ? (
                                                <Fragment> {/* Save/Cancel Buttons */}
                                                    <MuiIconButton onClick={() => handleSave(ticket._id)} size="small" sx={{ color: darkMode ? 'success.light' : 'success.main', '&:hover': { bgcolor: darkMode ? 'rgba(102, 187, 106, 0.1)' : 'rgba(46, 125, 50, 0.08)' } }} title="Save" aria-label="save" disabled={isSaving === ticket._id}>
                                                        {isSaving === ticket._id ? <CircularProgress size={20} color="inherit" /> : <SaveIcon fontSize="small" />}
                                                    </MuiIconButton>
                                                    <MuiIconButton onClick={handleCancelEdit} size="small" sx={{ color: 'text.secondary', '&:hover': { bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)' } }} title="Cancel" aria-label="cancel" disabled={isSaving === ticket._id}>
                                                        <CancelIcon fontSize="small" />
                                                    </MuiIconButton>
                                                </Fragment>
                                            ) : (
                                                <Fragment> {/* Edit/Delete Buttons */}
                                                    <MuiIconButton onClick={() => handleEdit(ticket)} size="small" sx={{ color: darkMode ? 'primary.light' : 'primary.main', '&:hover': { bgcolor: darkMode ? 'rgba(144, 202, 249, 0.1)' : 'rgba(25, 118, 210, 0.08)' } }} title="Edit" aria-label="edit" disabled={!!isProcessingCard || !!editingTicket}>
                                                        <EditIcon fontSize="small" />
                                                    </MuiIconButton>
                                                    <MuiIconButton onClick={() => confirmDelete(ticket._id)} size="small" sx={{ ml: 'auto', color: darkMode ? 'error.light' : 'error.main', '&:hover': { bgcolor: darkMode ? 'rgba(244, 67, 54, 0.1)' : 'rgba(211, 47, 47, 0.08)' } }} title="Delete" aria-label="delete" disabled={!!isProcessingCard || !!editingTicket}>
                                                        <DeleteIcon fontSize="small" />
                                                    </MuiIconButton>
                                                </Fragment>
                                            )}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <div className="col-span-full text-center py-10 text-gray-500 dark:text-gray-400">
                                    No tickets found matching your criteria.
                                </div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </div>
        </Fragment>
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
    teamUserMap: PropTypes.instanceOf(Map).isRequired,
};

export default TicketList;