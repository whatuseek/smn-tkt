// frontend/src/pages/admin/SettingsPage.jsx
import { Box, Typography, Paper, useTheme } from '@mui/material'; // Added useTheme
import { FaCog } from 'react-icons/fa';
import { useAdminDashboardContext } from '../../layouts/AdminDashboardLayout';

const SettingsPage = () => {
    const { darkMode } = useAdminDashboardContext();
    const theme = useTheme(); // Get the theme object

    return (
        <Box sx={{ mt: 2, mb: 4 }}>
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 2, sm: 4 },
                    bgcolor: darkMode ? 'grey.800' : 'background.paper',
                    color: darkMode ? 'grey.100' : 'text.primary',
                    borderRadius: 2,
                    textAlign: 'center',
                    minHeight: '300px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <FaCog
                    style={{
                        fontSize: '3rem',
                        marginBottom: '16px',
                        color: darkMode ? theme.palette.grey[500] : theme.palette.grey[400],
                    }}
                />
                <Typography variant="h5" component="h1" sx={{ mb: 1, fontWeight: 'medium' }}>
                    Settings
                </Typography>
                <Typography variant="body1" sx={{ color: darkMode ? 'grey.400' : 'text.secondary' }}>
                    This section is currently under development.
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5, color: darkMode ? 'grey.500' : 'grey.600' }}>
                    Future application settings and configurations will be available here.
                </Typography>
            </Paper>
        </Box>
    );
};

export default SettingsPage;