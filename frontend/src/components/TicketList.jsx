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
import '../../src/App.css';
import '../../src/index.css';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import { IconButton } from '@mui/material';
import { FaSpinner, FaCheckCircle, FaExclamationCircle, FaBars, FaHome, FaTicketAlt, FaCog, FaSignOutAlt, FaEnvelopeOpenText, FaCircleNotch , FaThumbsUp, FaListAlt, FaUserPlus, FaPowerOff } from "react-icons/fa";


const TicketList = ({ onDataChange = () => { }, darkMode = false, searchQuery, issueType, status }) => {
    const [tickets, setTickets] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    // const [open, setOpen] = useState(false);       //REMOVED
    // const [notification, setNotification] = useState({ message: '', type: '' });     //REMOVED
    const [editingTicket, setEditingTicket] = useState(null);
    const [editedValues, setEditedValues] = useState({});
    const [expandedAddressId, setExpandedAddressId] = useState(null);
    const [editingStatusId, setEditingStatusId] = useState(null);
    const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
    const [ticketToDeleteId, setTicketToDeleteId] = useState(null);

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
        if (!data.mobile_number) errors.push('Location is required');
        return errors;
    };

    // const showNotification = (message, type) => {     //REMOVED
    //     setNotification({ message, type });
    //     setOpen(true);
    // };

    // const handleClose = (event, reason) => {          //REMOVED
    //     if (reason === 'clickaway') {
    //         return;
    //     }
    //     setOpen(false);
    // };

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
                formattedTimestamp: moment(ticket.createdAt || new Date()).format('DD-MM-YYYY hh:mm:ss A'),
            }));

            setTickets(ticketsWithTimestamps);
            if (onDataChange) {
                onDataChange();
            }
        } catch (error) {
            console.error('Error fetching tickets:', error);
           // showNotification('Failed to fetch tickets. Please try again.', 'error');  //REMOVED
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [issueType, status]);

    useEffect(() => {
        fetchTickets();
    }, []);

    const confirmDelete = (id) => {
        setTicketToDeleteId(id);
        setConfirmDeleteDialogOpen(true);
    };

    const handleDelete = async () => {
        setConfirmDeleteDialogOpen(false);
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/${ticketToDeleteId}`);
            setTickets(tickets.filter(ticket => ticket._id !== ticketToDeleteId));
            //showNotification('Ticket deleted successfully.', 'success');    //REMOVED
        } catch (error) {
            console.error('Error deleting ticket:', error);
            //showNotification('Failed to delete the ticket. Please try again.', 'error');       //REMOVED
            fetchTickets(); // Refresh tickets to reflect actual state
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
            issue_type: ticket.issue_type,
            location: ticket.location,
            comments: ticket.comments,
            mobile_number: ticket.mobile_number,
        });
    };

    const handleSave = async (ticketId) => {
        try {
            const validationErrors = validateTicketData(editedValues);
            if (validationErrors.length > 0) {
                //showNotification(validationErrors.join(', '), 'error');   //REMOVED
                return;
            }

            const updateData = {
                issue_type: editedValues.issue_type,
                location: editedValues.location,
                comments: editedValues.comments,
                mobile_number: editedValues.mobile_number,
                updated_at: new Date()
            };

            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/${ticketId}`,
                updateData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                const updatedTickets = tickets.map((ticket) => {
                    if (ticket._id === ticketId) {
                        return {
                            ...ticket,
                            ...updateData,
                            formattedTimestamp: moment(new Date()).format('DD-MM-YYYY hh:mm:ss A')
                        };
                    }
                    return ticket;
                });
                setTickets(updatedTickets);
                setEditingTicket(null);
                setEditedValues({});
               // showNotification('Ticket updated successfully.', 'success');    //REMOVED
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            //showNotification(       //REMOVED
               // error.response?.data?.message || 'Failed to update the ticket. Please try again.',
               // 'error'
           // );
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
        try {
            // Optimistically update the UI
            const updatedTickets = tickets.map(ticket =>
                ticket._id === ticketId ? { ...ticket, status: newStatus } : ticket
            );
            setTickets(updatedTickets);

            // Send the request to update the status on the server
            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/${ticketId}/status`, {
                status: newStatus,
            });

            //showNotification(`Status updated to ${newStatus}.`, 'success');        //REMOVED
            setEditingStatusId(null);
            if (onDataChange) {
                onDataChange(); // Notify the parent component of the data change
            }
        } catch (error) {
            console.error('Error updating status:', error);
           // showNotification('Failed to update status. Please try again.', 'error');      //REMOVED
            fetchTickets();
        }
    };

    const filteredTickets = tickets.filter(ticket => {
        if (status && ticket.status !== status) {
            return false;
        }

        const searchTerm = searchQuery.toLowerCase();
        const matchesSearch =
            ticket.ticket_id?.toLowerCase().includes(searchTerm) ||
            ticket.issue_type?.toLowerCase().includes(searchTerm) ||
            ticket.user_id?.toLowerCase().includes(searchTerm) ||
            ticket.location?.toLowerCase().includes(searchTerm) ||
            ticket.comments?.toLowerCase().includes(searchTerm);

        if (searchQuery && !matchesSearch) {
            return false;
        }

        if (issueType && ticket.issue_type !== issueType) {
            return false;
        }

        return true;
    });

    const issueTypeColors = {
        'Technical': 'bg-purple-100 text-purple-800',
        'Service': 'bg-blue-100 text-blue-800',
        'Billing': 'bg-green-100 text-green-800',
        'General': 'bg-yellow-100 text-yellow-800',
    };

    const getStatusColor = (status, issueType) => {
        if (issueTypeColors[issueType]) {
            return issueTypeColors[issueType]
        }
        switch (status) {
            case 'Open':
                return `bg-blue-100 text-blue-800 ${darkMode ? 'dark:bg-blue-900 dark:text-blue-100' : ''}`;
            case 'In Progress':
                return `bg-orange-100 text-orange-800 ${darkMode ? 'dark:bg-orange-900 dark:text-orange-100' : ''}`;
            case 'Resolved':
                return `bg-green-100 text-green-800 ${darkMode ? 'dark:bg-green-900 dark:text-green-100' : ''}`;
            default:
                return `bg-gray-100 text-gray-800 ${darkMode ? "dark:bg-gray-700 dark:text-gray-100" : ""}`;
        }
    };

    const handleViewMoreClick = (ticketId) => {
        setExpandedAddressId(expandedAddressId === ticketId ? null : ticketId);
    };

    return (
        <div className={`font-raleway space-y-6 ${darkMode ? "text-white" : "text-gray-700"}`}>
            {/* Confirmation Dialog */}
            <Dialog
                open={confirmDeleteDialogOpen}
                onClose={cancelDelete}
                aria-labelledby="alert-dialog-title"
                aria-describedby="alert-dialog-description"
            >
                <DialogTitle id="alert-dialog-title">{"Confirm Delete"}</DialogTitle>
                <DialogContent>
                    <DialogContentText id="alert-dialog-description">
                        Are you sure you want to delete this ticket? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={cancelDelete} color="primary">
                        Cancel
                    </Button>
                    <Button onClick={handleDelete} color="error" autoFocus>
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Loading Indicator */}
            {isLoading ? (
                <div className="flex justify-center items-center">
                    <FaSpinner className="animate-spin text-3xl text-blue-500" />
                    <span className="ml-2">Loading tickets...</span>
                </div>
            ) : (
                <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                    <AnimatePresence>
                        {filteredTickets.map((ticket) => (
                            <motion.div
                                key={ticket._id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                className={`font-raleway rounded-lg shadow-md p-4 ${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'}`}
                            >
                                <h3 className="font-semibold text-lg mb-2">Ticket ID: {ticket.ticket_id}</h3>
                                <div className="mb-2">
                                    <strong>Issue Type:</strong>
                                    {editingTicket === ticket._id ? (
                                        <select
                                            value={editedValues.issue_type}
                                            onChange={(e) => handleInputChange('issue_type', e.target.value)}
                                            className="font-raleway px-2 py-1 border rounded text-sm"
                                        >
                                            {[
                                                "Speed Issue",
                                                "Cable Complaint",
                                                "Recharge Related",
                                                "No Internet",
                                                "Others",
                                            ].map((type) => (
                                                <option className="font-raleway" key={type} value={type}>{type}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <span className={`font-raleway px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status, ticket.issue_type)}`}>
                                            {ticket.issue_type}
                                        </span>
                                    )}
                                </div>
                                <div className="mb-2">
                                    <strong>User ID:</strong> {ticket.user_id}
                                </div>
                                <div className="mb-2">
                                    <strong>Mobile Number:</strong>
                                    {editingTicket === ticket._id ? (
                                        <input
                                            type="text"
                                            value={editedValues.mobile_number}
                                            onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                                            className="font-raleway px-2 py-1 border rounded text-sm w-full"
                                        />
                                    ) : (
                                        ticket.mobile_number
                                    )}
                                </div>
                                <div className="mb-2">
                                    <strong>Address:</strong>
                                    {editingTicket === ticket._id ? (
                                        <input
                                            type="text"
                                            value={editedValues.location}
                                            onChange={(e) => handleInputChange('location', e.target.value)}
                                            className="font-raleway px-2 py-1 border rounded text-sm w-full"
                                        />
                                    ) : (
                                        <div className="relative">
                                            <span className={`font-raleway overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px] block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                {expandedAddressId === ticket._id ? ticket.location : ticket.location}
                                            </span>
                                            {ticket.location && ticket.location.length > 200 && (
                                                <button
                                                    onClick={() => handleViewMoreClick(ticket._id)}
                                                    className="font-raleway text-blue-600 hover:text-blue-900 ml-1"
                                                >
                                                    {expandedAddressId === ticket._id ? 'View Less' : 'View More'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="mb-2">
                                    <strong>Status:</strong>
                                    {editingStatusId === ticket._id ? (
                                        <select
                                            value={ticket.status}
                                            onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                                            className="font-raleway px-2 py-1 rounded-full text-xs font-semibold"
                                        >
                                            <option className="font-raleway" value="Open"> Open</option>
                                            <option className="font-raleway" value="In Progress"> In Progress</option>
                                            <option className="font-raleway" value="Resolved"> Resolved</option>
                                        </select>
                                    ) : (
                                        <span className={`font-raleway px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status, ticket.issue_type)}`} onClick={() => setEditingStatusId(ticket._id)} style={{ cursor: 'pointer' }}>
                                            {ticket.status === 'Open' && <FaEnvelopeOpenText className="inline mr-1
                                            ml-1 animate-pulse" />}
                                            {ticket.status === 'In Progress' && 
                                            <FaCircleNotch className="inline mr-1
                                            ml-1 animate-spin" />}
                                            {ticket.status === 'Resolved' && 
                                            <FaThumbsUp className="inline mr-1 ml-1 animate-bounce" />}
                                            {ticket.status}
                                        </span>
                                    )}
                                </div>
                                <div className="mb-2">
                                    <strong>Submitted:</strong> {ticket.formattedTimestamp}
                                </div>
                                <div className="mb-2">
                                    <strong>Comments:</strong>
                                    {editingTicket === ticket._id ? (
                                        <textarea
                                            value={editedValues.comments}
                                            onChange={(e) => handleInputChange('comments', e.target.value)}
                                            className="font-raleway px-2 py-1 border rounded text-sm w-full"
                                            rows="2"
                                        />
                                    ) : (
                                        ticket.comments || 'N/A'
                                    )}
                                </div>
                                <div className="flex space-x-2">
                                    {editingTicket === ticket._id ? (
                                        <>
                                            <IconButton
                                                onClick={() => handleSave(ticket._id)}
                                                className="font-raleway p-1 text-green-600 hover:text-green-900"
                                                title="Save"
                                                aria-label="save"
                                            >
                                                <SaveIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => handleCancelEdit()}
                                                className="font-raleway p-1 text-gray-600 hover:text-gray-900"
                                                title="Cancel"
                                                aria-label="cancel"
                                            >
                                                <CancelIcon />
                                            </IconButton>
                                        </>
                                    ) : (
                                        <>
                                            <IconButton
                                                onClick={() => handleEdit(ticket)}
                                                className="font-raleway p-1 text-blue-600 hover:text-blue-900"
                                                title="Edit"
                                                aria-label="edit"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                onClick={() => confirmDelete(ticket._id)}
                                                className="font-raleway p-1 text-red-600 hover:text-red-900"
                                                title="Delete"
                                                aria-label="delete"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </>
                                    )}
                                </div>
                            </motion.div>
                        ))}
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