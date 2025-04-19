// frontend/src/components/UserUpload.jsx
import { useState } from 'react'; // Removed useEffect as it wasn't used
import PropTypes from 'prop-types';
import { motion } from "framer-motion";
import { FaTimes, FaUpload, FaSave, FaCircleNotch } from "react-icons/fa"; // Added FaCircleNotch
import axiosInstance from '../api/axiosInstance'; // Import axiosInstance for manual add

const UserUpload = ({ darkMode, selectedFile, uploading, uploadProgress, handleFileChange, handleClearFile, handleUpload, setUploadStatus }) => {

    const [manualUserId, setManualUserId] = useState('');
    const [manualMobileNo, setManualMobileNo] = useState('');
    const [isManualSubmitting, setIsManualSubmitting] = useState(false); // Loading state for manual add

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };

    const handleManualUserSubmit = async (e) => {
        e.preventDefault();
        setUploadStatus({ message: '', type: '', source: '' }); // Clear previous status

        const cleanedMobile = manualMobileNo.replace(/\D/g, ''); // Clean mobile number
        if (!manualUserId.trim()) { setUploadStatus({ message: "User ID is required.", type: "error", source: "userManualAdd" }); return; }
        if (!cleanedMobile || !/^\d{10}$/.test(cleanedMobile)) { setUploadStatus({ message: "Please enter a valid 10-digit mobile number.", type: "error", source: "userManualAdd" }); return; }

        setIsManualSubmitting(true);
        try {
            // Use axiosInstance for the request - auth handled by interceptor
            const response = await axiosInstance.post(`/api/user/create`, {
                user_id: manualUserId.trim(),
                mobile_number: cleanedMobile
            });

            if (response.data.success) {
                setUploadStatus({ message: response.data.message || "User added successfully!", type: "success", source: "userManualAdd" });
                setManualUserId(''); setManualMobileNo(''); // Reset form
                setTimeout(() => setUploadStatus({ message: '', type: '', source: '' }), 3000);
            } else { throw new Error(response.data.message || "Failed to create user."); }
        } catch (error) {
            setUploadStatus({ message: error.response?.data?.message || error.message || "Error creating user.", type: "error", source: "userManualAdd" });
             setTimeout(() => setUploadStatus({ message: '', type: '', source: '' }), 5000); // Show error longer
        } finally {
            setIsManualSubmitting(false);
        }
    };

    const clearManualUserId = () => setManualUserId('');
    const clearManualMobileNo = () => setManualMobileNo('');

    return (
        <motion.div variants={containerVariants} initial="hidden" animate="visible" className={`mb-4 sm:mb-6 p-4 sm:p-6 rounded-lg shadow-lg ${darkMode ? "bg-gray-800 text-white" : "bg-white"}`} >
            <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Add User Record</h3>

            {/* Manual User Creation Form */}
            <form onSubmit={handleManualUserSubmit} className="mb-6">
                <div className="mb-4 relative">
                    <label htmlFor="manualUserId" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>User ID *</label>
                    <input type="text" id="manualUserId" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border rounded-md p-2 ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} placeholder="Enter User ID" value={manualUserId} onChange={(e) => setManualUserId(e.target.value)} required disabled={isManualSubmitting} />
                    {manualUserId && ( <button type="button" onClick={clearManualUserId} className={`absolute inset-y-0 right-0 top-6 pr-3 flex items-center focus:outline-none ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`} aria-label="Clear User ID" > <FaTimes /> </button> )}
                </div>

                <div className="mb-4 relative">
                    <label htmlFor="manualMobileNo" className={`block text-sm font-medium mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Mobile No. (10 digits) *</label>
                    <input type="tel" id="manualMobileNo" className={`shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border rounded-md p-2 ${darkMode ? "bg-gray-700 text-white border-gray-600 placeholder-gray-400" : "border-gray-300 placeholder-gray-500"}`} placeholder="Enter 10 digit Mobile No." value={manualMobileNo} onChange={(e) => setManualMobileNo(e.target.value)} required disabled={isManualSubmitting} maxLength={10} pattern="\d{10}" title="Enter exactly 10 digits" />
                     {manualMobileNo && ( <button type="button" onClick={clearManualMobileNo} className={`absolute inset-y-0 right-0 top-6 pr-3 flex items-center focus:outline-none ${darkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'}`} aria-label="Clear Mobile No" > <FaTimes /> </button> )}
                </div>

                <button type="submit" disabled={isManualSubmitting} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed" >
                    {isManualSubmitting ? <><FaCircleNotch className="animate-spin mr-2" /> Adding...</> : <><FaSave className="mr-2" /> Add Manually</>}
                </button>
            </form>

             <hr className={`my-6 ${darkMode ? 'border-gray-700' : 'border-gray-300'}`} />

             <h4 className="text-md sm:text-lg font-semibold mb-3 sm:mb-4">Upload Users via File</h4>
            {/* File Upload Section */}
            <div className="flex flex-col items-center justify-between">
                <div className="w-full mb-4 relative">
                    <label htmlFor="file-upload" className={`cursor-pointer flex flex-col items-center justify-center p-4 sm:p-6 border-2 border-dashed rounded-lg transition-colors ${darkMode ? "border-gray-600 hover:border-gray-500 bg-gray-700/50 hover:bg-gray-700" : "border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100"}`} >
                        <FaUpload className={`text-2xl sm:text-3xl mb-2 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                        <span className={`text-sm font-medium text-center ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            {selectedFile ? selectedFile.name : "Choose CSV/XLSX file"}
                        </span>
                         <span className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>Max 10MB</span>
                    </label>
                    <input id="file-upload" type="file" onChange={handleFileChange} className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                    {selectedFile && (
                        <div className="flex items-center justify-center mt-2 text-sm">
                            <p className={`truncate max-w-[80%] ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{selectedFile.name}</p>
                            <button onClick={handleClearFile} className={`ml-2 p-1 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'text-red-400 hover:text-red-300 hover:bg-gray-600 focus:ring-red-500 focus:ring-offset-gray-800' : 'text-red-500 hover:text-red-700 hover:bg-gray-200 focus:ring-red-600 focus:ring-offset-white'}`} aria-label="Clear selected file" >
                                <FaTimes />
                            </button>
                        </div>
                    )}
                </div>
                 {/* Upload Button */}
                <button onClick={handleUpload} disabled={uploading || !selectedFile} className={`w-full sm:w-auto px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2`} >
                    {uploading ? <><FaCircleNotch className="animate-spin"/> {`Uploading ${uploadProgress}%`}</> : <><FaUpload /> Upload File</>}
                </button>
            </div>
            {/* Progress Bar */}
            {uploading && (
                <div className={`w-full rounded-full h-2.5 mt-4 ${darkMode? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <div className="bg-blue-600 h-2.5 rounded-full transition-width duration-300 ease-linear" style={{ width: `${uploadProgress}%` }} ></div>
                </div>
            )}
        </motion.div>
    );
};

UserUpload.propTypes = {
    darkMode: PropTypes.bool,
    selectedFile: PropTypes.object,
    uploading: PropTypes.bool.isRequired,
    uploadProgress: PropTypes.number.isRequired,
    handleFileChange: PropTypes.func.isRequired,
    handleClearFile: PropTypes.func.isRequired,
    handleUpload: PropTypes.func.isRequired,
    setUploadStatus: PropTypes.func.isRequired,
};

export default UserUpload;