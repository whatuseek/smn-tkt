// tkt/frontend/src/components/AdminDashboard.jsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TicketList from "./TicketList";
import AdminRouteGuard from "./AdminRouteGuard";
import axios from "axios";
import { motion } from "framer-motion";
import { FaCheckCircle, FaExclamationCircle, FaTimes, FaUpload, FaBars } from "react-icons/fa"; // Import FaBars for the hamburger icon
import {MdDarkMode, MdLightMode} from "react-icons/md"

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadStatus, setUploadStatus] = useState({ message: '', type: '' });
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [darkMode, setDarkMode] = useState(false);
    const [showTickets, setShowTickets] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false); // State for controlling the menu
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        if (showTickets) {
            setActiveTab('tickets');
        } else {
            setActiveTab('dashboard');
        }
    }, [showTickets]);

    const handleLogout = () => {
        localStorage.removeItem("adminLoggedIn");
        navigate("/");
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

    const toggleDarkMode = () => {
        setDarkMode(!darkMode);
    };

    const handleTicketsLinkClick = () => {
        setShowTickets(true);
    }

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


    return (
        <AdminRouteGuard>
            <div className={`min-h-screen ${darkMode ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-900"} flex flex-col`}>
                {/* Header */}
                <header className={`flex flex-col sm:flex-row justify-between items-center p-4 sm:p-6 rounded-lg shadow-md w-full ${darkMode ? "bg-gray-800" : "bg-white"}`}>
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <h1 className="text-2xl sm:text-3xl font-bold">Admin Panel</h1>
                        {/* Hamburger Menu Button */}
                        <button onClick={toggleMenu} className="sm:hidden text-gray-500 hover:text-gray-700 focus:outline-none">
                            <FaBars className="h-6 w-6" />
                        </button>
                    </div>
                    <nav className={`flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4 ${isMenuOpen ? 'block' : 'hidden'} sm:flex`}>
                        <button
                            onClick={() => {setShowTickets(false); setIsMenuOpen(false);}}
                            className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg transition ${
                                darkMode
                                    ? activeTab === 'dashboard'
                                        ? 'bg-gray-700 text-white'
                                        : 'text-gray-300 hover:bg-gray-700'
                                    : activeTab === 'dashboard'
                                        ? 'bg-gray-200 text-gray-900'
                                        : 'text-gray-700 hover:bg-gray-200'
                            }`}
                        >Dashboard
                        </button>
                        <button
                            onClick={() => {handleTicketsLinkClick(); setIsMenuOpen(false);}}
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
                    {!showTickets && (
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            className={`mb-4 sm:mb-6 p-4 sm:p-6 rounded-lg shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
                        >
                            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Upload User Data</h3>
                            <div className="flex flex-col items-center justify-between">
                                <div className="w-full mb-4">
                                    <label htmlFor="file-upload"
                                        className={`cursor-pointer flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed rounded-lg ${darkMode ? "border-gray-600 hover:border-gray-500" : "border-gray-300 hover:border-gray-400"}`}
                                    >
                                        <FaUpload className="text-2xl sm:text-3xl mb-2" />
                                        <span className="text-sm font-medium text-center">
                                            {selectedFile ? selectedFile.name : "Choose a file or drag it here"}
                                        </span>
                                    </label>
                                    <input
                                        id="file-upload"
                                        type="file"
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                    {selectedFile && (
                                        <div className="flex items-center justify-between mt-2">
                                            <p className="text-sm font-light">{selectedFile.name}</p>
                                            <button
                                                onClick={handleClearFile}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                <FaTimes />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <button
                                    onClick={handleUpload}
                                    disabled={uploading}
                                    className={`px-4 py-2 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed`}
                                >
                                    {uploading ? "Uploading..." : "Upload Users"}
                                </button>
                            </div>
                            {uploading && (
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mt-4">
                                    <div
                                        className="bg-blue-500 h-2.5 rounded-full"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                            )}
                        </motion.div>
                    )}
                    {/* Notification */}
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
                    {/* Ticket List */}
                    {showTickets && (
                        <div className="flex-1 overflow-auto">
                            <TicketList darkMode={darkMode} />
                        </div>
                    )}
                </main>
            </div>
        </AdminRouteGuard>
    );
};

export default AdminDashboard;