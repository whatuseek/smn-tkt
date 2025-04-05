/* eslint-disable no-unused-vars */
import { useEffect, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import moment from 'moment';
import { motion, AnimatePresence } from 'framer-motion';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar'; // <-- Import Snackbar
import Alert from '@mui/material/Alert';     // <-- Import Alert
import '../../src/App.css';
import '../../src/index.css';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { IconButton } from '@mui/material';
import { FaSpinner, FaCheckCircle, FaExclamationCircle, FaBars, FaHome, FaTicketAlt, FaCog, FaSignOutAlt, FaEnvelopeOpenText, FaCircleNotch, FaThumbsUp, FaListAlt, FaUserPlus, FaPowerOff } from "react-icons/fa";

const TicketList = ({ onDataChange = () => { }, darkMode = false, searchQuery, issueType, status }) => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTicket, setEditingTicket] = useState(null);
    const [editedValues, setEditedValues] = useState({});
    const [expandedAddressId, setExpandedAddressId] = useState(null);
    const [editingStatusId, setEditingStatusId] = useState(null);
    const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
    const [ticketToDeleteId, setTicketToDeleteId] = useState(null);
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' }); // State for notification

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    const validateTicketData = (data) => {
        const errors = [];
        if (!data.issue_type) errors.push('Issue type is required');
        // Consider re-adding mobile number validation if needed
        // if (!data.mobile_number || !/^\d{10}$/.test(data.mobile_number)) errors.push('Mobile number must be 10 digits');
         return errors;
    };

    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            let url = `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets`;
            const params = new URLSearchParams();

            if (issueType) {
                params.append('issue_type', issueType);
            }
            if (status) {
                params.append('status', status);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await axios.get(url);

            const ticketsWithTimestamps = response.data.map((ticket) => ({
                ...ticket,
                formattedTimestamp: moment(ticket.updatedAt || ticket.createdAt || new Date()).format('DD-MM-YYYY hh:mm:ss A'),
            }));

            setTickets(ticketsWithTimestamps);
            if (onDataChange) {
                onDataChange();
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
            setNotification({ open: true, message: 'Failed to fetch tickets.', severity: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [issueType, status]); // Dependencies for refetching when filters change

    // Removed the redundant fetch on mount

    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setNotification({ ...notification, open: false });
    };

    const confirmDelete = (id) => {
        setTicketToDeleteId(id);
        setConfirmDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        setConfirmDeleteDialogOpen(false);
        const originalTickets = tickets; // Store original state
        try {
            // Optimistic update
            setTickets(prevTickets => prevTickets.filter(ticket => ticket._id !== ticketToDeleteId));
            setNotification({ open: true, message: 'Deleting ticket...', severity: 'info' }); // Inform user

            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/${ticketToDeleteId}`);
            setNotification({ open: true, message: 'Ticket deleted successfully!', severity: 'success' });
        } catch (error) {
            console.error('Error deleting ticket:', error);
            setNotification({ open: true, message: 'Failed to delete ticket.', severity: 'error' });
            setTickets(originalTickets); // Rollback on error
            // Consider refetching only if rollback fails or to ensure absolute sync
            // fetchTickets();
        } finally {
            setTicketToDeleteId(null);
        }
    };

    const cancelDelete = () => {
        setConfirmDeleteDialogOpen(false);
        setTicketToDeleteId(null);
    };

    const handleEdit = (ticket) => {
        setEditingTicket(ticket._id);
        setEditedValues({
            issue_type: ticket.issue_type || '',
            location: ticket.location || '',
            comments: ticket.comments || '',
            mobile_number: ticket.mobile_number || '',
        });
    };

    const handleSave = async (ticketId) => {
        try {
            const validationErrors = validateTicketData(editedValues);
            if (validationErrors.length > 0) {
                setNotification({ open: true, message: validationErrors.join(', '), severity: 'warning' });
                return;
            }

            const updateData = { ...editedValues };

            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/${ticketId}`,
                updateData,
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.status === 200 && response.data) {
                const updatedTicketFromApi = response.data;
                setTickets(prevTickets => prevTickets.map((ticket) => {
                    if (ticket._id === ticketId) {
                        return {
                            ...updatedTicketFromApi,
                            formattedTimestamp: moment(updatedTicketFromApi.updatedAt || new Date()).format('DD-MM-YYYY hh:mm:ss A')
                        };
                    }
                    return ticket;
                }));
                setEditingTicket(null);
                setEditedValues({});
                setNotification({ open: true, message: 'Ticket updated successfully!', severity: 'success' });
            } else {
                console.error('Error updating ticket - Invalid response:', response.status, response.data);
                setNotification({ open: true, message: 'Error: Could not update ticket.', severity: 'error' });
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            const errorMsg = error.response?.data?.message || 'Failed to update ticket. Please try again.';
            setNotification({ open: true, message: errorMsg, severity: 'error' });
        }
    };

    const handleCancelEdit = () => {
        setEditingTicket(null);
        setEditedValues({});
    };

    const handleInputChange = (field, value) => {
        setEditedValues(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleStatusChange = async (ticketId, newStatus) => {
        let originalTickets = tickets;
        try {
            setTickets(prevTickets => prevTickets.map(ticket =>
                ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
            ));
            setEditingStatusId(null);

            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/${ticketId}/status`, {
                status: newStatus,
            });

            setNotification({ open: true, message: `Ticket status changed to ${newStatus}`, severity: 'success' });

            if (onDataChange) {
                onDataChange();
            }
        } catch (error) {
            console.error('Error updating status:', error);
            setNotification({ open: true, message: 'Failed to update status.', severity: 'error' });
            setTickets(originalTickets);
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        if (status && ticket.status !== status) return false;
        if (issueType && ticket.issue_type !== issueType) return false;
        if (searchQuery) {
            const searchTerm = searchQuery.toLowerCase();
            const matchesSearch =
                ticket.ticket_id?.toLowerCase().includes(searchTerm) ||
                ticket.issue_type?.toLowerCase().includes(searchTerm) ||
                ticket.user_id?.toLowerCase().includes(searchTerm) ||
                ticket.location?.toLowerCase().includes(searchTerm) ||
                ticket.comments?.toLowerCase().includes(searchTerm);
            if (!matchesSearch) return false;
        }
        return true;
    });

    const issueTypeColors = { /* ... your colors ... */ };

    const getStatusColor = (status, issueType) => {
        if (issueType && issueTypeColors[issueType]) return issueTypeColors[issueType];
        switch (status) {
            case 'Open': return `bg-blue-100 text-blue-800 ${darkMode ? 'dark:bg-blue-900 dark:text-blue-100' : ''}`;
            case 'In Progress': return `bg-orange-100 text-orange-800 ${darkMode ? 'dark:bg-orange-900 dark:text-orange-100' : ''}`;
            case 'Resolved': return `bg-green-100 text-green-800 ${darkMode ? 'dark:bg-green-900 dark:text-green-100' : ''}`;
            default: return `bg-gray-100 text-gray-800 ${darkMode ? "dark:bg-gray-700 dark:text-gray-100" : ""}`;
        }
    };

    const handleViewMoreClick = (ticketId) => {
        setExpandedAddressId(prevId => (prevId === ticketId ? null : ticketId));
    };

    return (
        <div className={`font-raleway space-y-6 ${darkMode ? "text-white" : "text-gray-700"}`}>
            {/* Snackbar for Notifications */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000} // Auto hide after 4 seconds
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>

            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDeleteDialogOpen}
                onClose={cancelDelete}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
                PaperProps={{ style: { backgroundColor: darkMode ? '#1f2937' : '#ffffff', color: darkMode ? '#ffffff' : '#000000' } }}
            >
                <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description" sx={{ color: darkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)' }}>
                        Are you sure you want to delete this ticket? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete} sx={{ color: darkMode ? '#9ca3af' : '#1976d2' }}>Cancel</Button>
                    <Button onClick={handleDelete} sx={{ color: darkMode ? '#f87171' : '#d32f2f' }} autoFocus>Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Loading Indicator */}
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
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`font-raleway rounded-lg shadow-md p-4 flex flex-col justify-between ${darkMode ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 border border-gray-200'}`}
                            >
                                {/* Ticket Content */}
                                <div>
                                    <h3 className="font-semibold text-lg mb-2 break-words">Ticket ID: {ticket.ticket_id || 'N/A'}</h3>
                                     {/* Issue Type */}
                                     <div className="mb-2 space-x-2 flex items-center">
                                        <strong className="flex-shrink-0">Issue Type:</strong>
                                        {editingTicket === ticket._id ? (
                                            <select
                                                value={editedValues.issue_type}
                                                onChange={(e) => handleInputChange('issue_type', e.target.value)}
                                                className={`flex-grow font-raleway px-2 py-1 border rounded text-sm w-full ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'}`}
                                            >
                                                 {[ "Speed Issue", "Cable Complaint", "Recharge Related", "No Internet", "Others" ].map((type) => (
                                                    <option className="font-raleway" key={type} value={type.toUpperCase()}>{type}</option> // Ensure value is uppercase if needed by backend
                                                ))}
                                            </select>
                                        ) : (
                                            <span className={`font-raleway px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status, ticket.issue_type)}`}>
                                                {ticket.issue_type || 'N/A'}
                                            </span>
                                        )}
                                    </div>
                                     {/* User ID */}
                                     <div className="mb-2 space-x-2">
                                        <strong>User ID:</strong> <span>{ticket.user_id || 'N/A'}</span>
                                    </div>
                                     {/* Mobile Number */}
                                     <div className="mb-2 flex items-center space-x-2">
                                        <strong className="flex-shrink-0">Mobile No:</strong>
                                        {editingTicket === ticket._id ? (
                                            <input
                                                type="tel"
                                                value={editedValues.mobile_number}
                                                onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                                                className={`flex-grow font-raleway px-2 py-1 border rounded text-sm w-full ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'}`}
                                                placeholder="10 digits"
                                                maxLength={10} // Enforce 10 digits visually
                                            />
                                        ) : (
                                            <span>{ticket.mobile_number || 'N/A'}</span>
                                        )}
                                    </div>
                                     {/* Address */}
                                    <div className="mb-2">
                                        <strong>Address:</strong>
                                        {editingTicket === ticket._id ? (
                                            <input
                                                type="text"
                                                value={editedValues.location}
                                                onChange={(e) => handleInputChange('location', e.target.value)}
                                                className={`font-raleway px-2 py-1 border rounded text-sm w-full mt-1 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'}`}
                                                placeholder="Enter full address"
                                            />
                                        ) : (
                                            <div className={`relative text-sm break-words ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {ticket.location ? (
                                                    <>
                                                        <span>{expandedAddressId === ticket._id || ticket.location.length <= 100 ? ticket.location : `${ticket.location.substring(0, 100)}...`}</span>
                                                        {ticket.location.length > 100 && ( <button onClick={() => handleViewMoreClick(ticket._id)} className={`font-raleway text-xs ml-1 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'} focus:outline-none`}>{expandedAddressId === ticket._id ? '(Less)' : '(More)'}</button> )}
                                                    </>
                                                ) : 'N/A'}
                                            </div>
                                        )}
                                    </div>
                                     {/* Status */}
                                     <div className="mb-2 space-x-2 flex items-center">
                                        <strong className="flex-shrink-0">Status:</strong>
                                        {editingStatusId === ticket._id ? (
                                            <select
                                                value={ticket.status}
                                                onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                                                onBlur={() => setEditingStatusId(null)} // Exit edit on blur
                                                autoFocus
                                                className={`font-raleway px-2 py-1 rounded text-xs font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-gray-200 border-gray-300'}`}
                                            >
                                                <option value="Open"> Open</option>
                                                <option value="In Progress"> In Progress</option>
                                                <option value="Resolved"> Resolved</option>
                                            </select>
                                        ) : (
                                            <span className={`font-raleway px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status, ticket.issue_type)}`} onClick={() => setEditingStatusId(ticket._id)} style={{ cursor: 'pointer' }} title="Click to change status">
                                                {ticket.status === 'Open' && <FaEnvelopeOpenText className="inline mr-1" />}
                                                {ticket.status === 'In Progress' && <FaCircleNotch className="inline mr-1 animate-spin" />}
                                                {ticket.status === 'Resolved' && <FaThumbsUp className="inline mr-1" />}
                                                {ticket.status || 'N/A'}
                                            </span>
                                        )}
                                    </div>
                                     {/* Submitted Timestamp */}
                                    <div className="mb-2 text-sm">
                                        <strong>Submitted:</strong> <span>{ticket.formattedTimestamp || 'N/A'}</span>
                                    </div>
                                     {/* Comments */}
                                    <div className="mb-4">
                                        <strong>Comments:</strong>
                                        {editingTicket === ticket._id ? (
                                            <textarea
                                                value={editedValues.comments}
                                                onChange={(e) => handleInputChange('comments', e.target.value)}
                                                className={`font-raleway px-2 py-1 border rounded text-sm w-full mt-1 ${darkMode ? 'text-white bg-gray-700 border-gray-600' : 'text-gray-900 bg-white border-gray-300'}`}
                                                rows="3"
                                                placeholder="Enter comments..."
                                            />
                                        ) : (
                                            <p className={`text-sm break-words ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{ticket.comments || 'N/A'}</p>
                                        )}
                                    </div>
                                </div>
                                {/* Action Buttons */}
                                <div className={`flex space-x-2 mt-auto pt-2 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    {editingTicket === ticket._id ? (
                                        <>
                                            <IconButton onClick={() => handleSave(ticket._id)} className={`p-1 ${darkMode ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-800'}`} title="Save" aria-label="save"><SaveIcon fontSize="small" /></IconButton>
                                            <IconButton onClick={() => handleCancelEdit()} className={`p-1 ${darkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`} title="Cancel" aria-label="cancel"><CancelIcon fontSize="small" /></IconButton>
                                        </>
                                    ) : (
                                        <>
                                            <IconButton onClick={() => handleEdit(ticket)} className={`p-1 ${darkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-800'}`} title="Edit" aria-label="edit"><EditIcon fontSize="small" /></IconButton>
                                            <IconButton onClick={() => confirmDelete(ticket._id)} className={`p-1 ml-auto ${darkMode ? 'text-red-400 hover:text-red-300' : 'text-red-600 hover:text-red-800'}`} title="Delete" aria-label="delete"><DeleteIcon fontSize="small" /></IconButton>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                            ))
                        ) : (
                            <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-center py-10">
                                No tickets found matching your criteria.
                            </div>
                        )}
                    </AnimatePresence>
                </motion.div>
            )}
        </div>
    );
};

TicketList.propTypes = {
    onDataChange: PropTypes.func,
    darkMode: PropTypes.bool,
    searchQuery: PropTypes.string,
    issueType: PropTypes.string,
    status: PropTypes.string,
};

export default TicketList;