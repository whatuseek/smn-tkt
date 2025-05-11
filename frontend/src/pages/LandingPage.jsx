// src/pages/LandingPage.jsx

import { Link } from "react-router-dom";
import { motion } from "framer-motion";
// Adjust asset import path relative to the 'pages' directory
import landingVideo from '../assets/networking_video.mp4';
// Adjust CSS import paths relative to the 'pages' directory
import "../styles/App.css"; // Assuming App.css has global styles you need
import "../styles/index.css"; // Assuming index.css has global styles (like Tailwind base)

const LandingPage = () => {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.8 } },
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="relative flex flex-col items-center justify-center h-screen overflow-hidden" // Uses Tailwind classes from index.css/tailwind config
        >
            {/* Background Video & Overlay */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                 <video
                    autoPlay
                    loop
                    muted
                    playsInline // Important for mobile playback
                    className="object-cover w-full h-full"
                 >
                    <source src={landingVideo} type="video/mp4" />
                    Your browser does not support the video tag.
                 </video>
                 {/* Dark overlay */}
                 <div className="absolute inset-0 bg-black opacity-60"></div>
            </div>

            {/* Content Container */}
            <div className="font-raleway relative z-10 text-center p-6 sm:p-8 rounded-lg shadow-2xl bg-black bg-opacity-60 max-w-xl mx-4">
                <motion.h1
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.2 }}
                    className="font-raleway text-4xl sm:text-5xl font-bold mb-4 text-white drop-shadow-lg" // Ensure 'font-raleway' is configured in Tailwind/CSS
                >
                    Support Ticket Portal
                 </motion.h1>
                <motion.p
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 0.4 }}
                    className="font-raleway text-lg sm:text-xl mb-8 text-gray-200 drop-shadow-lg"
                >
                    Internal team access.
                </motion.p>

                {/* Single Login Button */}
                <motion.div
                     variants={itemVariants}
                     initial="hidden"
                     animate="visible"
                     transition={{ delay: 0.6 }}
                     className="flex items-center justify-center"
                >
                    <Link
                        to="/login" // Points to the LoginPage route
                        className="font-raleway bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-black/50 transition-all duration-300 shadow-md drop-shadow-lg transform hover:scale-105 text-center text-lg"
                    >
                        Login
                    </Link>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default LandingPage;