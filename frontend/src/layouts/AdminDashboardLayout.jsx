// frontend/src/layouts/AdminDashboardLayout.jsx
import { useState, useEffect, useRef, Suspense, useMemo, Fragment, useCallback } from "react";
import { useNavigate, NavLink, useLocation, Outlet, useOutletContext } from "react-router-dom";
import PropTypes from "prop-types";
import { motion } from "framer-motion";
import { FaCheckCircle, FaExclamationCircle, FaBars, FaTimes, FaHome, FaTicketAlt, FaSignOutAlt, FaCircleNotch, FaListAlt, FaUserPlus, FaSync, FaCog, FaChartBar } from "react-icons/fa";
import { MdDarkMode, MdLightMode } from "react-icons/md";
import { ThemeProvider, createTheme, CssBaseline, Typography, Alert, IconButton, CircularProgress, Box } from "@mui/material";
import { useSwipeable } from 'react-swipeable';
import axiosInstance from "../api/axiosInstance";
import { supabase } from '../config/supabaseClient';

const OutletLoadingFallback = () => (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
        <span style={{ marginLeft: '10px' }}>Loading View...</span>
    </Box>
);

const AdminDashboardLayout = ({ user }) => {
    const navigate = useNavigate();
    const location = useLocation();

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
    const [apiStatus, setApiStatus] = useState('loading');
    const [apiError, setApiError] = useState('');
    const [isLoadingTickets, setIsLoadingTickets] = useState(true);
    const [teamUserMap, setTeamUserMap] = useState(new Map());
    const [isLoadingUsers, setIsLoadingUsers] = useState(true);
    const homeButtonRef = useRef(null);

    const theme = useMemo(() => createTheme({ palette: { mode: darkMode ? 'dark' : 'light' }, typography: { fontFamily: 'Raleway, Arial, sans-serif', button: { textTransform: 'none' } } }), [darkMode]);

    useEffect(() => { if (homeButtonRef.current && location.pathname === '/admin-dashboard') homeButtonRef.current.focus(); }, [location.pathname]);
    useEffect(() => { setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0); }, []);
    useEffect(() => { try { localStorage.setItem('darkMode', darkMode); document.documentElement.classList.toggle('dark', darkMode); } catch (error) { console.error("LS Save Error", error); } }, [darkMode]);

    const fetchData = useCallback(async () => { setIsLoadingTickets(true); setIsLoadingUsers(true); setApiStatus('loading'); setApiError(''); try { const [ticketsResponse, typesResponse, usersResponse] = await Promise.all([ axiosInstance.get(`/api/admin/tickets`), axiosInstance.get(`/api/admin/issue-types`), axiosInstance.get(`/api/admin/users/team`) ]); if (ticketsResponse.status === 200) setTickets(ticketsResponse?.data || []); else setTickets([]); setIsLoadingTickets(false); if (typesResponse.status === 200) setAvailableIssueTypes(typesResponse?.data || []); else setAvailableIssueTypes([]); if (usersResponse.status === 200 && usersResponse.data) { const userMap = new Map(); (usersResponse.data || []).forEach(u => { if (u.id) userMap.set(u.id, { email: u.email || 'N/A', display_name: u.display_name || null }); }); setTeamUserMap(userMap); } else { setTeamUserMap(new Map()); } setIsLoadingUsers(false); if (ticketsResponse.status === 200 && typesResponse.status === 200 && usersResponse.status === 200) setApiStatus('connected'); else { const e = "Failed to load some initial data."; setApiError(e); setApiStatus('error'); } } catch (error) { console.error("Fetch Data Error in Layout:", error); setApiError(error.response?.data?.message || error.message || "Network error or server unavailable."); setApiStatus('error'); setTickets([]); setAvailableIssueTypes([]); setTeamUserMap(new Map()); setIsLoadingUsers(false); setIsLoadingTickets(false); } }, []);
    const handleLogout = useCallback(async () => { setUploadStatus({ message: "Logging out...", type: "info", source: "logout" }); await supabase.auth.signOut(); setTickets([]); setAvailableIssueTypes([]); setTeamUserMap(new Map()); setSearchQuery(""); setIssueType(""); setFilteredStatus(null); }, [setUploadStatus]);
    const toggleDarkMode = useCallback(() => setDarkMode(prev => !prev), []);
    const handleResetFilters = useCallback(() => { setIssueType(""); setSearchQuery(""); setFilteredStatus(null); }, []);
    const handleHomeButtonClick = useCallback(() => { navigate("/admin-dashboard"); handleResetFilters(); setIsMenuOpen(false); }, [navigate, handleResetFilters]);
    const handleFileChange = useCallback((event) => { if (event.target.files?.[0]) { const file=event.target.files[0]; const allowedTypes=['text/csv','application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']; const allowedExts=['.csv','.xlsx']; const fileExt=file.name.substring(file.name.lastIndexOf('.')).toLowerCase(); if (!allowedExts.includes(fileExt) || !allowedTypes.includes(file.type)) { setUploadStatus({ message: "Invalid file type. Only CSV/XLSX allowed.", type: "error", source: "userUpload" }); setSelectedFile(null); setTimeout(()=>setUploadStatus(p=>p.source === 'userUpload' ? {...p,message:'', type:''} : p), 3000); event.target.value=''; return; } setSelectedFile(file); setUploadStatus({message:'',type:'',source:''}); } }, [setUploadStatus]);
    const handleClearFile = useCallback(() => { setSelectedFile(null); const fileInput = document.getElementById('file-upload'); if (fileInput) fileInput.value = ''; }, []);
    const handleUpload = useCallback(async () => { if (!selectedFile) { setUploadStatus({ message: "Please select a file to upload.", type: "error", source: "userUpload" }); setTimeout(()=>setUploadStatus(p=>p.source === 'userUpload' ? {...p,message:'', type:''} : p), 3000); return; } setUploading(true); setUploadProgress(0); setUploadStatus({ message: "Uploading file...", type: "info", source: "userUpload" }); const formData = new FormData(); formData.append("file", selectedFile); try { const response = await axiosInstance.post(`/api/user/upload-users`, formData, { headers: { "Content-Type": "multipart/form-data" }, onUploadProgress:(e)=>{if(e.total) setUploadProgress(Math.round((e.loaded/e.total)*100));}}); if (response.data.success) { setUploadStatus({ message: response.data.message || "File uploaded successfully!", type: "success", source: "userUpload" }); handleClearFile(); setUploadProgress(0); setTimeout(()=>setUploadStatus(p=>p.source === 'userUpload' ? {...p,message:'', type:''} : p), 3000); } else { throw new Error(response.data.message || "File upload failed on server."); } } catch (error) { setUploadStatus({ message: error.response?.data?.message || "Error during file upload.", type: "error", source: "userUpload" }); setUploadProgress(0); setTimeout(()=>setUploadStatus(p=>p.source === 'userUpload' ? {...p,message:'', type:''} : p), 5000); } finally { setUploading(false); } }, [selectedFile, handleClearFile, setUploadStatus]);
    const handleNavigateToTicketsWithFilter = useCallback((status) => { setFilteredStatus(status); navigate("/admin-dashboard/tickets"); setIsMenuOpen(false);}, [navigate]);
    const closeMenu = useCallback(() => setIsMenuOpen(false), []);
    const handleTicketDataChange = useCallback(() => { fetchData(); }, [fetchData]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const totalTickets = tickets.length;
    const openTickets = useMemo(() => tickets.filter(t => t.status === "Open").length, [tickets]);
    const inProgressTickets = useMemo(() => tickets.filter(t => t.status === "In Progress").length, [tickets]);
    const resolvedTickets = useMemo(() => tickets.filter(t => t.status === "Resolved").length, [tickets]);
    const nameToDisplay = useMemo(() => user?.user_metadata?.display_name || user?.email, [user]);

    const getNavLinkClass = useCallback(({ isActive }) => {
        let base = "px-3 py-2 rounded-md transition text-sm font-medium flex items-center gap-1.5 relative focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-sky-500 dark:focus-visible:ring-offset-gray-800 border-transparent focus:border-transparent";
        if (isActive) {
            return `${base} ${darkMode
                ? "bg-sky-700 text-white font-semibold shadow-inner"
                : "bg-sky-100 text-sky-700 font-semibold shadow-sm"
                } after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-[3px] ${darkMode ? 'after:bg-sky-400' : 'after:bg-sky-500'} after:rounded-t-sm`;
        } else {
            return `${base} ${darkMode
                ? "text-gray-300 hover:bg-gray-700 hover:text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`;
        }
    }, [darkMode]);

    const getMobileNavLinkClass = useCallback(({ isActive }) => {
        let base = "block px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center gap-2.5 relative text-base focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-sky-500 dark:focus-visible:ring-offset-gray-700 border-transparent focus:border-transparent";
        if (isActive) {
            return `${base} ${darkMode
                ? "bg-sky-600 text-white font-semibold"
                : "bg-sky-100 text-sky-700 font-semibold"
                } before:content-[''] before:absolute before:top-1/2 before:left-0 before:-translate-y-1/2 before:w-[4px] before:h-3/4 ${darkMode ? 'before:bg-sky-400' : 'before:bg-sky-500'} before:rounded-r-sm`;
        } else {
            return `${base} ${darkMode
                ? "text-gray-200 hover:bg-gray-700 hover:text-white"
                : "text-gray-700 hover:bg-gray-200 hover:text-gray-900"
                }`;
        }
    }, [darkMode]);
    
    const outletContextValue = useMemo(() => ({
        darkMode, teamUserMap, availableIssueTypes, searchQuery, issueType, filteredStatus,
        nameToDisplay, totalTickets, openTickets, inProgressTickets, resolvedTickets,
        selectedFile, uploading, uploadProgress, setUploadStatus, handleTicketDataChange,
        setSearchQuery, setIssueType, setFilteredStatus, handleNavigateToTicketsWithFilter,
        handleFileChange, handleClearFile, handleUpload,
        handleResetFilters
    }), [
        darkMode, teamUserMap, availableIssueTypes, searchQuery, issueType, filteredStatus, nameToDisplay,
        totalTickets, openTickets, inProgressTickets, resolvedTickets, selectedFile, uploading, uploadProgress,
        setUploadStatus, handleTicketDataChange, setSearchQuery, setIssueType, setFilteredStatus,
        handleNavigateToTicketsWithFilter, handleFileChange, handleClearFile, handleUpload,
        handleResetFilters
    ]);

    const swipeHandlers = useSwipeable({ onSwipedRight: closeMenu, preventDefaultTouchmoveEvent: true, trackMouse: false });

    return (
        <ThemeProvider theme={theme}>
            <CssBaseline />
            {/* Global style tag to forcefully remove outline/box-shadow on focus/active NavLinks */}
            <style>{`
                header nav a:focus, 
                header nav a.active,
                header nav a:-moz-focusring { /* Firefox specific focus ring */
                    outline: none !important;
                    box-shadow: none !important;
                    border-color: transparent !important; /* Also ensure border is not appearing */
                }
                /* For mobile menu NavLinks */
                .fixed nav a:focus, 
                .fixed nav a.active,
                .fixed nav a:-moz-focusring {
                     outline: none !important;
                     box-shadow: none !important;
                     border-color: transparent !important;
                }
            `}</style>
            <div className={`font-raleway min-h-screen flex flex-col`}>
                <header className={`sticky top-0 z-30 h-16 flex items-center justify-between px-4 sm:px-6 shadow-md border-b ${darkMode ? "bg-gray-800 text-white border-gray-700" : "bg-white text-gray-900 border-gray-200"}`}>
                    <div className="flex items-center flex-wrap gap-x-2">
                         <h1 className="font-raleway text-2xl sm:text-3xl font-bold mr-1">Dashboard</h1>
                         <IconButton onClick={fetchData} disabled={isLoadingTickets || isLoadingUsers || apiStatus === 'loading'} title="Refresh Data / API Status" className={`p-1 ${darkMode ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"}`} >
                             <FaSync className={(isLoadingTickets || isLoadingUsers || apiStatus === 'loading') ? 'animate-spin' : ''} style={{ fontSize: "16px" }} />
                         </IconButton>
                         <div className="flex items-center">
                             {(apiStatus === 'loading') && (<motion.div initial={{opacity:0}} animate={{opacity:1}} className={`flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${darkMode ? 'bg-blue-900 text-blue-100' : 'bg-blue-100 text-blue-700'}`}><FaCircleNotch className="animate-spin h-3 w-3 mr-1" /> Connecting...</motion.div>)}
                             {(apiStatus === 'connected' && !isLoadingTickets && !isLoadingUsers) && (<motion.div initial={{opacity:0}} animate={{opacity:1}} className={`flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm ${darkMode ? 'bg-green-800 text-green-100' : 'bg-green-100 text-green-700'}`}><FaCheckCircle className="h-3 w-3 mr-1" /> API OK</motion.div>)}
                             {(apiStatus === 'error') && (<motion.div initial={{opacity:0}} animate={{opacity:1}} title={apiError} className={`flex items-center px-3 py-1 rounded-full text-xs font-medium shadow-sm cursor-help ${darkMode ? 'bg-red-900 text-red-100' : 'bg-red-100 text-red-700'}`}><FaExclamationCircle className="h-3 w-3 mr-1" /> API Error</motion.div>)}
                         </div>
                         {uploadStatus.message && (uploadStatus.source?.startsWith("ticket") || uploadStatus.source === "userUpload" || uploadStatus.source === "logout" || uploadStatus.source?.startsWith("ticketSave") || uploadStatus.source?.startsWith("ticketDelete") || uploadStatus.source?.startsWith("ticketStatus") ) && (
                            <motion.div key={uploadStatus.message+uploadStatus.source+Date.now()} initial={{opacity:0, y: -10}} animate={{opacity:1, y: 0}} exit={{opacity:0, y: -10}} transition={{duration:0.3}} className={`flex items-center px-3 py-1 rounded-md text-sm font-medium shadow-sm ${uploadStatus.type === "success" ? "bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-100" : uploadStatus.type === "error" ? "bg-red-100 text-red-700 dark:bg-red-800 dark:text-red-100" : "bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-100"}`}>
                                <span className="mr-2">{uploadStatus.type === 'success' ? <FaCheckCircle /> : uploadStatus.type === 'error' ? <FaExclamationCircle/> : <FaCircleNotch className="animate-spin"/>}</span>
                                <span>{uploadStatus.message}</span>
                            </motion.div>
                         )}
                    </div>
                    {/* Desktop Navigation */}
                    <div className="hidden sm:flex items-center"> {/* Removed space-x-2 to rely on NavLink padding/margin */}
                        <nav className="flex items-center space-x-2"> {/* Added nav element and space-x-2 here */}
                            <NavLink to="/admin-dashboard" className={getNavLinkClass} end ref={homeButtonRef} onClick={handleHomeButtonClick}><FaHome /> Home</NavLink>
                            <NavLink to="/admin-dashboard/tickets" className={getNavLinkClass}><FaListAlt /> Lists</NavLink>
                            <NavLink to="/admin-dashboard/addUser" className={getNavLinkClass}><FaUserPlus /> Add User</NavLink>
                            <NavLink to="/admin-dashboard/ticketForm" className={getNavLinkClass}><FaTicketAlt /> Ticket+</NavLink>
                            <NavLink to="/admin-dashboard/reports" className={getNavLinkClass}><FaChartBar /> Reports</NavLink>
                            <NavLink to="/admin-dashboard/settings" className={getNavLinkClass}><FaCog /> Settings</NavLink>
                        </nav>
                        <div className="flex items-center pl-3 border-l border-gray-300 dark:border-gray-600 ml-3"> {/* Added ml-3 for spacing */}
                            {darkMode ? <MdLightMode className="mr-1.5 h-5 w-5 text-yellow-400" /> : <MdDarkMode className="mr-1.5 h-5 w-5 text-gray-600" />}
                            <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div></label>
                        </div>
                        <button onClick={handleLogout} className={`ml-3 px-4 py-2 rounded-lg transition flex items-center text-sm font-medium gap-1.5 ${darkMode ? "bg-red-600 hover:bg-red-700 text-white shadow-md" : "bg-red-500 hover:bg-red-600 text-white shadow-md"}`}><FaSignOutAlt /> Logout</button>
                    </div>
                    <button onClick={() => setIsMenuOpen(true)} className={`sm:hidden p-2 rounded-md ${darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-600 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`} aria-label="Open menu"><FaBars className="h-6 w-6" /></button>
                </header>

                {isMenuOpen && (
                    <Fragment>
                        <motion.div onClick={closeMenu} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden" aria-hidden="true" />
                        <div {...(isTouchDevice ? swipeHandlers : {})} className={`fixed top-0 right-0 h-full w-3/4 max-w-xs z-50 sm:hidden transform transition-transform ease-in-out duration-300 ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
                            <motion.div initial={{x:"100%"}} animate={{x:0}} exit={{x:"100%"}} transition={{type:"tween",ease:"easeInOut",duration:0.3}} className={`h-full w-full shadow-xl flex flex-col ${darkMode ? 'bg-gray-800/95 border-l border-gray-700/50 text-gray-200' : 'bg-white/95 border-l border-gray-200/50 text-gray-800'} backdrop-blur-md`}>
                                <div className="p-4 flex justify-end"><button onClick={closeMenu} className={`p-2 rounded-md ${darkMode ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'} focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500`} aria-label="Close menu"><FaTimes className="h-6 w-6" /></button></div>
                                <nav className="flex-grow p-4 space-y-3 overflow-y-auto"> {/* Wrapped mobile NavLinks in a nav tag */}
                                    <NavLink to="/admin-dashboard" className={getMobileNavLinkClass} onClick={handleHomeButtonClick} end><FaHome /> Home</NavLink>
                                    <NavLink to="/admin-dashboard/tickets" className={getMobileNavLinkClass} onClick={() => { handleNavigateToTicketsWithFilter(null); closeMenu();}}><FaListAlt /> Lists</NavLink>
                                    <NavLink to="/admin-dashboard/addUser" className={getMobileNavLinkClass} onClick={closeMenu}><FaUserPlus /> Add User</NavLink>
                                    <NavLink to="/admin-dashboard/ticketForm" className={getMobileNavLinkClass} onClick={closeMenu}><FaTicketAlt /> Ticket+</NavLink>
                                    <NavLink to="/admin-dashboard/reports" className={getMobileNavLinkClass} onClick={closeMenu}><FaChartBar /> Reports</NavLink>
                                    <NavLink to="/admin-dashboard/settings" className={getMobileNavLinkClass} onClick={closeMenu}><FaCog /> Settings</NavLink>
                                    <div className={`flex items-center justify-between px-4 py-3 mt-3 rounded-lg ${darkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                                        <span className="flex items-center gap-2 font-medium text-base">{darkMode ? <MdLightMode className="h-5 w-5 text-yellow-400" /> : <MdDarkMode className="h-5 w-5 text-gray-600" />} Mode</span>
                                        <label className="relative inline-flex items-center cursor-pointer"><input type="checkbox" className="sr-only peer" checked={darkMode} onChange={toggleDarkMode} /><div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div></label>
                                    </div>
                                    <button onClick={() => { handleLogout(); closeMenu(); }} className="w-full mt-6 px-4 py-3 rounded-lg transition font-raleway font-medium flex items-center justify-center gap-2 bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700 text-base shadow-md"><FaSignOutAlt /> Logout</button>
                                </nav>
                            </motion.div>
                        </div>
                    </Fragment>
                )}

                <main className="pt-6 px-4 sm:px-6 pb-6 flex-1">
                    {(isLoadingTickets || isLoadingUsers) && apiStatus === 'loading' && ( <OutletLoadingFallback /> )}
                    {apiStatus === 'error' && !isLoadingUsers && !isLoadingTickets && ( <Alert severity="error" variant="filled" sx={{ mt: 2, mb: 4 }}> <Typography fontWeight="medium">Failed to Load Dashboard Data</Typography> <Typography variant="body2">{apiError || "Please check your connection or try refreshing."}</Typography> </Alert> )}
                    {apiStatus === 'connected' && !isLoadingUsers && (
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