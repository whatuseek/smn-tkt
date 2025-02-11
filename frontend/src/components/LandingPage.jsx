//  tkt/frontend/sec/components/LandingPage.jsx

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


import { Link } from "react-router-dom";
import { motion } from "framer-motion";
// import { FaWifi, FaTv } from "react-icons/fa"; // Icons for Internet and Cable TV
import landingVideo from '../assets/networking_video.mp4'; // Import video
import "../../src/App.css";
import "../../src/index.css";

const LandingPage = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { duration: 0.8 },
        },
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative flex flex-col items-center justify-center h-screen overflow-hidden"
        >
            {/* Background Video */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <video
                    autoPlay
                    loop
                    muted
                    className="object-cover w-full h-full"
                >
                    <source src={landingVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                </video>
                <div className="absolute inset-0 bg-black opacity-60"></div> {/* Dark overlay for better text visibility */}
            </div>

            <div className="relative z-10 text-center p-6 rounded-lg shadow-2xl bg-black bg-opacity-50">
                {/* Company Logo */}
                {/*
                <div className="mb-6">
                    <img
                        src="/path/to/your/logo.png"
                        alt="Company Logo"
                        className="h-16 mx-auto"
                    />
                </div> */}
                <motion.h1
                    className="text-5xl font-bold mb-4 text-white drop-shadow-lg"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    Connect. Entertain. Everywhere.
                </motion.h1>
                <motion.p
                    className="text-xl mb-6 text-gray-200 drop-shadow-lg"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.4 }}
                >
                    Experience seamless connectivity and entertainment with our services.
                </motion.p>
                {/* Services Description*/}
                <motion.div
                    className="flex flex-col md:flex-row space-x-8 mb-8 items-center justify-center"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.6 }}
                >
                    {/* <div className="text-white flex flex-col items-center mb-4 md:mb-0">
                          <FaWifi className="text-4xl mb-2 text-blue-400 drop-shadow-lg" />
                          <p className="text-gray-300 text-sm">High-speed internet services to keep you connected.</p>
                     </div>
                     <div className="text-white flex flex-col items-center">
                       <FaTv className="text-4xl mb-2 text-red-400 drop-shadow-lg"/>
                       <p className="text-gray-300 text-sm">Premium cable TV packages for ultimate entertainment.</p>
                    </div> */}
                </motion.div>
                {/* Buttons */}
                <motion.div
                    className="space-x-4 flex flex-col md:flex-row items-center justify-center"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                >
                    {/* <Link
                        to="/ticket-form"
                        className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md drop-shadow-lg transform hover:scale-105 transition-transform duration-300 mb-4 md:mb-0"
                    >
                        Tickets
                    </Link> */}
                    <Link
                        to="/admin-login"
                        className="bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition-colors shadow-md drop-shadow-lg transform hover:scale-105 transition-transform duration-300"
                    >
                        Admin Login
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default LandingPage;