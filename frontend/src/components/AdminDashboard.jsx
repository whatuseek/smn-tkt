// frontend/src/components/AdminDashboard.jsx
import {  useEffect, useRef, useCallback } from "react";
import TicketList from "./TicketList";
import UserUpload from "./UserUpload";
import axios from "axios";
import { motion } from "framer-motion";
import { FaCheckCircle, FaExclamationCircle, FaBars, FaHome, FaTicketAlt, FaCog, FaSignOutAlt, FaEnvelopeOpenText, FaCircleNotch, FaThumbsUp, FaListAlt, FaUserPlus, FaPowerOff } from "react-icons/fa";
import { MdDarkMode, MdLightMode } from "react-icons/md"
import PropTypes from 'prop-types';
import TicketForm from "./TicketForm";
import RefreshIcon from '@mui/icons-material/Refresh';
import { IconButton } from '@mui/material';

const AdminDashboard = ({
    navigate,
    uploadStatus,
    setUploadStatus,
    darkMode,
    setDarkMode,
    showTickets,
    setShowTickets,
    isMenuOpen,
    setIsMenuOpen,
    activeTab,
    setActiveTab,
    showUserUpload,
    setShowUserUpload,
    showTicketForm,
    setShowTicketForm,
    setTickets,
    selectedFile,
    setSelectedFile,
    uploading,
    setUploading,
    uploadProgress,
    setUploadProgress,
    filteredStatus,
    setFilteredStatus,
    isDbConnected,
    setIsDbConnected,
    isCheckingConnection,
    setIsCheckingConnection,
    searchQuery,
    setSearchQuery,
    issueType,
    setIssueType,
    availableIssueTypes,
    totalTickets,
    openTickets,
    inProgressTickets,
    resolvedTickets,
}) => {
    const homeButtonRef = useRef(null);

    useEffect(() => {
        if (showTickets) {
            setActiveTab('tickets');
        } else if (showUserUpload) {
            setActiveTab('upload');
        } else if (showTicketForm) {
            setActiveTab('ticketForm');
        } else {
            setActiveTab('dashboardHome');
        }
    }, [showTickets, showUserUpload, showTicketForm, setActiveTab]);  // ADD setActiveTab

    const handleLogout = () => {
        localStorage.removeItem("adminLoggedIn");
        navigate("/");
    };
    const checkDbConnection = useCallback(async () => {
        setIsCheckingConnection(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/db-check`);
            setIsDbConnected(response.status === 200);

            if (response.status === 200) {
                setUploadStatus({ message: " Connected!", type: "success" });
                setTimeout(() => setUploadStatus({ message: '', type: '' }), 3000);

            } else {
                setIsDbConnected(false);
                setUploadStatus({ message: "Failed to connect", type: "error" });
                setTimeout(() => setUploadStatus({ message: '', type: '' }), 3000);
            }
        } catch (error) {
            setIsDbConnected(false);
            console.error("Error checking database connection:", error);
            setUploadStatus({ message: "Not Connected!", type: "error" });
            setTimeout(() => setUploadStatus({ message: '', type: '' }), 3000);

        } finally {
            setIsCheckingConnection(false);
        }
    }, [setIsCheckingConnection, setIsDbConnected, setUploadStatus]);
    useEffect(() => {
        checkDbConnection();
    }, [checkDbConnection]);  // ADD checkDbConnection

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const handleTicketFormClick = () => {
        setShowTicketForm(true);
        setShowTickets(false);
        setShowUserUpload(false);
        setFilteredStatus(null);
    };

    const handleTicketsLinkClick = () => {
        setShowTickets(true);
        setShowUserUpload(false);
        setShowTicketForm(false);
        setFilteredStatus(null);
    }

    const handleUserUploadClick = () => {
        setShowUserUpload(true);
        setShowTickets(false);
        setShowTicketForm(false);
        setFilteredStatus(null);
    };

    const handleHomeButtonClick = () => {
        setTimeout(() => {
            setShowTickets(false);
            setShowUserUpload(false);
            setShowTicketForm(false);
            setIsMenuOpen(false);

        }, 500);

        setFilteredStatus(null);
    };

    const handleFileChange = (event) => {
        setSelectedFile(event.target.files[0]);
    };

    const handleClearFile = () => {
        setSelectedFile(null);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadStatus({ message: "Please select a file.", type: "error" });
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await axios.post(
                "http://localhost:5000/api/user/upload-users",
                formData,
                {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        setUploadProgress(progress);
                    },
                }
            );
            if (response.data.success) {
                setUploadStatus({ message: response.data.message, type: "success" });
                setSelectedFile(null);
                setUploadProgress(0);
                setTimeout(() => setUploadStatus({ message: '', type: '' }), 3000);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            setUploadStatus({
                message:
                    error.response?.data?.message ||
                    "Error uploading file. Please try again.",
                type: "error",
            });
            setTimeout(() => setUploadStatus({ message: '', type: '' }), 3000);
        } finally {
            setUploading(false);
        }
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };


    const getStatusColor = (status) => {
        switch (status) {
            case 'Total':
                return `bg-gray-100 text-gray-700 ${darkMode ? 'dark:bg-gray-800 dark:text-gray-300' : ''}`;
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

    const getNumberColor = (status) => {
        switch (status) {
            case 'Open':
                return `text-blue-800`;
            case 'In Progress':
                return `text-orange-800`;
            case 'Resolved':
                return `text-green-800`;
            default:
                return ``;
        }
    };


    const fetchTickets = async () => {
        try {
            let url = `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets`;
            const params = new URLSearchParams();

            if (issueType) {
                params.append('issue_type', issueType);
            }
            if (filteredStatus) {
                params.append('status', filteredStatus);
            }

            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const response = await axios.get(url);
            setTickets(response.data);
        } catch (error) {
            console.error('Error fetching tickets:', error);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [issueType, filteredStatus]);

    const handleStatisticCardClick = (status) => {
        setShowTickets(true);
        setShowUserUpload(false);
        setShowTicketForm(false);
        setFilteredStatus(status);
    };
    const handleResetFilters = () => {
        setIssueType('');
        setSearchQuery('');
        setFilteredStatus(null)
    };


    return (
        <div className={`font min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"} flex flex-col`}>
            {/* Header */}
            <header className={`sticky top-0 z-10 flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 rounded-lg  w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                <div className="flex items-center justify-between w-full sm:w-auto">
                    <h1 className="font-raleway text-2xl sm:text-3xl font-bold">Dashboard
                        {/* DB Connection Button and Status */}
                        <IconButton
                            onClick={checkDbConnection}
                            disabled={isCheckingConnection}
                            className={`p-2 rounded-full ${isDbConnected ? "text-green-500 hover:text-green-600" : "text-red-500 hover:text-red-600"
                                } text-white transition-colors`}
                            title={isDbConnected ? "Database Connected" : "Connect to Database"}
                            aria-label={isDbConnected ? "Database Connected" : "Connect to Database"}
                        >
                            <FaPowerOff className={`${isCheckingConnection ? 'animate-pulse' : ''}`} />
                        </IconButton>
                    </h1>
                    {/* Database Connection Status */}
                    {uploadStatus.message && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className={`flex items-center px-4 py-2 rounded-md text-sm font-medium ${uploadStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                            {uploadStatus.type === 'success' ? (
                                <FaCheckCircle className="mr-2" />
                            ) : (
                                    <FaExclamationCircle className="mr-2" />
                                )}
                            {uploadStatus.message}
                        </motion.div>
                    )}
                    {/* Hamburger Menu Button */}
                    <button onClick={toggleMenu} className="sm:hidden flex it text-gray-500 hover:text-gray-700 focus:outline-none">
                        <FaBars className="h-6 w-6" />
                    </button>

                </div>

                <nav className={`flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 ${isMenuOpen ? 'block' : 'hidden'} sm:flex`}>
                    <button
                        onClick={handleHomeButtonClick}
                        ref={homeButtonRef}
                        title="Home"  // Tooltip
                        className={`font-raleway flex items-center px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition ${darkMode
                            ? activeTab === 'dashboardHome'
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-300 hover:bg-gray-700'
                            : activeTab === 'dashboardHome'
                                ? 'bg-gray-200 text-gray-900'
                                : 'text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <FaHome className="mr-1" /> Home
                    </button>
                    <button
                        onClick={() => { handleTicketsLinkClick(); setIsMenuOpen(false); }}
                        title="Tickets"  // Tooltip
                        className={`font-raleway flex items-center px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition ${darkMode
                            ? activeTab === 'tickets'
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-300 hover:bg-gray-700'
                            : activeTab === 'tickets'
                                ? 'bg-gray-200 text-gray-900'
                                : 'text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <FaListAlt className="mr-1" /> Lists
                    </button>
                    <button
                        onClick={() => { handleUserUploadClick(); setIsMenuOpen(false); }}
                        title="Add User"  // Tooltip
                        className={`font-raleway flex items-center px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition ${darkMode
                            ? activeTab === 'upload'
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-300 hover:bg-gray-700'
                            : activeTab === 'upload'
                                ? 'bg-gray-200 text-gray-900'
                                : 'text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <FaUserPlus className="mr-1" /> Add User
                    </button>
                    <button
                        onClick={() => { handleTicketFormClick(); setIsMenuOpen(false); }}
                        title="Ticket Form"  // Tooltip
                        className={`font-raleway flex items-center px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition ${darkMode
                            ? activeTab === 'ticketForm'
                                ? 'bg-gray-700 text-white'
                                : 'text-gray-300 hover:bg-gray-700'
                            : activeTab === 'ticketForm'
                                ? 'bg-gray-200 text-gray-900'
                                : 'text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        <FaTicketAlt className="mr-1" /> Ticket+
                    </button>
                    <a href="#" title="Settings" // Tooltip
                        className={`font-raleway flex items-center px-3 py-1 sm:px-4 sm:py-2 ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-200"} rounded-lg transition`}>
                        <FaCog className="mr-1" /> Settings
                    </a>

                    {/* Dark Mode Toggle Switch */}
                    <div className="flex items-center">
                        {darkMode ? (
                            <MdLightMode className="mr-2 h-5 w-5 text-gray-300" />
                        ) : (
                                <MdDarkMode className="mr-2 h-5 w-5 text-gray-700" />
                            )}
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                value=""
                                className="sr-only peer"
                                checked={darkMode}
                                onChange={toggleDarkMode}
                            />
                            <div className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}>
                                <div className="absolute inset-0 flex items-center justify-center h-full w-full text-gray-500 transition-opacity">

                                </div>
                            </div>
                        </label>
                    </div>

                    <button
                        onClick={handleLogout}
                        title="Logout"  // Tooltip
                        className={`font-raleway flex items-center px-3 py-1 sm:px-4 sm:py-2 ${darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"} text-white rounded-lg transition`}
                    >
                        <FaSignOutAlt className="mr-1" /> Logout
                    </button>
                </nav>

            </header>

            {/* Search and Filter Section */}
            {/* Search and Filter Section */}
            {/* Search and Filter Section */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={` sticky top-[60px] font-raleway flex flex-col   items-center justify-between bg-white p-2 rounded-lg shadow-xl ${darkMode ? "bg-gray-800" : "bg-white"}`}
            >
                <div className="w-full mb-1">
                    <input
                        type="text"
                        placeholder="Search tickets..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="font-raleway w-full px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs"
                    />
                </div>
                <div className="flex items-center space-x-1">
                    <select
                        value={issueType}
                        onChange={(e) => setIssueType(e.target.value)}
                        className="font-raleway px-2 py-1 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                    >
                        <option className="font-raleway" value="">All Issues</option>
                        {availableIssueTypes.map((type) => (
                            <option className="font-raleway" key={type} value={type}>{type}</option>
                        ))}
                    </select>
                    <IconButton
                        onClick={checkDbConnection}
                        disabled={isCheckingConnection}
                        className={`p-1 rounded-full ${isDbConnected ? "text-green-500 hover:text-green-600" : "text-red-500 hover:text-red-600"
                            } text-white transition-colors`}
                        title={isDbConnected ? "Database Connected" : "Connect to Database"}
                        aria-label={isDbConnected ? "Database Connected" : "Connect to Database"}
                    >
                        <RefreshIcon className={`${isCheckingConnection ? 'animate-spin' : ''}`} />
                    </IconButton>
                    <button
                        onClick={handleResetFilters}
                        className="p-1 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-xs"
                    >
                        Reset
                    </button>
                </div>
            </motion.div>

            {/* Main Content */}
            <main className="p-4 sm:p-6   flex-1 overflow-y-auto w-full pt-10">

                {/* Ticket Statistics */}
                {!showTickets && !showUserUpload && !showTicketForm && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className={`font-raleway grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8`}
                    >
                        {/* Total Tickets Card */}
                        <div className={`rounded-2xl shadow-md p-4 flex flex-col items-start ${darkMode ? "bg-gray-800 text-white" : "bg-white text-gray-700"}`}>
                            <div className="text-lg font-semibold mb-1"> Total Tickets <FaTicketAlt className="inline ml-1" /></div>
                            <div className={`text-4xl font-bold`}>{totalTickets}</div>
                        </div>
                        {/* Open Tickets Card */}
                        <div
                            onClick={() => handleStatisticCardClick('Open')}
                            className={`rounded-2xl shadow-md p-4 flex flex-col items-start ${getStatusColor('Open')} cursor-pointer`}
                        >

                            <motion.div
                            // animate={{ opacity: [0.8, 0.8, 0.3] }} // Subtle pulse
                            // transition={{ loop: Infinity, duration: 1 }}
                            >
                                <div className="text-lg font-semibold mb-1">Open <FaEnvelopeOpenText className="inline ml-1 animate-pulse" /></div>
                            </motion.div>
                            <div className={`text-4xl font-bold ${getNumberColor('Open')}`}>{openTickets}</div>
                        </div>
                        {/* In Progress Tickets Card */}
                        <div
                            onClick={() => handleStatisticCardClick('In Progress')}
                            className={`rounded-2xl shadow-md p-4 flex flex-col items-start ${getStatusColor('In Progress')} cursor-pointer`}
                        >
                            <div className="font-raleway text-lg font-semibold mb-1">In Progress <FaCircleNotch className="inline ml-1 animate-spin" /></div>
                            <div className={`font-raleway text-4xl font-bold ${getNumberColor('In Progress')}`}>{inProgressTickets}</div>
                        </div>
                        {/* Resolved Tickets Card */}
                        <div
                            onClick={() => handleStatisticCardClick('Resolved')}
                            className={`rounded-2xl shadow-md p-4 flex flex-col items-start ${getStatusColor('Resolved')} cursor-pointer`}
                        >
                            <div className="font-raleway text-lg font-semibold mb-1">Resolved <FaThumbsUp className="inline ml-1" /></div>
                            <div className={`font-raleway text-4xl font-bold ${getNumberColor('Resolved')}`}>{resolvedTickets}</div>
                        </div>
                    </motion.div>
                )}


                {/* Ticket List */}
                {showTickets && (
                    <>

                        <div className="flex-1 overflow-auto">
                            <TicketList
                                darkMode={darkMode}
                                searchQuery={searchQuery}
                                issueType={issueType}
                                status={filteredStatus}
                            />
                        </div>
                    </>
                )}
                {/* User Upload Component */}
                {showUserUpload && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex-1 overflow-auto"
                    >
                        <UserUpload
                            darkMode={darkMode}
                            selectedFile={selectedFile}

                            uploading={uploading}
                            uploadProgress={uploadProgress}
                            handleFileChange={handleFileChange}
                            handleClearFile={handleClearFile}
                            handleUpload={handleUpload}
                            setUploadStatus={setUploadStatus}
                        />
                    </motion.div>
                )}
                {showTicketForm && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="flex-1 overflow-auto"
                    >
                        <TicketForm
                        />
                    </motion.div>
                )}
                {/* REMOVE ALL OTHER Notification */}


            </main>
        </div>
        //</AdminRouteGuard>    REMOVED AdminRouteGuard
    );
};

AdminDashboard.propTypes = {
    navigate: PropTypes.func.isRequired,
    uploadStatus: PropTypes.shape({
        message: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
    }).isRequired,
    setUploadStatus: PropTypes.func.isRequired,
    darkMode: PropTypes.bool.isRequired,
    setDarkMode: PropTypes.func.isRequired,
    showTickets: PropTypes.bool.isRequired,
    setShowTickets: PropTypes.func.isRequired,
    isMenuOpen: PropTypes.bool.isRequired,
    setIsMenuOpen: PropTypes.func.isRequired,
    activeTab: PropTypes.string.isRequired,
    setActiveTab: PropTypes.func.isRequired,
    showUserUpload: PropTypes.bool.isRequired,
    setShowUserUpload: PropTypes.func.isRequired,
    showTicketForm: PropTypes.bool.isRequired,
    setShowTicketForm: PropTypes.func.isRequired,
    setTickets: PropTypes.func.isRequired,
    selectedFile: PropTypes.object,
    setSelectedFile: PropTypes.func,
    uploading: PropTypes.bool.isRequired,
    setUploading: PropTypes.func.isRequired,
    uploadProgress: PropTypes.number.isRequired,
    setUploadProgress: PropTypes.func.isRequired,
    filteredStatus: PropTypes.string,
    setFilteredStatus: PropTypes.func,
    homeButtonRef: PropTypes.shape({
        current: PropTypes.oneOfType([PropTypes.instanceOf(Element), PropTypes.any]),
    }),
    searchQuery: PropTypes.string.isRequired,
    setSearchQuery: PropTypes.func.isRequired,
    issueType: PropTypes.string.isRequired,
    setIssueType: PropTypes.func.isRequired,
    availableIssueTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
    isDbConnected: PropTypes.bool.isRequired,
    setIsDbConnected: PropTypes.func.isRequired,
    isCheckingConnection: PropTypes.bool.isRequired,
    setIsCheckingConnection: PropTypes.func.isRequired,
    totalTickets: PropTypes.number.isRequired,
    openTickets: PropTypes.number.isRequired,
    inProgressTickets: PropTypes.number.isRequired,
    resolvedTickets: PropTypes.number.isRequired,
};

export default AdminDashboard;