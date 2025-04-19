
import  { useState, useEffect, useCallback } from 'react';
import axios from "axios";
import PropTypes from 'prop-types';
import {
    Box, Typography, Paper, Divider, CircularProgress, Alert,
    List, ListItem, ListItemText, Chip, IconButton as MuiIconButton, Button // Removed unused ListItemSecondaryAction
} from '@mui/material';
import { FaUsersCog, FaUserEdit, FaUserTimes } from 'react-icons/fa';

// Import the form component directly
import AddSupportTeamMember from './AddSupportTeamMember';

// Backend URL
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

// Placeholder function to simulate getting the token (REPLACE WITH ACTUAL LOGIC)
const getAuthToken = () => {
    console.warn("SettingsPage: getAuthToken() is using a placeholder. Replace with actual Supabase session/token retrieval.");
    return "dummy-token-for-dev";
};

const SettingsPage = ({ setUploadStatus }) => {
    const [teamMembers, setTeamMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Function to fetch team members, wrapped in useCallback
    const fetchTeam = useCallback(async () => {
        setIsLoading(true);
        setError('');
        const token = getAuthToken();
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/admin/team-users`,
                { headers: { Authorization: `Bearer ${token || ''}` } }
            );
            setTeamMembers(response.data || []);
            console.log("Fetched team members:", response.data);
        } catch (err) {
            console.error("Error fetching team members:", err);
            setError(err.response?.data?.message || err.message || 'Failed to load team members');
            setTeamMembers([]);
        } finally {
            setIsLoading(false);
        }
    }, []); // Empty dependency array

    // Fetch team members on component mount
    useEffect(() => {
        fetchTeam();
    }, [fetchTeam]);

    // Helper function to extract roles
    const getUserRoles = (member) => {
        const roles = member?.raw_app_meta_data?.roles;
        return Array.isArray(roles) ? roles : [];
    };

    // Placeholder handlers
    const handleEditUser = (userId) => { alert(`Edit for user ${userId} NYI.`); };
    const handleDeleteUser = (userId, userEmail) => { if (window.confirm(`Delete ${userEmail}?`)) { alert(`DELETE for user ${userId} NYI.`); } };

    // Callback function passed to AddSupportTeamMember
    const handleUserAdded = useCallback(() => {
        console.log("User added callback received, refreshing team list...");
        fetchTeam(); // Re-fetch the list
    }, [fetchTeam]); // Include fetchTeam as dependency

    return (
        <Paper elevation={2} sx={{ p: { xs: 2, sm: 3 }, mt: 0, bgcolor: 'background.paper', borderRadius: 2 }}>
            <Typography variant="h4" component="h1" sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                Settings
            </Typography>

            {/* Section for Team Management */}
            <Box>
                <Typography variant="h5" component="h2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                   <FaUsersCog /> Team Management
                </Typography>
                <Divider sx={{ my: 1.5 }} />

                {/* Loading State */}
                {isLoading && ( <Box sx={{ display: 'flex', justifyContent: 'center', my: 5 }}><CircularProgress /></Box> )}

                {/* Error State */}
                {!isLoading && error && ( <Alert severity="error" sx={{ my: 2 }}>{error}<Button size="small" onClick={fetchTeam} sx={{ ml: 2 }}>Retry</Button></Alert> )}

                {/* User List */}
                {!isLoading && !error && (
                    <List dense={false} sx={{ mb: 4 }}>
                        {teamMembers.length === 0 ? (
                             <ListItem><ListItemText secondary="No team members found. Use the form below to add one." /></ListItem>
                        ) : (
                            teamMembers.map((member) => (
                                // Removed the intermediate 'roles' variable declaration here
                                <ListItem
                                    key={member.id}
                                    divider
                                    secondaryAction={
                                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                                            <MuiIconButton edge="end" aria-label="edit" size="small" onClick={() => handleEditUser(member.id)} title="Edit User (NYI)"><FaUserEdit /></MuiIconButton>
                                            <MuiIconButton edge="end" aria-label="delete" size="small" onClick={() => handleDeleteUser(member.id, member.email)} title="Delete User (NYI)"><FaUserTimes /></MuiIconButton>
                                        </Box>
                                    }
                                    sx={{ py: 1.5 }}
                                >
                                    <ListItemText
                                        primary={member.email}
                                        secondary={
                                            <Box component="span" sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                                                {/* Call getUserRoles directly inside the conditional rendering */}
                                                {getUserRoles(member).length > 0 ? (
                                                    getUserRoles(member).map(role => (
                                                        <Chip
                                                            key={role}
                                                            label={role}
                                                            size="small"
                                                            color={role === 'admin' ? 'primary' : 'secondary'}
                                                            variant="outlined"
                                                        />
                                                    ))
                                                ) : (
                                                    <Chip label="No Role Assigned" size="small" variant="outlined" />
                                                )}
                                            </Box>
                                        }
                                    />
                                </ListItem>
                            )) // End map function
                        )}
                    </List>
                )}

                 {/* Render the Add Support Team Member Form */}
                 {!isLoading && !error && (
                    <AddSupportTeamMember
                        setUploadStatus={setUploadStatus}
                        onUserAdded={handleUserAdded}
                    />
                 )}
            </Box>
        </Paper>
    );
};

// Define propTypes for SettingsPage
SettingsPage.propTypes = {
     setUploadStatus: PropTypes.func, // Optional function from parent
};

export default SettingsPage;