// frontend/src/components/UserUpload.jsx

import PropTypes from 'prop-types';
import { motion } from "framer-motion";
import { FaTimes, FaUpload, FaSave } from "react-icons/fa";
import { useState } from 'react';
import axios from 'axios';

const UserUpload = ({ darkMode, selectedFile, uploading, uploadProgress, handleFileChange, handleClearFile, handleUpload, setUploadStatus }) => {
    const [manualUserId, setManualUserId] = useState('');
    const [manualMobileNo, setManualMobileNo] = useState('');

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    const handleManualUserSubmit = async (e) => {
        e.preventDefault();

        if (!manualUserId || !manualMobileNo) {
            setUploadStatus({ message: "Please fill in all fields.", type: "error" });
            return;
        }

        if (!/^\d{10}$/.test(manualMobileNo)) {
            setUploadStatus({ message: "Please enter a valid 10-digit mobile number.", type: "error" });
            return;
        }

        try {
            const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/user/create`, {
                user_id: manualUserId,
                mobile_number: manualMobileNo
            });

            if (response.data.success) {
                setUploadStatus({ message: response.data.message, type: "success" });
                // Reset form fields after successful submission
                setManualUserId('');
                setManualMobileNo('');
            } else {
                throw new Error(response.data.message || "Failed to create user.");
            }
        } catch (error) {
            setUploadStatus({ message: error.response?.data?.message || "Error creating user.", type: "error" });
        } finally {
            setTimeout(() => setUploadStatus({ message: '', type: '' }), 3000);
        }
    };

    const clearManualUserId = () => {
        setManualUserId('');
    };

    const clearManualMobileNo = () => {
        setManualMobileNo('');
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className={`mb-4 sm:mb-6 p-4 sm:p-6 rounded-lg shadow-lg ${darkMode ? "bg-gray-800" : "bg-white"}`}
        >
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Upload User Data</h3>

            {/* Manual User Creation Form */}
            <form onSubmit={handleManualUserSubmit} className="mb-6">
                <div className="mb-4 relative">
                    <label htmlFor="manualUserId" className="block text-sm font-medium mb-1">User ID</label>
                    <input
                        type="text"
                        id="manualUserId"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${darkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                        placeholder="Enter User ID"
                        value={manualUserId}
                        onChange={(e) => setManualUserId(e.target.value)}
                        required
                    />
                    {manualUserId && (
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 focus:outline-none"
                            onClick={clearManualUserId}
                        >
                            <FaTimes className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <div className="mb-4 relative">
                    <label htmlFor="manualMobileNo" className="block text-sm font-medium mb-1">Mobile No.</label>
                    <input
                        type="tel"
                        id="manualMobileNo"
                        className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md ${darkMode ? "bg-gray-700 text-white border-gray-600" : ""}`}
                        placeholder="Enter Mobile No."
                        value={manualMobileNo}
                        onChange={(e) => setManualMobileNo(e.target.value)}
                        required
                    />
                    {manualMobileNo && (
                        <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 focus:outline-none"
                            onClick={clearManualMobileNo}
                        >
                            <FaTimes className="h-5 w-5" />
                        </button>
                    )}
                </div>

                <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                    <FaSave className="mr-2" />
                    Add User
                </button>
            </form>

            {/* File Upload Section */}
            <div className="flex flex-col items-center justify-between">
                <div className="w-full mb-4 relative">
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
    );
};

// Prop validation
UserUpload.propTypes = {
    darkMode: PropTypes.bool.isRequired,
    selectedFile: PropTypes.object,
    uploading: PropTypes.bool.isRequired,
    uploadProgress: PropTypes.number.isRequired,
    handleFileChange: PropTypes.func.isRequired,
    handleClearFile: PropTypes.func.isRequired,
    handleUpload: PropTypes.func.isRequired,
    setUploadStatus: PropTypes.func.isRequired,
};

export default UserUpload;