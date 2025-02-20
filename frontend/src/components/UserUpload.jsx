import PropTypes from 'prop-types'; // Import PropTypes
import { motion } from "framer-motion";
//import { FaCheckCircle, FaExclamationCircle, FaTimes, FaUpload } from "react-icons/fa"; // Import FaCheckCircle
import { FaTimes, FaUpload } from "react-icons/fa";
const UserUpload = ({ darkMode, selectedFile, uploading, uploadProgress, handleFileChange, handleClearFile, handleUpload }) => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.5 }
        }
    };

    return (
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
    );
};

// Prop validation
UserUpload.propTypes = {
    darkMode: PropTypes.bool.isRequired,
    selectedFile: PropTypes.object,
    //uploadStatus: PropTypes.shape({ // Remove these uploadStatus
    //    message: PropTypes.string,
    //    type: PropTypes.string,
    //}).isRequired,
    uploading: PropTypes.bool.isRequired,
    uploadProgress: PropTypes.number.isRequired,
    handleFileChange: PropTypes.func.isRequired,
    handleClearFile: PropTypes.func.isRequired,
    handleUpload: PropTypes.func.isRequired,
};

export default UserUpload;