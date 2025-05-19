/* eslint-disable no-unused-vars */
// frontend/src/layouts/AdminDashboardLayout.jsx
import { useState, useEffect, useRef, Suspense, useMemo, Fragment, useCallback } from "react";
import { useNavigate, NavLink, useLocation, Outlet, useOutletContext } from "react-router-dom";
import PropTypes from "prop-types";
import { motion, AnimatePresence } from "framer-motion";
import {
    // FaCheckCircle, // Will use MdCheckCircle
    FaTimesCircle, FaExclamationTriangle,
    FaBars, FaTimes, FaHome, FaTicketAlt, FaSignOutAlt, FaCircleNotch,
    FaListAlt, FaUserPlus, FaSync, FaCog, FaChartBar,
    FaCheckCircle
} from "react-icons/fa";
// --- UPDATED ICON IMPORTS ---
import {
    MdDarkMode, MdLightMode,
    MdCloudSync,              // For API Loading/Connecting
    MdCheckCircle,            // For API OK/Connected
    MdError                   // For API Error
} from "react-icons/md";
// --- END UPDATED ICON IMPORTS ---
import {
    ThemeProvider, createTheme, CssBaseline, Typography, Alert, IconButton,
    CircularProgress, Box, Tooltip, Snackbar
} from "@mui/material";
import { useSwipeable } from 'react-swipeable';
import axiosInstance from "../api/axiosInstance";
import { supabase } from '../config/supabaseClient';

const OutletLoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
        <Typography sx={{ ml: 2 }}>Loading View...</Typography>
    </Box>
);

