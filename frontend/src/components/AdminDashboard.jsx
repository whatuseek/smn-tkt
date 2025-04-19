// frontend/src/components/AdminDashboard.jsx

import React, { useState, useEffect, useRef, Suspense, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import {
    FaCheckCircle, FaExclamationCircle, FaBars, FaTimes, FaHome, FaTicketAlt,
    FaSignOutAlt, FaEnvelopeOpenText, FaCircleNotch, FaThumbsUp, FaListAlt, FaUserPlus,
    FaSync // FaSync is imported and used
    // Removed FaCog as Settings are removed
} from "react-icons/fa";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import {
    ThemeProvider, createTheme, CssBaseline, Typography, Alert,
    IconButton // IconButton is imported and used
} from "@mui/material";
import { useSwipeable } from 'react-swipeable';

// Import Components using React.lazy
const TicketList = React.lazy(() => import('./TicketList'));
const UserUpload = React.lazy(() => import('./UserUpload'));
const TicketForm = React.lazy(() => import('./TicketForm'));
// Removed SettingsPage import

// Import the configured Axios instance and Supabase client
import axiosInstance from "../api/axiosInstance";
import { supabase } from '../supabaseClient';

// This component no longer receives userRoles prop
const AdminDashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // --- State Variables ---
    const [uploadStatus, setUploadStatus] = useState({ message: "", type: "", source: "" });
    const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; } });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [filteredStatus, setFilteredStatus] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [issueType, setIssueType] = useState("");
    const [availableIssueTypes, setAvailableIssueTypes] = useState([]);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [apiStatus, setApiStatus] = useState('loading'); // 'loading', 'connected', 'error'
    const [apiError, setApiError] = useState('');
    const [activeTab, setActiveTab] = useState('dashboardHome');
    const [isLoading, setIsLoading] = useState(true); // For initial data fetch

    // Refs
    const homeButtonRef = useRef(null);

    // --- Theme ---
    const theme = useMemo(() => createTheme({
        palette: { mode: darkMode ? 'dark' : 'light' },
        typography: { fontFamily: 'Raleway, Arial, sans-serif', button: { textTransform: 'none' } }
    }), [darkMode]);

    // --- Effects ---
    useEffect(() => { if (homeButtonRef.current) homeButtonRef.current.focus(); }, []);
    useEffect(() => { setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0); }, []);
    useEffect(() => {
        const path = location.pathname;
        if (path.includes("/tickets")) setActiveTab("tickets");
        else if (path.includes("/addUser")) setActiveTab("upload");
        else if (path.includes("/ticketForm")) setActiveTab("ticketForm");
        // Removed Settings tab check
        else setActiveTab("dashboardHome");
    }, [location.pathname]);
    useEffect(() => {
        try { localStorage.setItem('darkMode', darkMode); document.documentElement.classList.toggle('dark', darkMode); }
        catch (error) { console.error("LS Save Error", error); }
    }, [darkMode]);

    // --- Fetch Data Function ---
    const fetchData = async () => {
        setIsLoading(true); setApiStatus('loading'); setApiError('');
        // Don't clear uploadStatus here, let it persist until dismissed
        // setUploadStatus({ message: "", type: "", source: "" });

        try {
            const [ticketsResponse, typesResponse] = await Promise.all([
                axiosInstance.get(`/api/admin/tickets`),
                axiosInstance.get(`/api/admin/issue-types`)
            ]);
            if (ticketsResponse.status === 200 && typesResponse.status === 200) {
                setTickets(ticketsResponse?.data || []);
                setAvailableIssueTypes(typesResponse?.data || []);
                setApiStatus('connected');
            } else { throw new Error(`API Fetch failed`); }
        } catch (error) {
            setApiStatus('error');
            const displayError = error.response?.data?.message || error.message || "Failed to load dashboard data.";
            setApiError(displayError); setTickets([]); setAvailableIssueTypes([]);
            console.error('Error fetching dashboard data:', error);
        } finally { setIsLoading(false); }
    };

    // --- Fetch Data Effect (Runs once on mount) ---
    useEffect(() => {
        fetchData();
    }, []);


    // --- Handlers ---
    const handleLogout = async () => {
        console.log("Attempting logout...");
        setUploadStatus({ message: "Logging out...", type: "info", source: "logout" });
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error("Error logging out:", error);
            setUploadStatus({ message: `Logout failed: ${error.message}`, type: 'error', source: 'logout' });
        } else {
            console.log("Logout successful");
            setTickets([]); setAvailableIssueTypes([]); // Clear state
            // Redirect is handled by App.jsx via ProtectedRoute
        }
    };
    const toggleDarkMode = () => setDarkMode(prevMode => !prevMode);
    const handleHomeButtonClick = () => { navigate("/admin-dashboard"); setFilteredStatus(null); setSearchQuery(''); setIssueType(''); setIsMenuOpen(false); };
    const handleFileChange = (event) => { if (event.target.files && event.target.files.length > 0) { const file = event.target.files[0]; const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']; const allowedExts = ['.csv', '.xlsx']; const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase(); if (!allowedExts.includes(fileExt) || !allowedTypes.includes(file.type)) { setUploadStatus({ message: "Invalid file type (CSV/XLSX only).", type: "error", source: "userUpload" }); setSelectedFile(null); setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 3000); event.target.value = ''; return; } setSelectedFile(file); setUploadStatus({ message: "", type: "", source: "" }); } };
    const handleClearFile = () => { setSelectedFile(null); const fileInput = document.getElementById('file-upload'); if (fileInput) fileInput.value = ''; };
    const handleUpload = async () => { if (!selectedFile) { setUploadStatus({ message: "Please select a file first.", type: "error", source: "userUpload" }); setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 3000); return; } setUploading(true); setUploadProgress(0); setUploadStatus({ message: "Uploading...", type: "info", source: "userUpload" }); const formData = new FormData(); formData.append("file", selectedFile); try { const response = await axiosInstance.post(`/api/user/upload-users`, formData, { headers: { "Content-Type": "multipart/form-data" }, onUploadProgress: (e) => { if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100)); } }); if (response.data.success) { setUploadStatus({ message: response.data.message || "File uploaded successfully!", type: "success", source: "userUpload" }); handleClearFile(); setUploadProgress(0); setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 3000); } else { throw new Error(response.data.message || "Upload failed."); } } catch (error) { console.error("Upload error:", error); setUploadStatus({ message: error.response?.data?.message || error.message || "Upload error occurred.", type: "error", source: "userUpload" }); setUploadProgress(0); setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 5000); } finally { setUploading(false); } };
    const handleStatisticCardClick = (status) => { navigate("/admin-dashboard/tickets"); setFilteredStatus(status); };
    const handleResetFilters = () => { setIssueType(""); setSearchQuery(""); setFilteredStatus(null); };
    const closeMenu = () => setIsMenuOpen(false);
    const swipeHandlers = useSwipeable({ onSwipedRight: closeMenu, preventDefaultTouchmoveEvent: true, trackMouse: false });

    // --- Calculated Values ---
    const totalTickets = tickets.length;
    const openTickets = useMemo(() => tickets.filter((t) => t.status === "Open").length, [tickets]);
    const inProgressTickets = useMemo(() => tickets.filter((t) => t.status === "In Progress").length, [tickets]);
    const resolvedTickets = useMemo(() => tickets.filter((t) => t.status === "Resolved").length, [tickets]);
    const getStatusColor = (status) => { switch (status) { case "Open": return `bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100`; case "In Progress": return `bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100`; case "Resolved": return `bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100`; default: return `bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-100`; } };
    const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

    // --- JSX Return ---
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={`font-raleway min-h-screen flex flex-col`}>
                {/* HEADER */}
                <header className={`sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 shadow border-b ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}>
                    {/* Left Side */}
                    <div className="flex items-center flex-wrap gap-x-2"> {/* Added flex-wrap and gap */}
                        <h1 className="font-raleway text-2xl sm:text-3xl font-bold mr-1">Dashboard</h1>
                        <IconButton onClick={fetchData} className={`p-1 ${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`} title="Refresh Data / API Status" aria-label="Refresh Data / API Status" disabled={isLoading || apiStatus === 'loading'} >
                            <FaSync style={{ fontSize: "16px" }} className={(isLoading || apiStatus === 'loading') ? 'animate-spin' : ''} />
                        </IconButton>
                        {/* Status Badges */}
                        <div className="flex items-center">
                            {(apiStatus === 'loading') && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700'}`}><FaCircleNotch className="animate-spin h-3 w-3 mr-1" /> Connecting...</motion.div>)}
                            {(apiStatus === 'connected' && !isLoading) && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${darkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-700'}`}><FaCheckCircle className="h-3 w-3 mr-1" /> API OK</motion.div>)}
                            {(apiStatus === 'error') && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm cursor-help ${darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-700'}`} title={apiError}><FaExclamationCircle className="h-3 w-3 mr-1" /> API Error</motion.div>)}
                        </div>
                        {/* Upload/Other Status Message */}
                        {uploadStatus.message && (uploadStatus.source === "userUpload" || uploadStatus.source === "ticketForm" || uploadStatus.source === "logout" || uploadStatus.source === "addSupportUser") && (
                            <motion.div key={uploadStatus.message + uploadStatus.source} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className={`flex items-center px-3 py-1 rounded-md text-sm font-medium shadow-sm ${uploadStatus.type === "success" ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100" : uploadStatus.type === "error" ? "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100" : "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100"}`}>
                                {uploadStatus.type === "success" ? <FaCheckCircle className="mr-2 flex-shrink-0" /> : uploadStatus.type === "error" ? <FaExclamationCircle className="mr-2 flex-shrink-0" /> : <FaCircleNotch className="mr-2 flex-shrink-0 animate-spin" />}
                                <span>{uploadStatus.message}</span>
                            </motion.div>
                        )}
                        {/* Role Display Removed */}
                    </div>

                    {/* Right Side (Desktop Navigation) */}
                    <div className="hidden sm:flex items-center space-x-4">
                        <Link to="/admin-dashboard" onClick={handleHomeButtonClick} ref={homeButtonRef} className={`px-3 py-1.5 rounded-lg transition text-sm font-medium flex items-center gap-1 ${darkMode ? (activeTab === "dashboardHome" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white") : (activeTab === "dashboardHome" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}`}><FaHome /> Home</Link>
                        <Link to="/admin-dashboard/tickets" onClick={() => setFilteredStatus(null)} className={`px-3 py-1.5 rounded-lg transition text-sm font-medium flex items-center gap-1 ${darkMode ? (activeTab === "tickets" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white") : (activeTab === "tickets" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}`}><FaListAlt /> Lists</Link>
                        <Link to="/admin-dashboard/addUser" className={`px-3 py-1.5 rounded-lg transition text-sm font-medium flex items-center gap-1 ${darkMode ? (activeTab === "upload" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white") : (activeTab === "upload" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}`}><FaUserPlus /> Add User</Link>
                        <Link to="/admin-dashboard/ticketForm" className={`px-3 py-1.5 rounded-lg transition text-sm font-medium flex items-center gap-1 ${darkMode ? (activeTab === "ticketForm" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white") : (activeTab === "ticketForm" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}`}><FaTicketAlt /> Ticket+</Link>
                        {/* Settings Link Removed */}
                        <div className="flex items-center pl-2 border-l border-gray-300 dark:border-gray-600">{darkMode ? <MdLightMode className="mr-2 h-5 w-5 text-yellow-400" /> : <MdDarkMode className="mr-2 h-5 w-5 text-gray-600" />}<label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div></label></div>
                        <button onClick={handleLogout} className={`px-3 py-1.5 rounded-lg transition flex items-center text-sm font-medium gap-1 ${darkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}><FaSignOutAlt /> Logout</button>
                    </div>
                    <button onClick={() => setIsMenuOpen(true)} className={`sm:hidden p-2 rounded-md ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`} aria-label="Open menu"><FaBars className="h-6 w-6" /></button>
                </header>

                {/* MOBILE MENU OVERLAY */}
                {isMenuOpen && (<> <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden" onClick={closeMenu} aria-hidden="true" /> <div {...(isTouchDevice ? swipeHandlers : {})} className={`fixed top-0 right-0 h-full w-3/4 max-w-xs z-50 sm:hidden transform transition-transform ease-in-out duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}> <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }} className={`h-full w-full shadow-xl flex flex-col ${darkMode ? 'bg-gray-800/90 border-l border-gray-700/50 text-gray-200' : 'bg-white/90 border-l border-gray-200/50 text-gray-800'} backdrop-blur-md`}> <div className="p-4 flex justify-end"><button onClick={closeMenu} className={`p-2 rounded-md ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`} aria-label="Close menu"><FaTimes className="h-6 w-6" /></button></div> <nav className="flex-grow p-6 space-y-4 overflow-y-auto"> <Link to="/admin-dashboard" onClick={() => { handleHomeButtonClick(); closeMenu(); }} className={`block px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center gap-2 ${darkMode ? (activeTab === "dashboardHome" ? "bg-gray-700 text-white" : "hover:bg-gray-700") : (activeTab === "dashboardHome" ? "bg-gray-100 text-gray-900" : "hover:bg-gray-100")}`}> <FaHome /> Home </Link> <Link to="/admin-dashboard/tickets" onClick={() => { setFilteredStatus(null); closeMenu(); }} className={`block px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center gap-2 ${darkMode ? (activeTab === "tickets" ? "bg-gray-700 text-white" : "hover:bg-gray-700") : (activeTab === "tickets" ? "bg-gray-100 text-gray-900" : "hover:bg-gray-100")}`}> <FaListAlt /> Lists </Link> <Link to="/admin-dashboard/addUser" onClick={closeMenu} className={`block px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center gap-2 ${darkMode ? (activeTab === "upload" ? "bg-gray-700 text-white" : "hover:bg-gray-700") : (activeTab === "upload" ? "bg-gray-100 text-gray-900" : "hover:bg-gray-100")}`}> <FaUserPlus /> Add User </Link> <Link to="/admin-dashboard/ticketForm" onClick={closeMenu} className={`block px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center gap-2 ${darkMode ? (activeTab === "ticketForm" ? "bg-gray-700 text-white" : "hover:bg-gray-700") : (activeTab === "ticketForm" ? "bg-gray-100 text-gray-900" : "hover:bg-gray-100")}`}> <FaTicketAlt /> Ticket+ </Link> {/* Settings Link Removed */} <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}><span className="flex items-center gap-2 font-medium">{darkMode ? <MdLightMode className="h-5 w-5 text-yellow-400" /> : <MdDarkMode className="h-5 w-5 text-gray-600" />} Mode</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div></label></div> <button onClick={() => { handleLogout(); closeMenu(); }} className="w-full mt-6 px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"><FaSignOutAlt /> Logout</button> </nav> </motion.div> </div> </>)}

                {/* FIXED FILTER SECTION */}
                <motion.div className={`sticky top-16 z-20 w-full left-0 px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-4 flex-nowrap shadow-lg rounded-b-lg ${darkMode ? "bg-gray-800 text-white border-b border-t border-gray-700" : "bg-white border-b border-t border-gray-200"}`}>
                    <input type="text" placeholder="Search Tickets (ID, User, Addr, Desc)..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`flex-1 min-w-[120px] sm:min-w-[150px] px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "bg-white text-gray-900 border-gray-300 placeholder-gray-500"}`} />
                    <select value={issueType} onChange={(e) => setIssueType(e.target.value)} className={`flex-shrink-0 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}> <option value="">All Issues</option> {availableIssueTypes.map((type) => (<option key={type} value={type.toUpperCase()}>{type}</option>))} </select>
                    <button onClick={handleResetFilters} className={`flex-shrink-0 px-4 py-2 rounded-lg transition-colors text-sm font-medium mr-2 ${darkMode ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-gray-500 text-white hover:bg-gray-600"}`}>Reset</button>
                </motion.div>

                {/* MAIN CONTENT AREA */}
                <main className="pt-6 px-4 sm:px-6 pb-6 flex-1 overflow-y-auto">
                    {/* Loading / Error State */}
                    {(isLoading && apiStatus === 'loading') && (<div className="flex justify-center items-center pt-10 text-gray-500 dark:text-gray-400">
                        <FaCircleNotch className="animate-spin text-2xl mr-3" />Loading Dashboard Data...</div>)}
                    {/* Error Display using MUI Alert */}

                    {apiStatus === 'error' && (
                        <Alert severity="error" variant="filled" sx={{ mt: 2, mb: 4 }}>
                            <Typography fontWeight="medium">Failed to Load Data</Typography>
                            <Typography variant="body2">{apiError}</Typography>
                        </Alert>
                    )}

                    {/* Render main content only if connected and not initial loading */}
                    {apiStatus === 'connected' && !isLoading && (
                        <>
                            {/* Dashboard Home Content (Statistics) */}
                            {location.pathname === "/admin-dashboard" && (
                                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mt-6">
                                    <Typography variant="h5" sx={{ mb: 2, color: darkMode ? 'white' : 'text.primary' }}> Welcome! </Typography>
                                    {/* Statistics Cards Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div className={`rounded-lg shadow p-4 flex flex-col items-start cursor-default transition-colors duration-200 ${darkMode ? "bg-gray-800 text-white border border-gray-700/50" : "bg-white text-gray-800 border border-gray-200"}`}><div className={`text-sm font-medium mb-1 flex items-center gap-1 ${darkMode ? 'text-gray-400' : 'text-gray-800'}`}><FaTicketAlt /> Total Tickets</div><div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{totalTickets}</div></div>
                                        <div onClick={() => handleStatisticCardClick("Open")} className={`rounded-lg shadow p-4 flex flex-col items-start cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] active:brightness-95 ${getStatusColor("Open")}`} title="View Open Tickets"><div className="text-sm font-medium mb-1 flex items-center gap-1">Open <FaEnvelopeOpenText /></div><div className={`text-3xl font-bold ${darkMode ? 'text-blue-300' : 'text-blue-800'}`}>{openTickets}</div></div>
                                        <div onClick={() => handleStatisticCardClick("In Progress")} className={`rounded-lg shadow p-4 flex flex-col items-start cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] active:brightness-95 ${getStatusColor("In Progress")}`} title="View In Progress Tickets"><div className="text-sm font-medium mb-1 flex items-center gap-1">In Progress <FaCircleNotch className="animate-spin" /></div><div className={`text-3xl font-bold ${darkMode ? 'text-orange-300' : 'text-orange-800'}`}>{inProgressTickets}</div></div>
                                        <div onClick={() => handleStatisticCardClick("Resolved")} className={`rounded-lg shadow p-4 flex flex-col items-start cursor-pointer transition-all duration-200 ease-in-out hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] active:brightness-95 ${getStatusColor("Resolved")}`} title="View Resolved Tickets"><div className="text-sm font-medium mb-1 flex items-center gap-1">Resolved <FaThumbsUp /></div><div className={`text-3xl font-bold ${darkMode ? 'text-green-300' : 'text-green-800'}`}>{resolvedTickets}</div></div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Nested Route Content */}
                            {location.pathname !== "/admin-dashboard" && (
                                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mt-6">
                                    <Suspense fallback={<div className="flex justify-center items-center pt-10"><FaCircleNotch className="animate-spin text-xl text-gray-500 dark:text-gray-400" /> Loading View...</div>}>
                                        {location.pathname.includes("/tickets") && <TicketList darkMode={darkMode} searchQuery={searchQuery} issueType={issueType} status={filteredStatus} setUploadStatus={setUploadStatus} />}
                                        {location.pathname.includes("/addUser") && <UserUpload darkMode={darkMode} selectedFile={selectedFile} uploading={uploading} uploadProgress={uploadProgress} handleFileChange={handleFileChange} handleClearFile={handleClearFile} handleUpload={handleUpload} setUploadStatus={setUploadStatus} />}
                                        {location.pathname.includes("/ticketForm") && <TicketForm setUploadStatus={setUploadStatus} />}
                                        {/* SettingsPage route removed */}
                                    </Suspense>
                                </motion.div>
                            )}
                        </>
                    )}
                </main>
            </div>
        </ThemeProvider>
    );
};

// No props are passed from App.jsx anymore
AdminDashboard.propTypes = {
    // PropTypes definition kept minimal as it's a top-level component
    // userRoles: PropTypes.arrayOf(PropTypes.string).isRequired, // Roles are required
    apiStatus: PropTypes.string,
    apiError: PropTypes.string,
    darkMode: PropTypes.bool,
    isMenuOpen: PropTypes.bool,
    activeTab: PropTypes.string,
    tickets: PropTypes.array,
    selectedFile: PropTypes.object,
    uploading: PropTypes.bool,
    uploadProgress: PropTypes.number,
    filteredStatus: PropTypes.string,
    searchQuery: PropTypes.string,
    issueType: PropTypes.string,
    availableIssueTypes: PropTypes.array,
    uploadStatus: PropTypes.shape({ message: PropTypes.string, type: PropTypes.string, source: PropTypes.string }),
    setUploadStatus: PropTypes.func, // Required if child components use it
    homeButtonRef: PropTypes.oneOfType([PropTypes.func, PropTypes.shape({ current: PropTypes.instanceOf(Element) })]),

};

export default AdminDashboard;