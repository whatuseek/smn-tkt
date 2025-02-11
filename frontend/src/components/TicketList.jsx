import { useEffect, useState } from 'react';
import axios from 'axios';
import PropTypes from 'prop-types';
import moment from 'moment';
import { FiTrash2, FiRefreshCw, FiEdit2, FiSave, FiX } from 'react-icons/fi';
import { motion, AnimatePresence } from 'framer-motion';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Slide from '@mui/material/Slide';
import '../../src/App.css';
import '../../src/index.css';

const TicketList = ({ onDataChange = () => { }, darkMode = false }) => { // Use default parameters here
    const [tickets, setTickets] = useState([]);
    const [issueType, setIssueType] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [open, setOpen] = useState(false);
    const [notification, setNotification] = useState({ message: '', type: '' });
    const [availableIssueTypes, setAvailableIssueTypes] = useState([]);
    const [editingTicket, setEditingTicket] = useState(null);
    const [editedValues, setEditedValues] = useState({});
    const [expandedAddressId, setExpandedAddressId] = useState(null);

    // Animation variants for smooth transitions
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    // Function to validate the ticket data before saving
    const validateTicketData = (data) => {
        const errors = [];

        if (!data.issue_type) errors.push('Issue type is required');
        if (!data.mobile_number) errors.push('Mobile number is required');
        if (!data.location) errors.push('Location is required');

        return errors;
    };

    // Helper function to display notifications using MUI Snackbar
    const showNotification = (message, type) => {
        setNotification({ message, type });
        setOpen(true);
    };
    const handleClose = (event, reason) => {
        if (reason === 'clickaway') {
            return;
        }
        setOpen(false);
    };


    // Fetch available issue types from the backend
    const fetchIssueTypes = async () => {
        try {
            const response = await axios.get(import.meta.env.VITE_BACKEND_URL + '/api/admin/issue-types'); // Updated API call

            setAvailableIssueTypes(response.data);
        } catch (error) {
            console.error('Error fetching issue types:', error);
            showNotification('Failed to fetch issue types. Please try again.', 'error');
        }
    };

    // Fetch tickets data from backend based on filters
    const fetchTickets = async () => {
        setIsLoading(true);
        try {
            const url = issueType
                ? `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets?issue_type=${issueType}`// Updated API call
                : `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets`; // Updated API call

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
            showNotification('Failed to fetch tickets. Please try again.', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        fetchIssueTypes();
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [issueType])

    // Handler for deleting a ticket
    const handleDelete = async (id) => {
        try {
            await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/${id}`); // Updated API call
            const updatedTickets = tickets.filter((ticket) => ticket._id !== id);
            setTickets(updatedTickets);
            showNotification('Ticket deleted successfully.', 'error');
        } catch (error) {
            console.error('Error deleting ticket:', error);
            showNotification('Failed to delete the ticket. Please try again.', 'error');
        }
    };

    // Handler to enable editing mode for a ticket
    const handleEdit = (ticket) => {
        setEditingTicket(ticket._id);
        setEditedValues({
            issue_type: ticket.issue_type,
            location: ticket.location,
            comments: ticket.comments,
            mobile_number: ticket.mobile_number,
        });
    };

    // Handler for saving the changes of a edited ticket
    const handleSave = async (ticketId) => {
        try {
            // Validate the edited data
            const validationErrors = validateTicketData(editedValues);
            if (validationErrors.length > 0) {
                showNotification(validationErrors.join(', '), 'error');
                return;
            }

            // Prepare the data to send for updating
            const updateData = {
                issue_type: editedValues.issue_type,
                location: editedValues.location,
                comments: editedValues.comments,
                mobile_number: editedValues.mobile_number,
                updated_at: new Date()
            };

            // Send a PUT request to update the ticket in database
            const response = await axios.put(
                `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/${ticketId}`,// Updated API 
                updateData,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data) {
                // Update the local state with the new data
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
                showNotification('Ticket updated successfully.', 'success');
            }
        } catch (error) {
            console.error('Error updating ticket:', error);
            showNotification(
                error.response?.data?.message || 'Failed to update the ticket. Please try again.',
                'error'
            );
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

    // Handler to change the status of a ticket
    const handleStatusChange = async (ticketId, newStatus) => {
        try {
            const updatedTickets = tickets.map((ticket) => {
                if (ticket._id === ticketId) {
                    return { ...ticket, status: newStatus };
                }
                return ticket;
            });
            setTickets(updatedTickets);

            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets/${ticketId}/status`,  // Updated API call
                {
                    status: newStatus,
                });
            showNotification(`Status updated to ${newStatus}.`, 'success');
        } catch (error) {
            console.error('Error updating status:', error);
            showNotification('Failed to update status. Please try again.', 'error');
        }
    };

    // Filtering tickets based on search query
    const filteredTickets = tickets.filter(
        (ticket) =>
            ticket.ticket_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.issue_type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.user_id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.location?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ticket.comments?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    // Get status color for each ticket
    const issueTypeColors = {
        'Technical': 'bg-purple-100 text-purple-800',
        'Service': 'bg-blue-100 text-blue-800',
        'Billing': 'bg-green-100 text-green-800',
        'General': 'bg-yellow-100 text-yellow-800',
        // Add more as needed
    };
    // Helper function to get the status color based on the issue type
    const getStatusColor = (status, issueType) => {
        if (issueTypeColors[issueType]) {
            return issueTypeColors[issueType]
        }
        switch (status) {
            case 'Open':
                return `bg-yellow-100 text-yellow-800 ${darkMode ? 'dark:bg-yellow-900 dark:text-yellow-100' : ''}`;
            case 'In Progress':
                return `bg-blue-100 text-blue-800 ${darkMode ? 'dark:bg-blue-900 dark:text-blue-100' : ''}`;
            case 'Resolved':
                return `bg-green-100 text-green-800 ${darkMode ? 'dark:bg-green-900 dark:text-green-100' : ''}`;
            default:
                return `bg-gray-100 text-gray-800 ${darkMode ? "dark:bg-gray-700 dark:text-gray-100" : ""}`;
        }
    };

    const handleViewMoreClick = (ticketId) => {
        setExpandedAddressId(expandedAddressId === ticketId ? null : ticketId);
    };

    // Handler for clearing the filters and search
    const handleResetFilters = () => {
        setIssueType('');
        setSearchQuery('');
        fetchTickets();
    };

    return (
        <div className={`space-y-6 ${darkMode ? "text-white" : "text-gray-700"}`}>
            {/* Notification */}
            <Snackbar
                open={open}
                autoHideDuration={700}
                onClose={handleClose}
                TransitionComponent={Slide}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleClose} severity={notification.type} sx={{ width: '100%' }} variant="filled">
                    {notification.message}
                </Alert>
            </Snackbar>

            {/* Search and Filter Section */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={`flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-lg shadow-sm ${darkMode ? "bg-gray-800" : "bg-white"}`}
            >
                <div className="w-full md:w-1/3">
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${darkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value)}
                        className={`px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${darkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                    >
                        <option value="">All Issues</option>
                        {availableIssueTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <button
                        onClick={fetchTickets}
                        className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                        <FiRefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={handleResetFilters}
                        className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        Reset
                    </button>
                </div>
            </motion.div>

            {/* Tickets Table */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={`bg-white rounded-lg shadow-sm overflow-hidden ${darkMode ? "bg-gray-800" : "bg-white"}`}
            >
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className={` ${darkMode ? "bg-gray-700 text-gray-300" : "bg-gray-50"}`}>
                            <tr>
                                {['Ticket ID', 'Issue Type', 'User ID', 'Mobile Number', 'Address', 'Status', 'Submitted', 'Comments', 'Actions'].map((header) => (
                                    <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        {header}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className={`bg-white divide-y divide-gray-200 ${darkMode ? "bg-gray-900" : "bg-white"}`}>
                            <AnimatePresence>
                                {filteredTickets.map((ticket) => (
                                    <motion.tr
                                        key={ticket._id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        whileHover={{ scale: 1.01 }}
                                        className={`hover:bg-gray-50 transition-colors ${darkMode ? "hover:bg-gray-700 text-white" : ""}`}
                                    >
                                        <td className="px-6 py-4 whitespace-wrap">{ticket.ticket_id}</td>
                                        <td className="px-6 py-4 whitespace-wrap">
                                            {editingTicket === ticket._id ? (
                                                <select
                                                    value={editedValues.issue_type}
                                                    onChange={(e) => handleInputChange('issue_type', e.target.value)}
                                                    className={`px-2 py-1 border rounded text-sm ${darkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                                                >
                                                    {availableIssueTypes.map((type) => (
                                                        <option key={type} value={type}>{type}</option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status, ticket.issue_type)}`}>
                                                    {ticket.issue_type}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-wrap">{ticket.user_id}</td>
                                        <td className="px-6 py-4 whitespace-wrap">
                                            {editingTicket === ticket._id ? (
                                                <input
                                                    type="text"
                                                    value={editedValues.mobile_number}
                                                    onChange={(e) => handleInputChange('mobile_number', e.target.value)}
                                                    className="px-2 py-1 border rounded text-sm w-full"
                                                />
                                            ) : (
                                                ticket.mobile_number
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-wrap">
                                            {editingTicket === ticket._id ? (
                                                <input
                                                    type="text"
                                                    value={editedValues.location}
                                                    onChange={(e) => handleInputChange('location', e.target.value)}
                                                    className="px-2 py-1 border rounded text-sm w-full"
                                                />
                                            ) : (
                                                <div className="relative">
                                                    <span className={`overflow-hidden text-ellipsis whitespace-nowrap max-w-[150px] block ${darkMode ? "text-gray-300" : "text-gray-700"}`}>
                                                        {expandedAddressId === ticket._id ? ticket.location : ticket.location}
                                                    </span>
                                                    {ticket.location && ticket.location.length > 150 && (
                                                        <button
                                                            onClick={() => handleViewMoreClick(ticket._id)}
                                                            className="text-blue-600 hover:text-blue-900 ml-1"
                                                        >
                                                            {expandedAddressId === ticket._id ? 'View Less' : 'View More'}
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-wrap">
                                            <select
                                                value={ticket.status}
                                                onChange={(e) => handleStatusChange(ticket._id, e.target.value)}
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(ticket.status, ticket.issue_type)}`}
                                            >
                                                <option value="Open">Open</option>
                                                <option value="In Progress">In Progress</option>
                                                <option value="Resolved">Resolved</option>
                                            </select>
                                        </td>
                                        <td className="px-6 py-4 whitespace-wrap text-sm text-gray-500">
                                            {ticket.formattedTimestamp}
                                        </td>
                                        <td className="px-6 py-4 whitespace-wrap">
                                            {editingTicket === ticket._id ? (
                                                <textarea
                                                    value={editedValues.comments}
                                                    onChange={(e) => handleInputChange('comments', e.target.value)}
                                                    className="px-2 py-1 border rounded text-sm w-full"
                                                    rows="2"
                                                />
                                            ) : (
                                                ticket.comments || 'N/A'
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <div className="flex space-x-2">
                                                {editingTicket === ticket._id ? (
                                                    <>
                                                        <button
                                                            onClick={() => handleSave(ticket._id)}
                                                            className="p-1 text-green-600 hover:text-green-900"
                                                            title="Save"
                                                        >
                                                            <FiSave className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={handleCancelEdit}
                                                            className="p-1 text-gray-600 hover:text-gray-900"
                                                            title="Cancel"
                                                        >
                                                            <FiX className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            onClick={() => handleEdit(ticket)}
                                                            className="p-1 text-blue-600 hover:text-blue-900"
                                                            title="Edit"
                                                        >
                                                            <FiEdit2 className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(ticket._id)}
                                                            className="p-1 text-red-600 hover:text-red-900"
                                                            title="Delete"
                                                        >
                                                            <FiTrash2 className="w-5 h-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
};

TicketList.propTypes = {
    onDataChange: PropTypes.func,
    darkMode: PropTypes.bool,
};

// TicketList.defaultProps = { // REMOVE THIS ENTIRE BLOCK
//     onDataChange: () => { },
//     darkMode: false,
// };

export default TicketList;