//  tkt/frontend/src/components/AdminRouteGuard.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';

const AdminRouteGuard = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const checkAuth = () => {
            const adminLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
            setIsAuthenticated(adminLoggedIn);
            setIsLoading(false);
            if (!adminLoggedIn && location.pathname === '/admin-dashboard') {
                navigate('/admin-login', { replace: true });
            }
        };
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (isLoading) {
        return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }
    if (isAuthenticated) {
        return children;
    } else {
        return null
    }
};

AdminRouteGuard.propTypes = {
    children: PropTypes.node.isRequired,
};

export default AdminRouteGuard;