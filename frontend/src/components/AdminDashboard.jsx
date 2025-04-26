// frontend/src/components/AdminDashboard.jsx

import React, { useState, useEffect, useRef, Suspense, useMemo, Fragment } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import {
    FaCheckCircle, FaExclamationCircle, FaBars, FaTimes, FaHome, FaTicketAlt,
    FaSignOutAlt, FaEnvelopeOpenText, FaCircleNotch, FaThumbsUp, FaListAlt, FaUserPlus,
    FaSync
} from "react-icons/fa";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import {
    ThemeProvider, createTheme, CssBaseline, Typography, Alert,
    IconButton, CircularProgress
} from "@mui/material";
import { useSwipeable } from 'react-swipeable';

// Import Components using React.lazy
// Assuming TicketList fetches its own data based on user's previous working code
const TicketList = React.lazy(() => import('./TicketList'));
const UserUpload = React.lazy(() => import('./UserUpload'));
const TicketForm = React.lazy(() => import('./TicketForm'));

//--- API/Supabase --- Import the configured Axios instance and Supabase client
import axiosInstance from "../api/axiosInstance";
import { supabase } from '../supabaseClient';

// Accept `user` prop from App.jsx
const AdminDashboard = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // --- State Variables ---
    const [uploadStatus, setUploadStatus] = useState({ message: "", type: "", source: "" });
    const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; } });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // Tickets state might be less critical here if TicketList fetches its own, but useful for counts
    const [tickets, setTickets] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [filteredStatus, setFilteredStatus] = useState(null); // Filter state passed to TicketList
    const [searchQuery, setSearchQuery] = useState(""); // Filter state passed to TicketList
    const [issueType, setIssueType] = useState(""); // Filter state passed to TicketList
    const [availableIssueTypes, setAvailableIssueTypes] = useState([]);
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [apiStatus, setApiStatus] = useState('loading');
    const [apiError, setApiError] = useState('');
    const [activeTab, setActiveTab] = useState('dashboardHome');
    const [isLoadingTickets, setIsLoadingTickets] = useState(true); // Separate loading for ticket counts/stats
    const [teamUserMap, setTeamUserMap] = useState(new Map());
    const [isLoadingUsers, setIsLoadingUsers] = useState(true); // Loading for user map

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
        else setActiveTab("dashboardHome");
    }, [location.pathname]);
    useEffect(() => {
        try { localStorage.setItem('darkMode', darkMode); document.documentElement.classList.toggle('dark', darkMode); }
        catch (error) { console.error("LS Save Error", error); }
    }, [darkMode]);

    // --- Combined Fetch Data Function ---
    const fetchData = async () => {
        // Reset states before fetching
        setIsLoadingTickets(true);
        setIsLoadingUsers(true);
        setApiStatus('loading');
        setApiError('');
        try {
            // Fetch all data concurrently
            const [ticketsResponse, typesResponse, usersResponse] = await Promise.all([
                // Still fetch tickets here for counts, even if TicketList fetches again
                axiosInstance.get(`/api/admin/tickets`),
                axiosInstance.get(`/api/admin/issue-types`),
                axiosInstance.get(`/api/admin/users/team`) // Fetch users for the map
            ]);

            // Process tickets response (for counts)
            if (ticketsResponse.status === 200) {
                 setTickets(ticketsResponse?.data || []);
             } else {
                 setTickets([]); console.warn("Failed tickets fetch for counts");
             }
             setIsLoadingTickets(false); // Tickets (for counts) loading done

            // Process issue types response
            if (typesResponse.status === 200) {
                setAvailableIssueTypes(typesResponse?.data || []);
            } else {
                 setAvailableIssueTypes([]); console.warn("Failed types fetch");
             }

            // Process users response to build the map
            if (usersResponse.status === 200 && usersResponse.data) {
                const userMap = new Map();
                (usersResponse.data || []).forEach(u => {
                    if (u.id) {
                         userMap.set(u.id, {
                             email: u.email || 'N/A',
                             // Use the display_name received from the backend
                             display_name: u.display_name || null
                         });
                    } else {
                        console.warn("User found without ID in users/team response:", u)
                    }
                });
                setTeamUserMap(userMap); // Update state with the new map
                console.log("Team User Map updated/created.");
            } else {
                console.warn("Failed users fetch or no users found (Status: " + usersResponse.status + ").");
                setTeamUserMap(new Map()); // Ensure map is reset if fetch fails
            }
            setIsLoadingUsers(false); // Users loading done

            // Set overall API status based on success of all fetches
            if (ticketsResponse.status === 200 && typesResponse.status === 200 && usersResponse.status === 200) {
                setApiStatus('connected');
            } else {
                 const errorMsg = "Failed to load some dashboard data.";
                 setApiError(errorMsg);
                 setApiStatus('error');
                 console.error(errorMsg, { ticketsStatus: ticketsResponse.status, typesStatus: typesResponse.status, usersStatus: usersResponse.status });
            }
        } catch (error) {
            console.error("[AdminDashboard] Error in fetchData:", error);
            const errorMsg = error.response?.data?.message || error.message || "Failed to load dashboard data.";
            setApiError(errorMsg);
            setApiStatus('error');
            // Reset all relevant states on error
            setTickets([]);
            setAvailableIssueTypes([]);
            setTeamUserMap(new Map());
            setIsLoadingUsers(false);
            setIsLoadingTickets(false); // Ensure both loading flags are false
        }
    };

    // --- Fetch Data Effect (Runs once on mount) ---
    useEffect(() => {
        fetchData();
    }, []); // Empty array ensures it runs only once

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
            setTickets([]); setAvailableIssueTypes([]); setTeamUserMap(new Map()); // Clear state
            // App.jsx handles redirect via ProtectedRoute check
        }
    };

    const toggleDarkMode = () => setDarkMode(prevMode => !prevMode);

    const handleHomeButtonClick = () => {
        navigate("/admin-dashboard");
        // Reset filters when going home
        setFilteredStatus(null);
        setSearchQuery('');
        setIssueType('');
        setIsMenuOpen(false); // Close menu if open
    };

    const handleFileChange = (event) => {
         if (event.target.files && event.target.files.length > 0) {
             const file = event.target.files[0];
             const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
             const allowedExts = ['.csv', '.xlsx'];
             const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
             if (!allowedExts.includes(fileExt) || !allowedTypes.includes(file.type)) {
                 setUploadStatus({ message: "Invalid file type (CSV/XLSX only).", type: "error", source: "userUpload" });
                 setSelectedFile(null);
                 setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 3000);
                 event.target.value = ''; // Clear the file input
                 return;
             }
             setSelectedFile(file);
             setUploadStatus({ message: "", type: "", source: "" }); // Clear any previous status
         }
     };

    const handleClearFile = () => {
        setSelectedFile(null);
        const fileInput = document.getElementById('file-upload');
        if (fileInput) fileInput.value = ''; // Reset file input visually
    };

    const handleUpload = async () => {
        if (!selectedFile) {
             setUploadStatus({ message: "Please select a file first.", type: "error", source: "userUpload" });
             setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 3000);
             return;
        }
        setUploading(true); setUploadProgress(0);
        setUploadStatus({ message: "Uploading...", type: "info", source: "userUpload" });
        const formData = new FormData();
        formData.append("file", selectedFile);
        try {
             const response = await axiosInstance.post(`/api/user/upload-users`, formData, {
                 headers: { "Content-Type": "multipart/form-data" },
                 onUploadProgress: (e) => { if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100)); }
             });
             if (response.data.success) {
                 setUploadStatus({ message: response.data.message || "File uploaded successfully!", type: "success", source: "userUpload" });
                 handleClearFile(); // Clear file input on success
                 setUploadProgress(0);
                 setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 3000);
                 // Optionally re-fetch data if upload affects lists, etc.
                 // fetchData();
             } else {
                 throw new Error(response.data.message || "Upload failed.");
             }
        } catch (error) {
             console.error("Upload error:", error);
             setUploadStatus({ message: error.response?.data?.message || error.message || "Upload error occurred.", type: "error", source: "userUpload" });
             setUploadProgress(0);
             setTimeout(() => setUploadStatus({ message: "", type: "", source: "" }), 5000);
        } finally {
             setUploading(false);
        }
     };

    const handleStatisticCardClick = (status) => {
        navigate("/admin-dashboard/tickets");
        setFilteredStatus(status); // Set filter for TicketList view
    };

    const handleResetFilters = () => {
        setIssueType("");
        setSearchQuery("");
        setFilteredStatus(null);
    };

    const closeMenu = () => setIsMenuOpen(false);
    const swipeHandlers = useSwipeable({ onSwipedRight: closeMenu, preventDefaultTouchmoveEvent: true, trackMouse: false });

    // Callback for TicketList to trigger refresh of counts/data
    const handleTicketDataChange = () => {
        console.log("AdminDashboard: Refreshing data triggered by TicketList change.");
        fetchData();
    };

    // --- Calculated Values & Helpers ---
    const totalTickets = tickets.length; // Based on tickets state fetched here
    const openTickets = useMemo(() => tickets.filter((t) => t.status === "Open").length, [tickets]);
    const inProgressTickets = useMemo(() => tickets.filter((t) => t.status === "In Progress").length, [tickets]);
    const resolvedTickets = useMemo(() => tickets.filter((t) => t.status === "Resolved").length, [tickets]);

    const getStatusColor = (status) => { /* ... (same as before) ... */ switch (status) { case "Open": return `bg-blue-300 text-blue-900 dark:bg-blue-800 dark:text-blue-100`; case "In Progress": return `bg-amber-300 text-amber-900 dark:bg-amber-800 dark:text-amber-100`; case "Resolved": return `bg-green-300 text-green-900 dark:bg-green-800 dark:text-green-100`; default: return `bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`; } };
    const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } };

    // --- Determine the name to display for Welcome message ---
    const displayName = user?.user_metadata?.display_name; // From session user prop
    const userEmail = user?.email;
    const nameToDisplay = displayName || userEmail; // Prioritize display name

    // --- JSX Return ---
    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <div className={`font-raleway min-h-screen flex flex-col`}>
                {/* HEADER */}
                <header className={`sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 shadow border-b ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}>
                    {/* Left Side */}
                    <div className="flex items-center flex-wrap gap-x-2">
                        <h1 className="font-raleway text-2xl sm:text-3xl font-bold mr-1">Dashboard</h1>
                        {/* Refresh Button */}
                        <IconButton
                            onClick={fetchData}
                            className={`p-1 ${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`}
                            title="Refresh Data / API Status"
                            aria-label="Refresh Data / API Status"
                            disabled={isLoadingTickets || isLoadingUsers || apiStatus === 'loading'} // Disable if any loading
                        >
                            <FaSync style={{ fontSize: "16px" }} className={(isLoadingTickets || isLoadingUsers || apiStatus === 'loading') ? 'animate-spin' : ''} />
                        </IconButton>
                        {/* Status Badges */}
                        <div className="flex items-center">
                            {(apiStatus === 'loading') && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700'}`}><FaCircleNotch className="animate-spin h-3 w-3 mr-1" /> Connecting...</motion.div>)}
                            {(apiStatus === 'connected' && !isLoadingTickets && !isLoadingUsers) && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${darkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-700'}`}><FaCheckCircle className="h-3 w-3 mr-1" /> API OK</motion.div>)}
                            {(apiStatus === 'error') && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={`flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm cursor-help ${darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-700'}`} title={apiError}><FaExclamationCircle className="h-3 w-3 mr-1" /> API Error</motion.div>)}
                        </div>
                        {/* Upload/Other Status Message Display */}
                        {uploadStatus.message && (uploadStatus.source?.startsWith("ticket") || uploadStatus.source === "userUpload" || uploadStatus.source === "logout") && (<motion.div key={uploadStatus.message + uploadStatus.source} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className={`flex items-center px-3 py-1 rounded-md text-sm font-medium shadow-sm ${uploadStatus.type === "success" ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100" : uploadStatus.type === "error" ? "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100" : "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100"}`}> {uploadStatus.type === "success" ? <FaCheckCircle className="mr-2 flex-shrink-0" /> : uploadStatus.type === "error" ? <FaExclamationCircle className="mr-2 flex-shrink-0" /> : <FaCircleNotch className="mr-2 flex-shrink-0 animate-spin" />} <span>{uploadStatus.message}</span> </motion.div>)}
                    </div>

                    {/* Right Side (Desktop Nav) */}
                    <div className="hidden sm:flex items-center space-x-4">
                        <Link to="/admin-dashboard" onClick={handleHomeButtonClick} ref={homeButtonRef} className={`px-3 py-1.5 rounded-lg transition text-sm font-medium flex items-center gap-1 ${darkMode ? (activeTab === "dashboardHome" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white") : (activeTab === "dashboardHome" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}`}><FaHome /> Home</Link>
                        <Link to="/admin-dashboard/tickets" onClick={() => setFilteredStatus(null)} className={`px-3 py-1.5 rounded-lg transition text-sm font-medium flex items-center gap-1 ${darkMode ? (activeTab === "tickets" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white") : (activeTab === "tickets" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}`}><FaListAlt /> Lists</Link>
                        <Link to="/admin-dashboard/addUser" className={`px-3 py-1.5 rounded-lg transition text-sm font-medium flex items-center gap-1 ${darkMode ? (activeTab === "upload" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white") : (activeTab === "upload" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}`}><FaUserPlus /> Add User</Link>
                        <Link to="/admin-dashboard/ticketForm" className={`px-3 py-1.5 rounded-lg transition text-sm font-medium flex items-center gap-1 ${darkMode ? (activeTab === "ticketForm" ? "bg-gray-700 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white") : (activeTab === "ticketForm" ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900")}`}><FaTicketAlt /> Ticket+</Link>
                        {/* Dark Mode Toggle */}
                        <div className="flex items-center pl-2 border-l border-gray-300 dark:border-gray-600">{darkMode ? <MdLightMode className="mr-2 h-5 w-5 text-yellow-400" /> : <MdDarkMode className="mr-2 h-5 w-5 text-gray-600" />}<label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div></label></div>
                        {/* Logout Button */}
                        <button onClick={handleLogout} className={`px-3 py-1.5 rounded-lg transition flex items-center text-sm font-medium gap-1 ${darkMode ? "bg-red-600 hover:bg-red-700 text-white" : "bg-red-500 hover:bg-red-600 text-white"}`}><FaSignOutAlt /> Logout</button>
                    </div>
                    {/* Mobile Menu Button */}
                    <button onClick={() => setIsMenuOpen(true)} className={`sm:hidden p-2 rounded-md ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`} aria-label="Open menu"><FaBars className="h-6 w-6" /></button>
                </header>

                {/* MOBILE MENU OVERLAY */}
                {isMenuOpen && (
                    <Fragment> {/* Use Fragment instead of <> for key prop if needed later */}
                         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden" onClick={closeMenu} aria-hidden="true" />
                         <div {...(isTouchDevice ? swipeHandlers : {})} className={`fixed top-0 right-0 h-full w-3/4 max-w-xs z-50 sm:hidden transform transition-transform ease-in-out duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                             <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }} className={`h-full w-full shadow-xl flex flex-col ${darkMode ? 'bg-gray-800/90 border-l border-gray-700/50 text-gray-200' : 'bg-white/90 border-l border-gray-200/50 text-gray-800'} backdrop-blur-md`}>
                                 <div className="p-4 flex justify-end">
                                     <button onClick={closeMenu} className={`p-2 rounded-md ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`} aria-label="Close menu"><FaTimes className="h-6 w-6" /></button>
                                 </div>
                                 {/* Mobile Nav Links */}
                                 <nav className="flex-grow p-6 space-y-4 overflow-y-auto">
                                     <Link to="/admin-dashboard" onClick={() => { handleHomeButtonClick(); closeMenu(); }} className={`block px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center gap-2 ${darkMode ? (activeTab === "dashboardHome" ? "bg-gray-700 text-white" : "hover:bg-gray-700") : (activeTab === "dashboardHome" ? "bg-gray-100 text-gray-900" : "hover:bg-gray-100")}`}> <FaHome /> Home </Link>
                                     <Link to="/admin-dashboard/tickets" onClick={() => { setFilteredStatus(null); closeMenu(); }} className={`block px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center gap-2 ${darkMode ? (activeTab === "tickets" ? "bg-gray-700 text-white" : "hover:bg-gray-700") : (activeTab === "tickets" ? "bg-gray-100 text-gray-900" : "hover:bg-gray-100")}`}> <FaListAlt /> Lists </Link>
                                     <Link to="/admin-dashboard/addUser" onClick={closeMenu} className={`block px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center gap-2 ${darkMode ? (activeTab === "upload" ? "bg-gray-700 text-white" : "hover:bg-gray-700") : (activeTab === "upload" ? "bg-gray-100 text-gray-900" : "hover:bg-gray-100")}`}> <FaUserPlus /> Add User </Link>
                                     <Link to="/admin-dashboard/ticketForm" onClick={closeMenu} className={`block px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center gap-2 ${darkMode ? (activeTab === "ticketForm" ? "bg-gray-700 text-white" : "hover:bg-gray-700") : (activeTab === "ticketForm" ? "bg-gray-100 text-gray-900" : "hover:bg-gray-100")}`}> <FaTicketAlt /> Ticket+ </Link>
                                     {/* Dark Mode Toggle */}
                                     <div className={`flex items-center justify-between px-4 py-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100/50'}`}><span className="flex items-center gap-2 font-medium">{darkMode ? <MdLightMode className="h-5 w-5 text-yellow-400" /> : <MdDarkMode className="h-5 w-5 text-gray-600" />} Mode</span><label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div></label></div>
                                     {/* Logout Button */}
                                     <button onClick={() => { handleLogout(); closeMenu(); }} className="w-full mt-6 px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"><FaSignOutAlt /> Logout</button>
                                 </nav>
                             </motion.div>
                         </div>
                    </Fragment>
                )}

                {/* FIXED FILTER SECTION */}
                <motion.div className={`sticky top-16 z-20 w-full left-0 px-4 sm:px-6 py-3 flex items-center gap-2 sm:gap-4 flex-nowrap shadow-lg rounded-b-lg ${darkMode ? "bg-gray-800 text-white border-b border-t border-gray-700" : "bg-white border-b border-t border-gray-200"}`}>
                    <input
                         type="text"
                         placeholder="Search Tickets (ID, User, Addr, Desc)..."
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         className={`flex-1 min-w-[120px] sm:min-w-[150px] px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "bg-white text-gray-900 border-gray-300 placeholder-gray-500"}`}
                    />
                    <select
                         value={issueType}
                         onChange={(e) => setIssueType(e.target.value)} // Issue type value is uppercase as needed by backend filter
                         className={`flex-shrink-0 px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer ${darkMode ? "bg-gray-700 text-white border-gray-600" : "bg-white text-gray-900 border-gray-300"}`}
                    >
                         <option value="">All Issues</option>
                         {availableIssueTypes.map((type) => (
                             // Use uppercase value for filtering, display original text
                             <option key={type} value={type.toUpperCase()}>{type}</option>
                         ))}
                     </select>
                    <button
                        onClick={handleResetFilters}
                        className={`flex-shrink-0 px-4 py-2 rounded-lg transition-colors text-sm font-medium mr-2 ${darkMode ? "bg-gray-600 text-white hover:bg-gray-500" : "bg-gray-500 text-white hover:bg-gray-600"}`}
                    >
                        Reset
                    </button>
                </motion.div>

                {/* MAIN CONTENT AREA */}
                <main className="pt-6 px-4 sm:px-6 pb-6 flex-1 overflow-y-auto">
                    {/* Loading / Error State Display */}
                    {(isLoadingTickets || isLoadingUsers) && apiStatus === 'loading' && (
                        <div className="flex justify-center items-center pt-10 text-gray-500 dark:text-gray-400">
                            <FaCircleNotch className="animate-spin text-2xl mr-3" />
                            {isLoadingTickets && isLoadingUsers ? 'Loading Dashboard Data...' : isLoadingTickets ? 'Loading Tickets...' : 'Loading User Info...'}
                        </div>
                    )}
                    {apiStatus === 'error' && !isLoadingTickets && !isLoadingUsers && (
                        <Alert severity="error" variant="filled" sx={{ mt: 2, mb: 4 }}>
                            <Typography fontWeight="medium">Failed to Load Data</Typography>
                            <Typography variant="body2">{apiError}</Typography>
                         </Alert>
                    )}

                    {/* Render main content only if connected and all loading is finished */}
                    {apiStatus === 'connected' && !isLoadingTickets && !isLoadingUsers && (
                        <Fragment>
                            {/* Dashboard Home */}
                            {location.pathname === "/admin-dashboard" && (
                                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mt-6">
                                    {/* Welcome Message */}
                                    <Typography variant="h5" component="h1" sx={{ mb: 2, color: darkMode ? 'white' : 'text.primary' }}>
                                        Welcome{nameToDisplay ? `, ${nameToDisplay}` : ''}! {/* Removed "Mr." prefix for generality */}
                                    </Typography>
                                    {/* Statistics Cards Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
                                        {/* Total Tickets Card */}
                                        <div className={` rounded-lg shadow p-4 flex flex-col items-start cursor-default bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 `}> <div className={`text-sm font-medium mb-1 flex items-center gap-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}> <FaTicketAlt /> Total Tickets </div> <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}> {totalTickets} </div> </div>
                                        {/* Open Tickets Card */}
                                        <div onClick={() => handleStatisticCardClick("Open")} className={` rounded-lg shadow p-4 flex flex-col items-start cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:brightness-95 ${getStatusColor("Open")} border border-transparent `} title="View Open Tickets" > <div className="text-sm font-medium mb-1 flex items-center gap-1"> Open <FaEnvelopeOpenText /> </div> <div className="text-3xl font-bold"> {openTickets} </div> </div>
                                        {/* In Progress Tickets Card */}
                                        <div onClick={() => handleStatisticCardClick("In Progress")} className={` rounded-lg shadow p-4 flex flex-col items-start cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:brightness-95 ${getStatusColor("In Progress")} border border-transparent `} title="View In Progress Tickets" > <div className="text-sm font-medium mb-1 flex items-center gap-1"> In Progress <FaCircleNotch className="animate-spin" /> </div> <div className="text-3xl font-bold"> {inProgressTickets} </div> </div>
                                        {/* Resolved Tickets Card */}
                                        <div onClick={() => handleStatisticCardClick("Resolved")} className={` rounded-lg shadow p-4 flex flex-col items-start cursor-pointer transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] active:brightness-95 ${getStatusColor("Resolved")} border border-transparent `} title="View Resolved Tickets" > <div className="text-sm font-medium mb-1 flex items-center gap-1"> Resolved <FaThumbsUp /> </div> <div className="text-3xl font-bold"> {resolvedTickets} </div> </div>
                                    </div>
                                </motion.div>
                            )}

                            {/* Nested Routes */}
                            {location.pathname !== "/admin-dashboard" && (
                                <motion.div variants={containerVariants} initial="hidden" animate="visible" className="mt-6">
                                    <Suspense fallback={<div className="flex justify-center items-center pt-10"><CircularProgress size={30} /> Loading View...</div>}>
                                        {/* Render TicketList, passing necessary props including updated teamUserMap */}
                                        {location.pathname.includes("/tickets") &&
                                            <TicketList
                                                // Assuming TicketList fetches its own data
                                                darkMode={darkMode}
                                                searchQuery={searchQuery} // Pass filters
                                                issueType={issueType}
                                                status={filteredStatus}
                                                setUploadStatus={setUploadStatus}
                                                onDataChange={handleTicketDataChange} // Callback to refresh dashboard data
                                                teamUserMap={teamUserMap} // Pass the user map
                                            />
                                        }
                                        {location.pathname.includes("/addUser") &&
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
                                        }
                                        {location.pathname.includes("/ticketForm") &&
                                            <TicketForm
                                                setUploadStatus={setUploadStatus}
                                                // Optionally pass onDataChange if form success should refresh lists
                                                // onTicketCreated={handleTicketDataChange}
                                            />
                                        }
                                    </Suspense>
                                </motion.div>
                            )}
                        </Fragment>
                    )}
                </main>
            </div>
        </ThemeProvider>
    );
};

// Define propTypes
AdminDashboard.propTypes = {
    user: PropTypes.object, // User object from Supabase Auth session
    // Removed internal state props from propTypes list
};

export default AdminDashboard;