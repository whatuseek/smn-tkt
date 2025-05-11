// frontend/src/pages/admin/ReportsPage.jsx
import { useNavigate } from 'react-router-dom';
import {
    Box, Typography, Paper, List, ListItem, ListItemButton, 
    ListItemIcon, ListItemText, useTheme // Added useTheme
} from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import InsightsIcon from '@mui/icons-material/Insights';
import ChevronRightIcon from '@mui/icons-material/ChevronRight'; // Import ChevronRightIcon
import { useAdminDashboardContext } from '../../layouts/AdminDashboardLayout';

const ReportsPage = () => {
    const navigate = useNavigate();
    const { darkMode } = useAdminDashboardContext();
    const theme = useTheme(); // To access theme palette if needed for consistency

    const reportItems = [
        {
            title: "Ticket Details Export",
            description: "Export a detailed list of tickets based on selected criteria (CSV, XLSX, PDF).",
            icon: <DescriptionIcon sx={{ color: darkMode ? theme.palette.primary.light : theme.palette.primary.main, fontSize: '1.6rem' }} />, // Slightly larger icon
            path: 'tickets' // Relative to /admin-dashboard/reports/
        },
        {
            title: "Ticket Analytics & Insights",
            description: "Analyze issue frequency and time-based trends (e.g., hourly distribution).",
            icon: <InsightsIcon sx={{ color: darkMode ? theme.palette.info.light : theme.palette.info.main, fontSize: '1.6rem' }} />, // Slightly larger icon
            path: 'analytics'
        }
        // Add more reports here if needed in the future
        // {
        //     title: "User Activity Report",
        //     description: "View reports related to user activities and performance.",
        //     icon: <FaUserChart sx={{ color: darkMode ? theme.palette.success.light : theme.palette.success.main }} />, // Example
        //     path: 'user-activity'
        // }
    ];

    return (
        <Box sx={{ mt: 2, mb: 4 }}>
            <Paper
                elevation={3}
                sx={{
                    p: { xs: 2, sm: 3 },
                    bgcolor: darkMode ? 'grey.800' : 'background.paper',
                    color: darkMode ? 'grey.100' : 'text.primary',
                    borderRadius: '12px' // Consistent rounding
                }}
            >
                <Typography variant="h5" component="h1" gutterBottom sx={{ mb: 3, color: 'inherit', fontWeight: 500 }}>
                    Available Reports
                </Typography>

                <List>
                    {reportItems.map((item, index) => (
                        <ListItem 
                            key={item.title} 
                            disablePadding 
                            sx={{mb: index < reportItems.length - 1 ? 1.5 : 0}} // Add margin bottom to all but last
                        >
                            <ListItemButton 
                                onClick={() => navigate(item.path)}
                                sx={{
                                    py: {xs: 1.5, sm: 2}, // Increased vertical padding for better tap targets
                                    px: {xs: 1.5, sm: 2},
                                    borderRadius: '8px',
                                    transition: 'background-color 0.2s ease-in-out',
                                    '&:hover': {
                                        bgcolor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'action.hover',
                                    },
                                }}
                            >
                                <ListItemIcon sx={{minWidth: 48, color: 'inherit'}}> {/* Ensure icon color inherits */}
                                    {item.icon}
                                </ListItemIcon>
                                <ListItemText
                                    primary={item.title}
                                    secondary={item.description}
                                    primaryTypographyProps={{ sx: { fontWeight: 'medium', color: 'inherit', fontSize: '1.05rem' } }}
                                    secondaryTypographyProps={{ sx: { color: darkMode ? 'grey.400' : 'text.secondary', fontSize: '0.85rem' } }}
                                 />
                                <ChevronRightIcon sx={{ color: darkMode ? 'grey.500' : 'grey.400', ml: 1 }} />
                            </ListItemButton>
                        </ListItem>
                    ))}
                </List>
            </Paper>
        </Box>
    );
};

export default ReportsPage;