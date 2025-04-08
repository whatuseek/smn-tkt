// frontend/src/components/AdminDashboard.jsx
import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import TicketList from "./TicketList";
import UserUpload from "./UserUpload";
import TicketForm from "./TicketForm";
import axios from "axios";
import { motion } from "framer-motion";
import {
    FaCheckCircle,
    FaExclamationCircle,
    FaBars,
    FaTimes,
    FaHome,
    FaTicketAlt,
    FaSignOutAlt,
    FaEnvelopeOpenText,
    FaCircleNotch,
    FaThumbsUp,
    FaListAlt,
    FaUserPlus,
    FaSync
} from "react-icons/fa";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import PropTypes from "prop-types";
import { IconButton } from "@mui/material";
import { useSwipeable } from 'react-swipeable';  // Import useSwipeable

const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [uploadStatus, setUploadStatus] = useState({ message: "", type: "", source: "" });
    const [darkMode, setDarkMode] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [filteredStatus, setFilteredStatus] = useState(null);
    const homeButtonRef = useRef(null);
    const [isDbConnected, setIsDbConnected] = useState(false);
    const [isCheckingConnection, setIsCheckingConnection] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [issueType, setIssueType] = useState("");
    const [availableIssueTypes, setAvailableIssueTypes] = useState([]);
    const [isTouchDevice, setIsTouchDevice] = useState(false); // New state variable

    // Focus home button on mount
    useEffect(() => {
        if (homeButtonRef.current) {
            homeButtonRef.current.focus();
        }
    }, []);

    // Detect touch device on mount
    useEffect(() => {
        setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0);
    }, []);

    // Determine active tab based on route
    const getActiveTab = () => {
        if (location.pathname.includes("tickets")) return "tickets";
        if (location.pathname.includes("addUser")) return "upload";
        if (location.pathname.includes("ticketForm")) return "ticketForm";
        return "dashboardHome";
    };
    const [activeTab, setActiveTab] = useState(getActiveTab());
    useEffect(() => {
        setActiveTab(getActiveTab());
    }, [location.pathname]);

    const handleLogout = () => {
        localStorage.removeItem("adminLoggedIn");
        navigate("/");
    };

    // Check database connection
    const checkDbConnection = async () => {
        setIsCheckingConnection(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/db-check`);
            if (response && response.status === 200) {
                setIsDbConnected(true);
                setUploadStatus({ message: "Connected!", type: "success", source: "db" });
                setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 3000);
            } else {
                setIsDbConnected(false);
                setUploadStatus({ message: "Failed to connect", type: "error", source: "db" });
                setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 3000);
            }
        } catch (error) {
            setIsDbConnected(false);
            console.error("Error checking database connection:", error);
            setUploadStatus({ message: "Not Connected!", type: "error", source: "db" });
            setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 3000);
        } finally {
            setIsCheckingConnection(false);
        }
    };

    useEffect(() => {
        checkDbConnection();
    }, []);

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const handleHomeButtonClick = () => {
        navigate("/admin-dashboard");
        setFilteredStatus(null);
        setIsMenuOpen(false);
    };

    const handleFileChange = (event) => {
        if (event.target.files && event.target.files.length > 0) {
            setSelectedFile(event.target.files[0]);
        }
    };

    const handleClearFile = () => {
        setSelectedFile(null);
    };

    const handleUpload = async () => {
        if (!selectedFile) {
            setUploadStatus({ message: "Please select a file.", type: "error", source: "userUpload" });
            return;
        }
        setUploading(true);
        const formData = new FormData();
        formData.append("file", selectedFile);

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_BACKEND_URL}/api/user/upload-users`,
                formData,
                {
                    headers: { "Content-Type": "multipart/form-data" },
                    onUploadProgress: (progressEvent) => {
                        const progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);
                        setUploadProgress(progress);
                    }
                }
            );
            if (response.data.success) {
                setUploadStatus({ message: response.data.message, type: "success", source: "userUpload" });
                setSelectedFile(null);
                setUploadProgress(0);
                setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 3000);
            } else {
                throw new Error(response.data.message);
            }
        } catch (error) {
            setUploadStatus({
                message: error.response?.data?.message || "Error uploading file. Please try again.",
                type: "error",
                source: "userUpload"
            });
            setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 3000);
        } finally {
            setUploading(false);
        }
    };

    // Framer Motion container variants for transitions
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.5 } }
    };

    // Status badge colors
    const getStatusColor = (status) => {
        switch (status) {
            case "Total":
                return `bg-gray-100 text-gray-700 ${darkMode ? "dark:bg-gray-800 dark:text-gray-300" : ""}`;
            case "Open":
                return `bg-blue-100 text-blue-800 ${darkMode ? "dark:bg-blue-900 dark:text-blue-100" : ""}`;
            case "In Progress":
                return `bg-orange-100 text-orange-800 ${darkMode ? "dark:bg-orange-900 dark:text-orange-100" : ""}`;
            case "Resolved":
                return `bg-green-100 text-green-800 ${darkMode ? "dark:bg-green-900 dark:text-green-100" : ""}`;
            default:
                return `bg-gray-100 text-gray-800 ${darkMode ? "dark:bg-gray-700 dark:text-gray-100" : ""}`;
        }
    };

    const getNumberColor = (status) => {
        switch (status) {
            case "Open":
                return `text-blue-800 ${darkMode ? "dark:bg-blue-900 dark:text-blue-100" : ""}`;
            case "In Progress":
                return `text-orange-800 ${darkMode ? "dark:bg-orange-900 dark:text-orange-100" : ""}`;
            case "Resolved":
                return `text-green-800 ${darkMode ? "dark:bg-green-900 dark:text-green-100" : ""}`;
            default:
                return "";
        }
    };

    // Fetch tickets and issue types on mount
    useEffect(() => {
        const fetchAllTickets = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets`);
                setTickets(response?.data || []);
            } catch (error) {
                console.error("Error fetching tickets:", error);
                setTickets([]);
            }
        };

        const fetchIssueTypes = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/issue-types`);
                setAvailableIssueTypes(response?.data || []);
            } catch (error) {
                console.error("Error fetching issue types:", error);
                setAvailableIssueTypes([]);
            }
        };

        fetchAllTickets();
        fetchIssueTypes();
    }, []);

    const totalTickets = tickets.length;
    const openTickets = tickets.filter((ticket) => ticket.status === "Open").length;
    const inProgressTickets = tickets.filter((ticket) => ticket.status === "In Progress").length;
    const resolvedTickets = tickets.filter((ticket) => ticket.status === "Resolved").length;

    // Fetch tickets based on filters
    const fetchTickets = async () => {
        try {
            let url = `${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets`;
            const params = new URLSearchParams();
            if (issueType) params.append("issue_type", issueType);
            if (filteredStatus) params.append("status", filteredStatus);
            if (params.toString()) url += `?${params.toString()}`;
            const response = await axios.get(url);
            setTickets(response?.data || []);
        } catch (error) {
            console.error("Error fetching tickets:", error);
            setTickets([]);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, [issueType, filteredStatus]);

    const handleStatisticCardClick = (status) => {
        navigate("/admin-dashboard/tickets");
        setFilteredStatus(status);
    };

    const handleResetFilters = () => {
        setIssueType("");
        setSearchQuery("");
        setFilteredStatus(null);
    };

    const closeMenu = () => {
        setIsMenuOpen(false);
    };

    const swipeHandlers = useSwipeable({
        onSwiped: (eventData) => {
            console.log("Swiped!", eventData);
            closeMenu();
        },
        preventDefaultTouchmoveEvent: true,
        trackMouse: false,
    });

    return (
        <div className={`font-raleway font min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"} flex flex-col`}>
            {/* FIXED TOP HEADER */}
            <header
                className={`sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6
                    ${darkMode ? "bg-gray-800" : "bg-white"} shadow`}
            >
                <div className="flex items-center">
                    <h1 className="font-raleway text-2xl sm:text-3xl font-bold mr-2">
                        Dashboard
                    </h1>
                    <IconButton
                        onClick={checkDbConnection}
                        disabled={isCheckingConnection}
                        className={`p-2 rounded-full transition-colors
                        ${isDbConnected ? "text-green-500 hover:text-green-600" : "text-red-500 hover:text-red-600"}
                        ${darkMode ? "text-white" : "text-gray-700"}`}
                        title={isDbConnected ? "Database Connected" : "Connect to Database"}
                        aria-label={isDbConnected ? "Database Connected" : "Connect to Database"}
                    >
                        <FaSync
                            style={{ fontSize: "16px" }}
                            className={`${isCheckingConnection ? " animate-pulse" : ""}
                          ${darkMode ? "text-white hover:text-green-300" : "text-gray-700 hover:text-green-800"}`}
                        />
                    </IconButton>
                    {uploadStatus.message && uploadStatus.source === "db" && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className={`ml-2 flex items-center px-3 py-1 rounded-md text-sm font-medium
                         ${uploadStatus.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                        >
                            {uploadStatus.type === "success" ? <FaCheckCircle className="mr-2" /> : <FaExclamationCircle className="mr-2" />}
                            {uploadStatus.message}
                        </motion.div>
                    )}
                </div>

                {/* DESKTOP NAVIGATION */}
                <div className="hidden sm:flex items-center space-x-4">
                    <Link
                        to="/admin-dashboard"
                        onClick={handleHomeButtonClick}
                        ref={homeButtonRef}
                        className={`px-3 py-1 rounded-lg transition font-raleway
                        ${darkMode
                                ? activeTab === "dashboardHome"
                                    ? "bg-gray-700 text-white"
                                    : "text-gray-300 hover:bg-gray-700"
                                : activeTab === "dashboardHome"
                                    ? "bg-gray-200 text-gray-900"
                                    : "text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        <FaHome className="inline mr-1" />
                        Home
                    </Link>
                    <Link
                        to="/admin-dashboard/tickets"
                        className={`px-3 py-1 rounded-lg transition font-raleway
                        ${darkMode
                                ? activeTab === "tickets"
                                    ? "bg-gray-700 text-white"
                                    : "text-gray-300 hover:bg-gray-700"
                                : activeTab === "tickets"
                                    ? "bg-gray-200 text-gray-900"
                                    : "text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        <FaListAlt className="inline mr-1" />
                        Lists
                    </Link>
                    <Link
                        to="/admin-dashboard/addUser"
                        className={`px-3 py-1 rounded-lg transition font-raleway
                        ${darkMode
                                ? activeTab === "upload"
                                    ? "bg-gray-700 text-white"
                                    : "text-gray-300 hover:bg-gray-700"
                                : activeTab === "upload"
                                    ? "bg-gray-200 text-gray-900"
                                    : "text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        <FaUserPlus className="inline mr-1" />
                        Add User
                    </Link>
                    <Link
                        to="/admin-dashboard/ticketForm"
                        className={`px-3 py-1 rounded-lg transition font-raleway
                        ${darkMode
                                ? activeTab === "ticketForm"
                                    ? "bg-gray-700 text-white"
                                    : "text-gray-300 hover:bg-gray-700"
                                : activeTab === "ticketForm"
                                    ? "bg-gray-200 text-gray-900"
                                    : "text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        <FaTicketAlt className="inline mr-1" />
                        Ticket+
                    </Link>
                    <div className="flex items-center">
                        {darkMode ? <MdLightMode className="mr-2 h-5 w-5 text-gray-300" /> : <MdDarkMode className="mr-2 h-5 w-5 text-gray-700" />}
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} />
                            <div
                                className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300
                                  dark:peer-focus:ring-blue-800 rounded-full dark:bg-gray-700
                                  peer-checked:after:translate-x-full peer-checked:after:border-white
                                  after:absolute after:top-[2px] after:left-[2px] after:bg-white
                                  after:border-gray-300 after:border after:rounded-full
                                  after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}
                            />
                        </label>
                    </div>
                    <button
                        onClick={handleLogout}
                        className={`px-3 py-1 rounded-lg transition font-raleway flex items-center
                        ${darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"}
                        text-white`}
                    >
                        <FaSignOutAlt className="mr-1" />
                        Logout
                    </button>
                </div>

                {/* MOBILE: Hamburger Button */}
                <button
                    onClick={() => setIsMenuOpen(true)}
                    className="sm:hidden flex items-center text-gray-500 hover:text-gray-700 focus:outline-none"
                >
                    <FaBars className="h-6 w-6" />
                </button>
            </header>

            {/* MOBILE MENU OVERLAY WITH GLASSMORPHISM */}
            {isMenuOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black bg-opacity-40 z-40"
                        onClick={() => setIsMenuOpen(false)}
                    />
                    {/* Slide-Out Menu */}
                    {isTouchDevice ? (
                        <div {...swipeHandlers} >
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`fixed top-0 right-0 h-full w-3/4 max-w-xs z-50
                            bg-white/30 dark:bg-gray-800/30
                            backdrop-blur-md border-l border-white/40 dark:border-gray-700/40
                            shadow-xl`}
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => setIsMenuOpen(false)}
                                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 focus:outline-none"
                                >
                                    <FaTimes className="h-6 w-6" />
                                </button>

                                {/* Mobile Navigation Links */}
                                <nav className="mt-16 p-6 space-y-4">
                                    <Link
                                        to="/admin-dashboard"
                                        onClick={() => {
                                            handleHomeButtonClick();
                                            setIsMenuOpen(false);
                                        }}
                                        className={`block px-4 py-3 rounded-lg transition font-raleway
                                ${darkMode
                                                ? activeTab === "dashboardHome"
                                                    ? "bg-gray-700 text-white"
                                                    : "text-gray-300 hover:bg-gray-700"
                                                : activeTab === "dashboardHome"
                                                    ? "bg-gray-200 text-gray-900"
                                                    : "text-gray-100 hover:bg-gray-200"
                                            }`}
                                    >
                                        <FaHome className="inline mr-1" />
                                        Home
                                    </Link>
                                    <Link
                                        to="/admin-dashboard/tickets"
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`block px-4 py-3 rounded-lg transition font-raleway
                                ${darkMode
                                                ? activeTab === "tickets"
                                                    ? "bg-gray-700 text-white"
                                                    : "text-gray-300 hover:bg-gray-700"
                                                : activeTab === "tickets"
                                                    ? "bg-gray-200 text-gray-900"
                                                    : "text-gray-100 hover:bg-gray-200"
                                            }`}
                                    >
                                        <FaListAlt className="inline mr-1" />
                                        Lists
                                    </Link>
                                    <Link
                                        to="/admin-dashboard/addUser"
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`block px-4 py-3 rounded-lg transition font-raleway
                                ${darkMode
                                                ? activeTab === "upload"
                                                    ? "bg-gray-700 text-white"
                                                    : "text-gray-300 hover:bg-gray-700"
                                                : activeTab === "upload"
                                                    ? "bg-gray-200 text-gray-900"
                                                    : "text-gray-100 hover:bg-gray-200"
                                            }`}
                                    >
                                        <FaUserPlus className="inline mr-1" />
                                        Add User
                                    </Link>
                                    <Link
                                        to="/admin-dashboard/ticketForm"
                                        onClick={() => setIsMenuOpen(false)}
                                        className={`block px-4 py-3 rounded-lg transition font-raleway
                                ${darkMode
                                                ? activeTab === "ticketForm"
                                                    ? "bg-gray-700 text-white"
                                                    : "text-gray-300 hover:bg-gray-700"
                                                : activeTab === "ticketForm"
                                                    ? "bg-gray-200 text-gray-900"
                                                    : "text-gray-100 hover:bg-gray-200"
                                            }`}
                                    >
                                        <FaTicketAlt className="inline mr-1" />
                                        Ticket+
                                    </Link>

                                    {/* Dark Mode Toggle (mobile) */}
                                    <div className="flex items-center px-4 py-3 space-x-3 rounded-lg transition">
                                        {darkMode ? (
                                            <MdLightMode className="h-5 w-5 text-gray-300" />
                                        ) : (
                                            <MdDarkMode className="h-5 w-5 text-gray-100" />
                                        )}
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} />
                                            <div
                                                className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-100
                                  dark:peer-focus:ring-blue-100 rounded-full dark:bg-gray-700
                                  peer-checked:after:translate-x-full peer-checked:after:border-white
                                  after:absolute after:top-[2px] after:left-[2px] after:bg-white
                                  after:border-gray-300 after:border after:rounded-full
                                  after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}
                                            />
                                        </label>
                                    </div>

                                    {/* Logout Button (mobile) */}
                                    <button
                                        onClick={() => {
                                            handleLogout();
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full px-4 py-3 rounded-lg transition font-raleway flex items-center justify-center
                             bg-red-500 text-white hover:bg-red-600"
                                    >
                                        <FaSignOutAlt className="mr-1" />
                                        Logout
                                    </button>
                                </nav>
                            </motion.div>
                        </div>
                    ) : (
                        <motion.div
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className={`fixed top-0 right-0 h-full w-3/4 max-w-xs z-50
                          bg-white/30 dark:bg-gray-800/30
                          backdrop-blur-md border-l border-white/40 dark:border-gray-700/40
                          shadow-xl`}
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setIsMenuOpen(false)}
                                className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100 focus:outline-none"
                            >
                                <FaTimes className="h-6 w-6" />
                            </button>

                            {/* Mobile Navigation Links */}
                            <nav className="mt-16 p-6 space-y-4">
                                <Link
                                    to="/admin-dashboard"
                                    onClick={() => {
                                        handleHomeButtonClick();
                                        setIsMenuOpen(false);
                                    }}
                                    className={`block px-4 py-3 rounded-lg transition font-raleway
                              ${darkMode
                                            ? activeTab === "dashboardHome"
                                                ? "bg-gray-700 text-white"
                                                : "text-gray-300 hover:bg-gray-700"
                                            : activeTab === "dashboardHome"
                                                ? "bg-gray-200 text-gray-900"
                                                : "text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    <FaHome className="inline mr-1" />
                                    Home
                                </Link>
                                <Link
                                    to="/admin-dashboard/tickets"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`block px-4 py-3 rounded-lg transition font-raleway
                              ${darkMode
                                            ? activeTab === "tickets"
                                                ? "bg-gray-700 text-white"
                                                : "text-gray-300 hover:bg-gray-700"
                                            : activeTab === "tickets"
                                                ? "bg-gray-200 text-gray-900"
                                                : "text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    <FaListAlt className="inline mr-1" />
                                    Lists
                                </Link>
                                <Link
                                    to="/admin-dashboard/addUser"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`block px-4 py-3 rounded-lg transition font-raleway
                              ${darkMode
                                            ? activeTab === "upload"
                                                ? "bg-gray-700 text-white"
                                                : "text-gray-300 hover:bg-gray-700"
                                            : activeTab === "upload"
                                                ? "bg-gray-200 text-gray-900"
                                                : "text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    <FaUserPlus className="inline mr-1" />
                                    Add User
                                </Link>
                                <Link
                                    to="/admin-dashboard/ticketForm"
                                    onClick={() => setIsMenuOpen(false)}
                                    className={`block px-4 py-3 rounded-lg transition font-raleway
                              ${darkMode
                                            ? activeTab === "ticketForm"
                                                ? "bg-gray-700 text-white"
                                                : "text-gray-300 hover:bg-gray-700"
                                            : activeTab === "ticketForm"
                                                ? "bg-gray-200 text-gray-900"
                                                : "text-gray-700 hover:bg-gray-200"
                                        }`}
                                >
                                    <FaTicketAlt className="inline mr-1" />
                                    Ticket+
                                </Link>

                                {/* Dark Mode Toggle (mobile) */}
                                <div className="flex items-center px-4 py-3 space-x-3 rounded-lg transition">
                                    {darkMode ? (
                                        <MdLightMode className="h-5 w-5 text-gray-300" />
                                    ) : (
                                        <MdDarkMode className="h-5 w-5 text-gray-700" />
                                    )}
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} />
                                        <div
                                            className={`w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300
                                dark:peer-focus:ring-blue-800 rounded-full dark:bg-gray-700
                                peer-checked:after:translate-x-full peer-checked:after:border-white
                                after:absolute after:top-[2px] after:left-[2px] after:bg-white
                                after:border-gray-300 after:border after:rounded-full
                                after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600`}
                                        />
                                    </label>
                                </div>

                                {/* Logout Button (mobile) */}
                                <button
                                    onClick={() => {
                                        handleLogout();
                                        setIsMenuOpen(false);
                                    }}
                                    className="w-full px-4 py-3 rounded-lg transition font-raleway flex items-center justify-center
                             bg-red-500 text-white hover:bg-red-600"
                                >
                                    <FaSignOutAlt className="mr-1" />
                                    Logout
                                </button>
                            </nav>
                        </motion.div>
                    )}
                </>
            )}

            {/* FIXED FILTER SECTION */}
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className={`fixed top-16 z-20 w-full left-0 px-4 sm:px-6 py-3
                    flex items-center gap-2 flex-nowrap
                    rounded-b-lg shadow-lg
                    ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`}
            >
                <input
                    type="text"
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`flex-1 min-w-0 px-2 py-2 border rounded-lg
                      focus:ring-2 focus:ring-blue-500 text-sm
                      ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900"}`}
                />
                <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className={`flex-none px-2 py-2 border rounded-lg
                      focus:ring-2 focus:ring-blue-500 text-sm
                      ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900"}`}
                >
                    <option value="">All Issues</option>
                    {availableIssueTypes.map((type) => (
                        <option key={type} value={type}>
                            {type}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleResetFilters}
                    className={`flex-none px-3 py-2 rounded-lg
                      transition-colors text-sm
                      ${darkMode ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-gray-500 text-white hover:bg-gray-600"}`}
                >
                    Reset
                </button>
            </motion.div>

            {/* MAIN CONTENT */}
            <main className="pt-28 px-4 sm:px-6 flex-1 overflow-y-auto">
                {location.pathname === "/admin-dashboard" && (
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8"
                    >
                        <div className={`rounded-2xl font-raleway p-4 flex flex-col items-start ${darkMode ? "text-white" : "text-gray-700"}`}>
                            <div className="text-lg font-semibold mb-1">
                                Total Tickets <FaTicketAlt className="inline ml-1" />
                            </div>
                            <div className="text-4xl font-bold">{totalTickets}</div>
                        </div>
                        <div
                            onClick={() => handleStatisticCardClick("Open")}
                            className={`rounded-2xl font-raleway shadow-md p-4 flex flex-col items-start ${getStatusColor("Open")} cursor-pointer`}
                        >
                            <div className="text-lg font-semibold mb-1">
                                Open <FaEnvelopeOpenText className="inline ml-1 animate-pulse" />
                            </div>
                            <div className={`text-4xl font-bold ${getNumberColor("Open")}`}>{openTickets}</div>
                        </div>
                        <div
                            onClick={() => handleStatisticCardClick("In Progress")}
                            className={`rounded-2xl font-raleway shadow-md p-4 flex flex-col items-start ${getStatusColor("In Progress")} cursor-pointer`}
                        >
                            <div className="text-lg font-semibold mb-1">
                                In Progress <FaCircleNotch className="inline ml-1 animate-spin" />
                            </div>
                            <div className={`text-4xl font-bold ${getNumberColor("In Progress")}`}>{inProgressTickets}</div>
                        </div>
                        <div
                            onClick={() => handleStatisticCardClick("Resolved")}
                            className={`rounded-2xl font-raleway shadow-md p-4 flex flex-col items-start ${getStatusColor("Resolved")} cursor-pointer`}
                        >
                            <div className="text-lg font-semibold mb-1">
                                Resolved <FaThumbsUp className="inline ml-1 animate-bounce" />
                            </div>
                            <div className={`text-4xl font-bold ${getNumberColor("Resolved")}`}>{resolvedTickets}</div>
                        </div>
                    </motion.div>
                )}

                {location.pathname.includes("/admin-dashboard/tickets") && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="overflow-auto">
                        <TicketList darkMode={darkMode} searchQuery={searchQuery} issueType={issueType} status={filteredStatus} setUploadStatus={setUploadStatus} />
                    </motion.div>
                )}
                {location.pathname.includes("/admin-dashboard/addUser") && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="overflow-auto">
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
                {location.pathname.includes("/admin-dashboard/ticketForm") && (
                    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="overflow-auto">
                        <TicketForm darkMode={darkMode} />
                    </motion.div>
                )}
            </main>
        </div>
    );
};

AdminDashboard.propTypes = {
    navigate: PropTypes.func,
    uploadStatus: PropTypes.shape({
        message: PropTypes.string,
        type: PropTypes.string
    }),
    darkMode: PropTypes.bool,
    location: PropTypes.object,
    isMenuOpen: PropTypes.bool,
    activeTab: PropTypes.string,
    tickets: PropTypes.array,
    selectedFile: PropTypes.object,
    uploading: PropTypes.bool,
    uploadProgress: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    filteredStatus: PropTypes.string,
    handleLogout: PropTypes.func,
    toggleDarkMode: PropTypes.func,
    handleFileChange: PropTypes.func,
    handleClearFile: PropTypes.func,
    handleUpload: PropTypes.func,
    getStatusColor: PropTypes.func,
    getNumberColor: PropTypes.func,
    homeButtonRef: PropTypes.oneOfType([
        PropTypes.func,
        PropTypes.shape({ current: PropTypes.instanceOf(Element) })
    ]),
    searchQuery: PropTypes.string,
    issueType: PropTypes.string,
    totalTickets: PropTypes.number,
    openTickets: PropTypes.number,
    inProgressTickets: PropTypes.number,
    resolvedTickets: PropTypes.number,
    isDbConnected: PropTypes.bool,
    isCheckingConnection: PropTypes.bool,
    availableIssueTypes: PropTypes.arrayOf(PropTypes.string),
    setUploadStatus: PropTypes.func
};

export default AdminDashboard;



