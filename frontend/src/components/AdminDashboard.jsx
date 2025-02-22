// frontend/src/components/AdminDashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TicketList from "./TicketList";
import AdminRouteGuard from "./AdminRouteGuard";
import UserUpload from "./UserUpload"; // Import the new component
import axios from "axios";  // Import axios
import { motion } from "framer-motion";
import { FaCheckCircle, FaExclamationCircle, FaBars } from "react-icons/fa"; // Import FaBars for the hamburger icon
import { MdDarkMode, MdLightMode } from "react-icons/md"

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [uploadStatus, setUploadStatus] = useState({ message: '', type: '' });//  notification
    const [darkMode, setDarkMode] = useState(false);
    const [showTickets, setShowTickets] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State for controlling the menu
    const [activeTab, setActiveTab] = useState('dashboardHome');
    const [showUserUpload, setShowUserUpload] = useState(false); // New state for UserUpload

    const [tickets, setTickets] = useState([]);// NEW State to store tickets for summary
    

    //new
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    useEffect(() => {
        if (showTickets) {
            setActiveTab('tickets');
        } else if (showUserUpload) {
            setActiveTab('upload');
        } else {
            setActiveTab('dashboardHome');
        }
    }, [showTickets, showUserUpload]);

    const handleLogout = () => {
        localStorage.removeItem("adminLoggedIn");
        navigate("/");
    };


    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const handleTicketsLinkClick = () => {
        setShowTickets(true);
        setShowUserUpload(false);
    }

    const handleUserUploadClick = () => {
        setShowUserUpload(true);
        setShowTickets(false);
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
    // Function to get status color
    const getStatusColor = (status) => {
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
    

    

    

    useEffect(() => {
        const fetchAllTickets = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/admin/tickets`);
                setTickets(response.data);
            } catch (error) {
                console.error("Error fetching tickets:", error);
            }
        };

        fetchAllTickets();
    }, []);
    // Calculate statistics
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(ticket => ticket.status === 'Open').length;
    const inProgressTickets = tickets.filter(ticket => ticket.status === 'In Progress').length;
    const resolvedTickets = tickets.filter(ticket => ticket.status === 'Resolved').length;


    return (
        <AdminRouteGuard>
            <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"} flex flex-col`}>
                {/* Header */}
                <header className={`sticky top-0 z-10 flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 rounded-lg shadow-md w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
                        {/* Hamburger Menu Button */}
                        <button onClick={toggleMenu} className="sm:hidden text-gray-500 hover:text-gray-700 focus:outline-none">
                            <FaBars className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className={`flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 ${isMenuOpen ? 'block' : 'hidden'} sm:flex`}>
                        <button
                            onClick={() => { setShowTickets(false); setShowUserUpload(false); setIsMenuOpen(false); }}
                            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition ${
                                darkMode
                                    ? activeTab === 'dashboardHome'
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-300 hover:bg-gray-700'
                                    : activeTab === 'dashboardHome'
                                        ? 'bg-gray-200 text-gray-900'
                                        : 'text-gray-700 hover:bg-gray-200'
                            }`}
                        >Home
                        </button>
                        <button
                            onClick={() => { handleTicketsLinkClick(); setIsMenuOpen(false); }}
                            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition ${
                                darkMode
                                    ? activeTab === 'tickets'
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-300 hover:bg-gray-700'
                                    : activeTab === 'tickets'
                                        ? 'bg-gray-200 text-gray-900'
                                        : 'text-gray-700 hover:bg-gray-200'
                            }`}
                        >Tickets
                        </button>
                        <button
                            onClick={() => { handleUserUploadClick(); setIsMenuOpen(false); }}
                            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition ${
                                darkMode
                                    ? activeTab === 'upload'
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-300 hover:bg-gray-700'
                                    : activeTab === 'upload'
                                        ? 'bg-gray-200 text-gray-900'
                                        : 'text-gray-700 hover:bg-gray-200'
                            }`}
                        >User Upload
                        </button>
                        <a href="#" className={`px-3 py-1 sm:px-4 sm:py-2 ${darkMode ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-200"} rounded-lg transition`}>Settings</a>

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
                            className={`px-3 py-1 sm:px-4 sm:py-2 ${darkMode ? "bg-red-600 hover:bg-red-700" : "bg-red-500 hover:bg-red-600"} text-white rounded-lg transition`}
                        >
                            Logout
                        </button>
                    </nav>
                </header>

                {/* Main Content */}
                <main className="p-4 sm:p-6 flex-1 overflow-y-auto w-full">

                    {/* Ticket Statistics */}
                    {!showTickets && !showUserUpload && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8`}
                        >
                            <div className={`rounded-2xl shadow-md p-6 flex flex-col items-start ${darkMode ? "text-white" : "text-gray-700"}`}>
                                <div className="text-lg font-semibold mb-2">Total Tickets</div>
                                <div className="text-3xl font-bold">{totalTickets}</div>
                            </div>
                            <div className={`rounded-2xl shadow-md p-6 flex flex-col items-start ${darkMode ? "text-white" : "text-gray-700"} ${getStatusColor('Open')}`}>
                                <div className="text-lg font-semibold mb-2">Open</div>
                                <div className="text-3xl font-bold">{openTickets}</div>
                            </div>
                            <div className={`rounded-2xl shadow-md p-6 flex flex-col items-start ${darkMode ? "text-white" : "text-gray-700"} ${getStatusColor('In Progress')}`}>
                                <div className="text-lg font-semibold mb-2">In Progress</div>
                                <div className="text-3xl font-bold">{inProgressTickets}</div>
                            </div>
                            <div className={`rounded-2xl shadow-md p-6 flex flex-col items-start ${darkMode ? "text-white" : "text-gray-700"} ${getStatusColor('Resolved')}`}>
                                <div className="text-lg font-semibold mb-2">Resolved</div>
                                <div className="text-3xl font-bold">{resolvedTickets}</div>
                            </div>
                        </motion.div>
                    )}
                    {/* Ticket List */}
                    {showTickets && (
                        <>
                            
                            <div className="flex-1 overflow-auto">
                                <TicketList
                                    darkMode={darkMode}
                                    onDataChange={() => {
                                        // Re-fetch tickets when data changes in TicketList
                                        // fetchTickets();
                                    }}

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
                            />
                        </motion.div>
                    )}
                    {/* Notification, global one, to make it appear in dashboardHome and userupload and ticket*/}
                    {uploadStatus.message && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.3 }}
                            className={`mb-4 px-4 py-3 rounded ${uploadStatus.type === "success"
                                ? "bg-green-100 border border-green-400 text-green-700"
                                : "bg-red-100 border border-red-400 text-red-700"
                                } flex items-center animate-fade-in-out`}
                        >
                            {uploadStatus.type === "success" ? (
                                <FaCheckCircle className="mr-2" />
                            ) : (
                                <FaExclamationCircle className="mr-2" />
                            )}
                            <span>{uploadStatus.message}</span>
                        </motion.div>
                    )}

                </main>
            </div>
        </AdminRouteGuard>
    );
};

export default AdminDashboard;