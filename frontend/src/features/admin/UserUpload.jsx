// frontend/src/features/admin/UserUpload.jsx
import { useState, useCallback, useRef } from 'react';
import { motion } from "framer-motion";
import { 
    FaTimes, FaUpload, FaSave, FaCircleNotch,
     FaDownload
} from "react-icons/fa";
import axiosInstance from '../../api/axiosInstance';
import { useAdminDashboardContext } from '../../layouts/AdminDashboardLayout';
import { 
    Alert, 
    TextField as MuiTextField,
    Button as MuiButton,
    Box, 
    Typography,
    Paper,
    InputAdornment,
    IconButton,
    LinearProgress,
    Link as MuiLink
} from '@mui/material';

const UserUpload = () => {
    const {
        darkMode,
        nameToDisplay,
        // setUploadStatus, // Removed to prioritize local feedback
    } = useAdminDashboardContext();

    const [localSelectedFile, setLocalSelectedFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [localUploadProgress, setLocalUploadProgress] = useState(0);
    const [fileUploadStatus, setFileUploadStatus] = useState({ message: "", type: "" });
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef(null);

    const [manualUserId, setManualUserId] = useState('');
    const [manualMobileNo, setManualMobileNo] = useState('');
    const [isManualSubmitting, setIsManualSubmitting] = useState(false);
    const [manualAddStatus, setManualAddStatus] = useState({ message: '', type: '' });
    const [manualFormErrors, setManualFormErrors] = useState({});

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5 } } };

    const validateField = useCallback((name, value) => {
        let error = '';
        if (name === 'manualUserId') {
            if (!value.trim()) error = "User ID is required.";
        } else if (name === 'manualMobileNo') {
            const cleanedMobile = value.replace(/\D/g, '');
            if (!value.trim()) error = "Mobile number is required.";
            else if (!/^\d{10}$/.test(cleanedMobile)) error = "Must be 10 digits.";
        }
        setManualFormErrors(prev => ({ ...prev, [name]: error }));
        return !error;
    }, []);

    const handleManualInputChange = useCallback((e) => {
        const { name, value } = e.target;
        if (name === 'manualUserId') setManualUserId(value);
        else if (name === 'manualMobileNo') {
            const numericValue = value.replace(/\D/g, '');
            setManualMobileNo(numericValue.substring(0, 10));
            validateField(name, numericValue.substring(0, 10)); return;
        }
        validateField(name, value);
    }, [validateField]);

    const handleBlur = useCallback((e) => { const {name, value} = e.target; validateField(name, value); }, [validateField]);
    const validateManualForm = useCallback(() => { return validateField('manualUserId', manualUserId) && validateField('manualMobileNo', manualMobileNo); }, [manualUserId, manualMobileNo, validateField]);
    
    const handleManualUserSubmit = useCallback(async (e) => {
        e.preventDefault(); setManualAddStatus({ message: '', type: '' });
        if (!validateManualForm()) return;
        setIsManualSubmitting(true);
        try {
            const cleanedMobile = manualMobileNo.replace(/\D/g, '');
            const response = await axiosInstance.post(`/api/user/create`, { user_id: manualUserId.trim(), mobile_number: cleanedMobile });
            if (response.data.success) {
                const creatorName = nameToDisplay || 'Current User';
                const successMsg = `User '${response.data.user?.user_id || manualUserId}' created by ${creatorName}!`;
                setManualAddStatus({ message: successMsg, type: "success" });
                setManualUserId(''); setManualMobileNo(''); setManualFormErrors({});
                setTimeout(() => setManualAddStatus({ message: '', type: '' }), 5000);
            } else throw new Error(response.data.message || "Failed to create user.");
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Error creating user.";
            setManualAddStatus({ message: errorMsg, type: "error" });
        } finally { setIsManualSubmitting(false); }
    }, [manualUserId, manualMobileNo, nameToDisplay, validateManualForm]);

    // ***** MODIFIED handleLocalFileChange *****
    const handleLocalFileChange = (event) => {
        let file = null;
        // Check if it's a standard input change event
        if (event.target && event.target.files && event.target.files[0]) {
            file = event.target.files[0];
        } 
        // Check if it's an object from a drop event containing dataTransfer
        else if (event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
            file = event.dataTransfer.files[0];
        }
        
        if (file) {
            const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
            const allowedExts = ['.csv', '.xlsx'];
            const fileExt = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();

            if (!allowedExts.includes(fileExt) || !allowedTypes.includes(file.type)) {
                setFileUploadStatus({ message: "Invalid file type. Please upload CSV or XLSX.", type: "error" });
                setLocalSelectedFile(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
                setTimeout(()=> setFileUploadStatus({ message: "", type: "" }), 5000);
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                 setFileUploadStatus({ message: "File is too large. Max 10MB allowed.", type: "error" });
                 setLocalSelectedFile(null);
                 if (fileInputRef.current) fileInputRef.current.value = '';
                 setTimeout(()=> setFileUploadStatus({ message: "", type: "" }), 5000);
                 return;
            }
            setLocalSelectedFile(file);
            setFileUploadStatus({ message: "", type: "" });
        }
    };
    // ***** END MODIFIED handleLocalFileChange *****


    const handleLocalClearFile = () => {
        setLocalSelectedFile(null);
        setLocalUploadProgress(0);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleLocalUpload = useCallback(async () => {
        if (!localSelectedFile) {
            setFileUploadStatus({ message: "Please select a file to upload.", type: "error" });
            setTimeout(()=> setFileUploadStatus({ message: "", type: "" }), 3000);
            return;
        }
        setIsUploading(true);
        setLocalUploadProgress(0);
        setFileUploadStatus({ message: `Uploading "${localSelectedFile.name}"...`, type: "info" });

        const formData = new FormData();
        formData.append("file", localSelectedFile);

        try {
            const response = await axiosInstance.post(`/api/user/upload-users`, formData, {
                headers: { "Content-Type": "multipart/form-data" },
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        setLocalUploadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
                    }
                }
            });
            if (response.data.success) {
                const successMessage = response.data.insertedCount !== undefined 
                    ? `Successfully processed file. ${response.data.insertedCount} user(s) processed.`
                    : response.data.message || "File uploaded and processed successfully!";
                setFileUploadStatus({ message: successMessage, type: "success" });
                handleLocalClearFile();
                setTimeout(()=> setFileUploadStatus({ message: "", type: "" }), 7000);
            } else {
                throw new Error(response.data.message || "File processing failed on server.");
            }
        } catch (error) {
            let errorMsg = "Error during file upload.";
            if (error.response && error.response.data && error.response.data.message) {
                errorMsg = error.response.data.message;
            } else if (error.message) {
                errorMsg = error.message;
            }
            setFileUploadStatus({ message: errorMsg, type: "error" });
            setLocalUploadProgress(0);
        } finally {
            setIsUploading(false);
        }
    }, [localSelectedFile, handleLocalClearFile]);

    const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.types.includes('Files')) setIsDragging(true); };
    const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); if (e.relatedTarget && !e.currentTarget.contains(e.relatedTarget)) setIsDragging(false); else if (!e.relatedTarget) setIsDragging(false); };
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); if (e.dataTransfer.types.includes('Files')) setIsDragging(true); };
    const handleDrop = (e) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // Pass the dataTransfer object directly, as handleLocalFileChange now expects it
            handleLocalFileChange({ dataTransfer: e.dataTransfer }); 
            e.dataTransfer.clearData();
        }
    };

    const muiTextFieldSx = { '& .MuiOutlinedInput-root': { borderRadius: 2 }, '& .MuiInputLabel-root.Mui-focused': { color: darkMode ? 'primary.light' : 'primary.main', }, };

    return (
        <Box sx={{ maxWidth: 'md', mx: 'auto', py: {xs: 2, sm: 3} }}>
            <motion.div variants={containerVariants} initial="hidden" animate="visible" >
                <Paper 
                    elevation={3} 
                    sx={{ p: { xs: 2, sm: 3 }, mb: {xs: 3, sm: 4}, bgcolor: darkMode ? 'grey.800' : 'background.paper', borderRadius: '12px' }}
                >
                    <Typography variant="h6" component="h3" sx={{ mb: 2.5, fontWeight: 500, color: darkMode? 'grey.100' : 'text.primary' }}>
                        Add User Record
                    </Typography>
                    <Box component="form" onSubmit={handleManualUserSubmit} noValidate sx={{ '& .MuiTextField-root': { mb: 2.5 } }}>
                        {manualAddStatus.message && (
                            <Alert severity={manualAddStatus.type || 'info'} sx={{ mb: 2, borderRadius: 1.5 }} onClose={() => setManualAddStatus({ message: '', type: '' })} >
                                {manualAddStatus.message}
                            </Alert>
                        )}
                        <MuiTextField
                            fullWidth required variant="outlined" size="small" id="manualUserId" name="manualUserId" label="User ID"
                            value={manualUserId} onChange={handleManualInputChange} onBlur={handleBlur}
                            error={!!manualFormErrors.manualUserId} helperText={manualFormErrors.manualUserId || ' '}
                            disabled={isManualSubmitting} sx={muiTextFieldSx}
                            InputProps={{
                                endAdornment: manualUserId && !isManualSubmitting && (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => {setManualUserId(''); setManualFormErrors(p => ({...p, manualUserId: ''}));}} edge="end" size="small" aria-label="clear user id"> <FaTimes /> </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <MuiTextField
                            fullWidth required variant="outlined" size="small" id="manualMobileNo" name="manualMobileNo" label="Mobile No. (10 digits)" type="tel"
                            value={manualMobileNo} onChange={handleManualInputChange} onBlur={handleBlur}
                            error={!!manualFormErrors.manualMobileNo} helperText={manualFormErrors.manualMobileNo || ' '}
                            disabled={isManualSubmitting} sx={muiTextFieldSx} inputProps={{ maxLength: 10 }}
                            InputProps={{
                                endAdornment: manualMobileNo && !isManualSubmitting && (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => {setManualMobileNo(''); setManualFormErrors(p => ({...p, manualMobileNo: ''}));}} edge="end" size="small" aria-label="clear mobile number"> <FaTimes /> </IconButton>
                                    </InputAdornment>
                                )
                            }}
                        />
                        <MuiButton type="submit" variant="contained" color="success"
                            disabled={isManualSubmitting || !!manualFormErrors.manualUserId || !!manualFormErrors.manualMobileNo}
                            startIcon={isManualSubmitting ? <FaCircleNotch className="animate-spin" /> : <FaSave />}
                            sx={{ py: 1.2, borderRadius: 2, textTransform: 'none', minWidth: {xs: '100%', sm: 150}, 
                                '&.Mui-disabled': { color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)', '& .MuiButton-startIcon svg': { color: darkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)' } }
                            }}
                        >
                            {isManualSubmitting ? "Adding..." : "Add Manually"}
                        </MuiButton>
                    </Box>
                </Paper>

                <Paper 
                    elevation={3} 
                    sx={{ p: { xs: 2, sm: 3 }, bgcolor: darkMode ? 'grey.800' : 'background.paper', borderRadius: '12px' }}
                >
                    <Typography variant="h6" component="h3" sx={{ mb: 1, fontWeight: 500, color: darkMode? 'grey.100' : 'text.primary' }}>
                        Upload Users via File
                    </Typography>
                    <Box sx={{mb: 2.5, p: 1.5, borderRadius: '8px', bgcolor: darkMode? 'grey.700' : 'grey.100'}}>
                        <Typography variant="body2" sx={{ color: darkMode? 'grey.300' : 'text.secondary', fontSize: '0.8rem', lineHeight: 1.6 }}>
                            - File must be CSV or XLSX format. Max size: 10MB.
                            <br/>- Required columns: <strong>UserID</strong> (text), <strong>MobileNo</strong> (10 digits numeric).
                        </Typography>
                        <MuiLink 
                            href="/user_upload_template.csv" 
                            download="user_upload_template.csv"
                            variant="body2"
                            sx={{ display: 'inline-flex', alignItems: 'center', mt: 1, color: darkMode ? 'primary.light' : 'primary.main', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
                        >
                            <FaDownload style={{marginRight: '6px'}}/> Download Template
                        </MuiLink>
                    </Box>

                    {fileUploadStatus.message && (
                        <Alert 
                            severity={fileUploadStatus.type || 'info'} 
                            sx={{ mb: 2, borderRadius: 1.5, whiteSpace: 'pre-wrap' }} 
                            onClose={fileUploadStatus.type !== 'info' ? () => setFileUploadStatus({message:'', type:''}) : undefined }
                        >
                            {fileUploadStatus.message}
                        </Alert>
                    )}
                    <div className="flex flex-col items-center justify-between">
                        <div 
                            className="w-full mb-4 relative"
                            onDragEnter={handleDragEnter} onDragLeave={handleDragLeave} onDragOver={handleDragOver} onDrop={handleDrop}
                        >
                            <label 
                                htmlFor="file-upload" 
                                className={`cursor-pointer flex flex-col items-center justify-center p-4 py-6 sm:p-6 sm:py-8 border-2 border-dashed rounded-lg transition-all duration-150 ease-in-out
                                            ${darkMode ? "border-gray-600 hover:border-sky-500 bg-gray-700/40 hover:bg-gray-700/70" : "border-gray-300 hover:border-sky-500 bg-gray-50 hover:bg-sky-50"}
                                            ${isDragging ? (darkMode ? '!border-sky-400 !bg-gray-600/80' : '!border-sky-500 !bg-sky-100/80 ring-2 ring-sky-300') : ""}
                                            ${isDragging ? 'pointer-events-none' : ''}` 
                                }
                            >
                                <FaUpload className={`text-2xl sm:text-3xl mb-1.5 ${isDragging ? 'text-sky-500 dark:text-sky-400' : (darkMode ? 'text-gray-400' : 'text-gray-500')}`} />
                                <span className={`text-sm sm:text-base font-medium text-center ${isDragging ? 'text-sky-600 dark:text-sky-300' : (darkMode ? 'text-gray-200' : 'text-gray-700')}`}> 
                                    {localSelectedFile ? localSelectedFile.name : "Choose CSV/XLSX file or Drag here"} 
                                </span>
                                <span className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}> Max 10MB </span>
                            </label>
                            <input ref={fileInputRef} id="file-upload" type="file" onChange={handleLocalFileChange} className="hidden" accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel" />
                            {localSelectedFile && !isUploading && (<div className="flex items-center justify-center mt-3 text-sm"> <p className={`truncate max-w-[calc(100%-40px)] ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{localSelectedFile.name}</p> <button onClick={handleLocalClearFile} className={`ml-2 p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 ${darkMode ? 'text-red-400 hover:text-red-300 hover:bg-gray-600 focus:ring-red-500 focus:ring-offset-gray-800' : 'text-red-500 hover:text-red-700 hover:bg-gray-200 focus:ring-red-600 focus:ring-offset-white'}`} aria-label="Clear selected file" > <FaTimes /> </button> </div>)}
                        </div>
                        <MuiButton 
                            variant="contained" 
                            color="primary"
                            onClick={handleLocalUpload} 
                            disabled={isUploading || !localSelectedFile} 
                            startIcon={isUploading ? <FaCircleNotch className="animate-spin" /> : <FaUpload />}
                            sx={{ py: 1.2, borderRadius: 2, textTransform: 'none', minWidth: {xs: '100%', sm: 150}, '& .MuiButton-startIcon': { color: isUploading ? (darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.9)') : 'inherit', }, color: isUploading ? (darkMode ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.9)') : 'inherit.main', }}
                        >
                            {isUploading ? `Uploading ${localUploadProgress}%` : "Upload File"}
                        </MuiButton>
                    </div>
                    {isUploading && (
                        <Box sx={{width: '100%', mt: 2.5}}>
                            <LinearProgress variant="determinate" value={localUploadProgress} sx={{height: 8, borderRadius: 4}} />
                        </Box>
                    )}
                </Paper>
            </motion.div>
        </Box>
    );
};

export default UserUpload;