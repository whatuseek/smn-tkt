// frontend/src/App.jsx
import { BrowserRouter as Router, Routes, Route, useNavigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import TicketForm from "./components/TicketForm";
//import AdminRouteGuard from "./components/AdminRouteGuard";  //REMOVED
import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const App = () => {
    const navigate = useNavigate();

    // Define state variables and their initial values
    const [uploadStatus, setUploadStatus] = useState({ message: '', type: '' });
    const [darkMode, setDarkMode] = useState(false);
    const [showTickets, setShowTickets] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboardHome');
    const [showUserUpload, setShowUserUpload] = useState(false);
    const [showTicketForm, setShowTicketForm] = useState(false);
    const [tickets, setTickets] = useState([]);// NEW State to store tickets for summary
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [filteredStatus, setFilteredStatus] = useState(null);
    const [isDbConnected, setIsDbConnected] = useState(false);
    const [isCheckingConnection, setIsCheckingConnection] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [issueType, setIssueType] = useState('');
    const [availableIssueTypes, setAvailableIssueTypes] = useState([]);

    // Fetch issue types from the backend
    const fetchIssueTypes = useCallback(async () => {
        try {
            const response = await axios.get(import.meta.env.VITE_BACKEND_URL + '/api/admin/issue-types');
            setAvailableIssueTypes(response.data);
        } catch (error) {
            console.error('Error fetching issue types:', error);
        }
    }, []);

    useEffect(() => {
        fetchIssueTypes();
    }, [fetchIssueTypes]);

    // Calculate derived state values
    const totalTickets = tickets.length;
    const openTickets = tickets.filter(ticket => ticket.status === 'Open').length;
    const inProgressTickets = tickets.filter(ticket => ticket.status === 'In Progress').length;
    const resolvedTickets = tickets.filter(ticket => ticket.status === 'Resolved').length;

    return (
        <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/ticket-form" element={<TicketForm />} />
            <Route
                path="/admin-dashboard"
                element={
                        <AdminDashboard
                            navigate={navigate}
                            uploadStatus={uploadStatus}
                            setUploadStatus={setUploadStatus}
                            darkMode={darkMode}
                            setDarkMode={setDarkMode}
                            showTickets={showTickets}
                            setShowTickets={setShowTickets}
                            isMenuOpen={isMenuOpen}
                            setIsMenuOpen={setIsMenuOpen}
                            activeTab={activeTab}
                            setActiveTab={setActiveTab}
                            showUserUpload={showUserUpload}
                            setShowUserUpload={setShowUserUpload}
                            showTicketForm={showTicketForm}
                            setShowTicketForm={setShowTicketForm}
                            setTickets={setTickets}
                            selectedFile={selectedFile}
                            setSelectedFile={setSelectedFile}
                            uploading={uploading}
                            setUploading={setUploading}
                            uploadProgress={uploadProgress}
                            setUploadProgress={setUploadProgress}
                            filteredStatus={filteredStatus}
                            setFilteredStatus={setFilteredStatus}
                            isDbConnected={isDbConnected}
                            setIsDbConnected={setIsDbConnected}
                            isCheckingConnection={isCheckingConnection}
                            setIsCheckingConnection={setIsCheckingConnection}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            issueType={issueType}
                            setIssueType={setIssueType}
                            availableIssueTypes={availableIssueTypes}
                            totalTickets={totalTickets}
                            openTickets={openTickets}
                            inProgressTickets={inProgressTickets}
                            resolvedTickets={resolvedTickets}
                        />
                }
            />
            <Route path="*" element={<LandingPage />} />
        </Routes>
    );
};

const AppWrapper = () => {
    return (
        <Router>
            <App />
        </Router>
    );
};

export default AppWrapper;