// import  { useState, useEffect } from 'react';
// import { useNavigate, useLocation, Navigate } from 'react-router-dom'; // Import Navigate
// import PropTypes from 'prop-types';

// const AdminRouteGuard = ({ children }) => {
//     const navigate = useNavigate();
//     const location = useLocation();
//     const [isLoading, setIsLoading] = useState(true);
//     const [isAuthenticated, setIsAuthenticated] = useState(false);

//     useEffect(() => {
//         const checkAuth = () => {
//             const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
//             setIsAuthenticated(adminLoggedIn);
//             setIsLoading(false);

//             // Redirect to admin-login if not authenticated on admin routes
//             if (!adminLoggedIn && location.pathname.startsWith('/admin')) {
//                 navigate('/admin-login', { replace: true });
//             }
//         };
//         checkAuth();
//         // eslint-disable-next-line react-hooks/exhaustive-deps
//     }, []);

//     if (isLoading) {
//         return <div className="flex justify-center items-center h-screen">Loading...</div>;
//     }

//     // Render children or Navigate component based on authentication status
//     return isAuthenticated ? (
//         children
//     ) : (
//         <Navigate to="/admin-login" replace />
//     );
// };

// AdminRouteGuard.propTypes = {
//     children: PropTypes.node.isRequired,
// };

// export default AdminRouteGuard;