const AdminDashboardLayout = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [uploadStatus, setUploadStatus] = useState({ message: "", type: "", source: "" });
    const [darkMode, setDarkMode] = useState(() => { try { return localStorage.getItem('darkMode') === 'true'; } catch { return false; } });
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [tickets, setTickets] = useState([]);
    const [availableIssueTypes, setAvailableIssueTypes] = useState([]);
    const [teamUserMap, setTeamUserMap] = useState(new Map());
    const [filteredStatus, setFilteredStatus] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [issueType, setIssueType] = useState("");
    const [isTouchDevice, setIsTouchDevice] = useState(false);
    const [apiConnectionStatus, setApiConnectionStatus] = useState('loading');
    const [apiErrorMessage, setApiErrorMessage] = useState('');
    const [showApiStatusText, setShowApiStatusText] = useState(true);
    const apiStatusTextTimerRef = useRef(null);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const homeButtonRef = useRef(null);

    const theme = useMemo(() => createTheme({ palette: { mode: darkMode ? 'dark' : 'light' }, typography: { fontFamily: 'Raleway, Arial, sans-serif', button: { textTransform: 'none' } } }), [darkMode]);

    useEffect(() => { if (homeButtonRef.current && location.pathname === '/admin-dashboard') homeButtonRef.current.focus(); }, [location.pathname]);
    useEffect(() => { setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0); }, []);
    useEffect(() => { try { localStorage.setItem('darkMode', darkMode); document.documentElement.classList.toggle('dark', darkMode); } catch (error) { console.error("LS Save Error", error); } }, [darkMode]);

    const fetchData = useCallback(async (isManualRefresh = false) => {
        if (!isManualRefresh) setIsLoadingData(true);
        setApiConnectionStatus('loading');
        if (isManualRefresh) {
            setUploadStatus({ message: "Refreshing data...", type: "info", source: "dataRefresh" });
        }
        setShowApiStatusText(true);
        if (apiStatusTextTimerRef.current) clearTimeout(apiStatusTextTimerRef.current);

        try {
            const [ticketsResponse, typesResponse, usersResponse] = await Promise.all([
                axiosInstance.get(`/api/admin/tickets`),
                axiosInstance.get(`/api/admin/issue-types`),
                axiosInstance.get(`/api/admin/users/team`)
            ]);

            setTickets(ticketsResponse?.data || []);
            setAvailableIssueTypes(typesResponse?.data || []);

            if (usersResponse.status === 200 && usersResponse.data) {
                const userMap = new Map();
                (usersResponse.data || []).forEach(u => {
                    if (u.id) userMap.set(u.id, { email: u.email || 'N/A', display_name: u.user_metadata?.display_name || null });
                });
                setTeamUserMap(userMap);
            } else {
                setTeamUserMap(new Map());
            }
            setApiConnectionStatus('connected');
            setApiErrorMessage('');
            if (isManualRefresh) {
                setUploadStatus({ message: "Data refreshed!", type: "success", source: "dataRefresh" });
            }
        } catch (error) {
            console.error("Fetch Data Error in Layout:", error);
            const errMsg = error.response?.data?.message || error.message || "Network error or server unavailable.";
            setApiErrorMessage(errMsg);
            setApiConnectionStatus('error');
            if (isManualRefresh) {
                setUploadStatus({ message: `Refresh failed: ${errMsg}`, type: "error", source: "dataRefresh" });
            }
        } finally {
            if (!isManualRefresh) setIsLoadingData(false);
            setShowApiStatusText(true);
            if (apiStatusTextTimerRef.current) {
                clearTimeout(apiStatusTextTimerRef.current);
            }
            apiStatusTextTimerRef.current = setTimeout(() => {
                setShowApiStatusText(false);
            }, 3500);
        }
    }, [setUploadStatus]); // apiStatusTextTimerRef removed as it's a ref

    const handleLogout = useCallback(async () => {
        setUploadStatus({ message: "Logging out...", type: "info", source: "logout" });
        await supabase.auth.signOut();
        setTickets([]); setAvailableIssueTypes([]); setTeamUserMap(new Map());
        setSearchQuery(""); setIssueType(""); setFilteredStatus(null);
        setApiConnectionStatus('loading');
    }, [setUploadStatus]);

    const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), []);
    const handleResetFilters = useCallback(() => { setIssueType(""); setSearchQuery(""); setFilteredStatus(null); }, []);
    const handleHomeButtonClick = useCallback(() => { navigate("/admin-dashboard"); handleResetFilters(); setIsMenuOpen(false); }, [navigate, handleResetFilters]);
    const handleNavigateToTicketsWithFilter = useCallback((status) => { setFilteredStatus(status); navigate("/admin-dashboard/tickets"); setIsMenuOpen(false); }, [navigate]);
    const closeMenu = useCallback(() => setIsMenuOpen(false), []);
    const handleTicketDataChange = useCallback(() => { fetchData(true); }, [fetchData]);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => { // Cleanup timer on unmount
        return () => {
            if (apiStatusTextTimerRef.current) {
                clearTimeout(apiStatusTextTimerRef.current);
            }
        };
    }, []);

    const totalTickets = tickets.length;
    const openTickets = useMemo(() => tickets.filter(t => t.status === "Open").length, [tickets]);
    const inProgressTickets = useMemo(() => tickets.filter(t => t.status === "In Progress").length, [tickets]);
    const resolvedTickets = useMemo(() => tickets.filter(t => t.status === "Resolved").length, [tickets]);
    const nameToDisplay = useMemo(() => user?.user_metadata?.display_name || user?.email, [user]);

    const getNavLinkClass = useCallback(({ isActive }) => {
        let base = "px-3 py-2 rounded-md transition text-sm font-medium flex items-center gap-1.5 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:focus-visible:ring-offset-gray-800 border-transparent focus:border-transparent";
        if (isActive) { return `${base} ${darkMode ? "bg-sky-700 text-white font-semibold shadow-inner" : "bg-sky-100 text-sky-700 font-semibold shadow-sm"} after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[3px] ${darkMode ? 'after:bg-sky-400' : 'after:bg-sky-500'} after:rounded-t-sm`; }
        else { return `${base} ${darkMode ? "text-gray-300 hover:bg-gray-700 hover:text-white" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"}`; }
    }, [darkMode]);

    const getMobileNavLinkClass = useCallback(({ isActive }) => {
        let base = "block px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center gap-2.5 relative text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-sky-500 dark:focus-visible:ring-offset-gray-700 border-transparent focus:border-transparent";
        if (isActive) { return `${base} ${darkMode ? "bg-sky-600 text-white font-semibold" : "bg-sky-100 text-sky-700 font-semibold"} before:content-[''] before:absolute before:top-1/2 before:left-0 before:-translate-y-1/2 before:w-[4px] before:h-3/4 ${darkMode ? 'before:bg-sky-400' : 'before:bg-sky-500'} before:rounded-r-sm`; }
        else { return `${base} ${darkMode ? "text-gray-200 hover:bg-gray-700 hover:text-white" : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"}`; }
    }, [darkMode]);

    const outletContextValue = useMemo(() => ({
        darkMode, teamUserMap, availableIssueTypes, searchQuery, issueType, filteredStatus,
        nameToDisplay, totalTickets, openTickets, inProgressTickets, resolvedTickets,
        setUploadStatus, handleTicketDataChange,
        setSearchQuery, setIssueType, setFilteredStatus, handleNavigateToTicketsWithFilter,
        handleResetFilters
    }), [
        darkMode, teamUserMap, availableIssueTypes, searchQuery, issueType, filteredStatus, nameToDisplay,
        totalTickets, openTickets, inProgressTickets, resolvedTickets,
        setUploadStatus, handleTicketDataChange, setSearchQuery, setIssueType, setFilteredStatus,
        handleNavigateToTicketsWithFilter, handleResetFilters
    ]);

    const swipeHandlers = useSwipeable({ onSwipedRight: closeMenu, preventDefaultTouchmoveEvent: true, trackMouse: false });

    const handleSnackbarClose = (event, reason) => {
        if (reason === 'clickaway') { return; }
        setUploadStatus({ message: "", type: "", source: "" });
    };

    let apiStatusIcon;
    let apiStatusTextContent = "";
    let apiIconColor = darkMode ? theme.palette.grey[400] : theme.palette.grey[600];

    if (apiConnectionStatus === 'loading') {
        // apiStatusIcon = <MdCloudSync className="animate-spin" style={{ fontSize: "18px" }} />;
        apiStatusTextContent = "Connecting...";
        apiIconColor = darkMode ? theme.palette.info.light : theme.palette.info.main;
    } else if (apiConnectionStatus === 'connected') {
        apiStatusIcon = <MdCheckCircle style={{ fontSize: "18px" }} />; // CHANGED ICON
        apiStatusTextContent = "Connected";
        apiIconColor = darkMode ? theme.palette.success.light : theme.palette.success.main;
    } else if (apiConnectionStatus === 'error') {
        apiStatusIcon = <MdError style={{ fontSize: "18px" }} />; // CHANGED ICON
        apiStatusTextContent = "Error";
        apiIconColor = darkMode ? theme.palette.error.light : theme.palette.error.main;
    }


    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            <style>{` header nav a:focus, header nav a.active, header nav a:-moz-focusring { outline: none !important; box-shadow: none !important; border-color: transparent !important; } .fixed nav a:focus, .fixed nav a.active, .fixed nav a:-moz-focusring { outline: none !important; box-shadow: none !important; border-color: transparent !important; } `}</style>

            <div className={`font-raleway min-h-screen flex flex-col`}>
                <header className={`sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 shadow-md border-b ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}>
                    <div className="flex items-center flex-wrap gap-x-3">
                        <h1 className="font-raleway text-2xl sm:text-3xl font-bold">Dashboard</h1>
                        <Tooltip title="Refresh Data">
                            <IconButton onClick={() => fetchData(true)} disabled={apiConnectionStatus === 'loading'} size="small" sx={{ color: darkMode ? theme.palette.grey[300] : theme.palette.grey[700], '&:hover': { bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' } }} >
                                <FaSync className={apiConnectionStatus === 'loading' ? 'animate-spin' : ''} style={{ fontSize: "16px" }} />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title={apiConnectionStatus === 'error' ? apiErrorMessage : apiStatusTextContent} placement="bottom">
                            <Box sx={{ display: 'flex', alignItems: 'center', color: apiIconColor, px: 1.5, py: 0.5, borderRadius: '16px', bgcolor: darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', transition: 'all 0.3s ease' }}>
                                {apiStatusIcon}
                                <AnimatePresence>
                                    {showApiStatusText && (
                                        <motion.span
                                            key="apiStatusText"
                                            initial={{ opacity: 0, width: 0, marginLeft: 0 }}
                                            animate={{ opacity: 1, width: 'auto', marginLeft: '6px' }}
                                            exit={{ opacity: 0, width: 0, marginLeft: 0 }}
                                            transition={{ duration: 0.3 }}
                                            style={{ fontSize: '11px', fontWeight: 500, whiteSpace: 'nowrap' }}
                                        >
                                            {apiStatusTextContent}
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                            </Box>
                        </Tooltip>
                    </div>
                    <div className="hidden sm:flex items-center">
                        <nav className="flex items-center space-x-2">
                            <NavLink to="/admin-dashboard" className={getNavLinkClass} end ref={homeButtonRef} onClick={handleHomeButtonClick}><FaHome /> Home</NavLink>
                            <NavLink to="/admin-dashboard/tickets" className={getNavLinkClass}><FaListAlt /> Lists</NavLink>
                            <NavLink to="/admin-dashboard/addUser" className={getNavLinkClass}><FaUserPlus /> Add User</NavLink>
                            <NavLink to="/admin-dashboard/ticketForm" className={getNavLinkClass}><FaTicketAlt /> Ticket+</NavLink>
                            <NavLink to="/admin-dashboard/reports" className={getNavLinkClass}><FaChartBar /> Reports</NavLink>
                            <NavLink to="/admin-dashboard/settings" className={getNavLinkClass}><FaCog /> Settings</NavLink>
                        </nav>
                        <div className="flex items-center pl-3 border-l border-gray-300 dark:border-gray-600 ml-3">
                            {darkMode ? <MdLightMode className="mr-1.5 h-5 w-5 text-yellow-400" /> : <MdDarkMode className="mr-1.5 h-5 w-5 text-gray-600" />}
                            <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div></label>
                        </div>
                        <button onClick={handleLogout} className={`ml-3 px-4 py-2 rounded-lg transition flex items-center text-sm font-medium gap-1.5 ${darkMode ? "bg-red-600 hover:bg-red-700 text-white shadow-md" : "bg-red-500 hover:bg-red-600 text-white shadow-md"}`}><FaSignOutAlt /> Logout</button>
                    </div>
                    <button onClick={() => setIsMenuOpen(true)} className={`sm:hidden p-2 rounded-md ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`} aria-label="Open menu"><FaBars className="h-6 w-6" /></button>
                </header>

                {isMenuOpen && (<Fragment> <motion.div onClick={closeMenu} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden" aria-hidden="true" /> <div {...(isTouchDevice ? swipeHandlers : {})} className={`fixed top-0 right-0 h-full w-3/4 max-w-xs z-50 sm:hidden transform transition-transform ease-in-out duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}> <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "tween", ease: "easeInOut", duration: 0.3 }} className={`h-full w-full shadow-xl flex flex-col ${darkMode ? 'bg-gray-800/95 border-l border-gray-700/50 text-gray-200' : 'bg-white/95 border-l border-gray-200/50 text-gray-800'} backdrop-blur-md`}> <div className="p-4 flex justify-end"><button onClick={closeMenu} className={`p-2 rounded-md ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`} aria-label="Close menu"><FaTimes className="h-6 w-6" /></button></div> <nav className="flex-grow p-4 space-y-3 overflow-y-auto"> <NavLink to="/admin-dashboard" className={getMobileNavLinkClass} onClick={handleHomeButtonClick} end><FaHome /> Home</NavLink> <NavLink to="/admin-dashboard/tickets" className={getMobileNavLinkClass} onClick={() => { handleNavigateToTicketsWithFilter(null); closeMenu(); }}><FaListAlt /> Lists</NavLink> <NavLink to="/admin-dashboard/addUser" className={getMobileNavLinkClass} onClick={closeMenu}><FaUserPlus /> Add User</NavLink> <NavLink to="/admin-dashboard/ticketForm" className={getMobileNavLinkClass} onClick={closeMenu}><FaTicketAlt /> Ticket+</NavLink> <NavLink to="/admin-dashboard/reports" className={getMobileNavLinkClass} onClick={closeMenu}><FaChartBar /> Reports</NavLink> <NavLink to="/admin-dashboard/settings" className={getMobileNavLinkClass} onClick={closeMenu}><FaCog /> Settings</NavLink> <div className={`flex items-center justify-between px-4 py-3 mt-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}> <span className="flex items-center gap-2 font-medium text-base">{darkMode ? <MdLightMode className="h-5 w-5 text-yellow-400" /> : <MdDarkMode className="h-5 w-5 text-gray-600" />} Mode</span> <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div></label> </div> <button onClick={() => { handleLogout(); closeMenu(); }} className="w-full mt-6 px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-base shadow-md"><FaSignOutAlt /> Logout</button> </nav> </motion.div> </div> </Fragment>)}

                <Snackbar
                    open={!!uploadStatus.message}
                    autoHideDuration={uploadStatus.type === 'error' || uploadStatus.type === 'warning' ? 6000 : 3500}
                    onClose={handleSnackbarClose}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    sx={{ zIndex: 1500 }}
                >
                    <Alert
                        onClose={handleSnackbarClose}
                        severity={uploadStatus.type || 'info'}
                        variant="filled"
                        sx={{ width: '100%', boxShadow: 3 }}
                        iconMapping={{
                            success: <FaCheckCircle fontSize="inherit" />,
                            info: <FaCircleNotch fontSize="inherit" className={uploadStatus.message?.includes("...") || apiConnectionStatus === 'loading' ? "animate-spin" : ""} />,
                            warning: <FaExclamationTriangle fontSize="inherit" />,
                            error: <FaTimesCircle fontSize="inherit" />,
                        }}
                    >
                        {uploadStatus.message}
                    </Alert>
                </Snackbar>

                <main className="pt-6 px-4 sm:px-6 pb-6 flex-1">
                    {isLoadingData && (<OutletLoadingFallback />)}
                    {apiConnectionStatus === 'error' && !isLoadingData && (<Alert severity="error" variant="filled" sx={{ mt: 2, mb: 4 }}> <Typography fontWeight="medium">Failed to Load Dashboard Data</Typography> <Typography variant="body2">{apiErrorMessage || "Please check your connection or try refreshing."}</Typography> </Alert>)}
                    {apiConnectionStatus !== 'error' && !isLoadingData && (
                        <Suspense fallback={<OutletLoadingFallback />}>
                            <Outlet context={outletContextValue} />
                        </Suspense>
                    )}
                </main>
            </div>
        </ThemeProvider>
    );
};

AdminDashboardLayout.propTypes = { user: PropTypes.object };
export default AdminDashboardLayout;
export function useAdminDashboardContext() { return useOutletContext(); }