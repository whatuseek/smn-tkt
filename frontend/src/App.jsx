// tkt/frontend/src/App.jsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import TicketForm from "./components/TicketForm"; // Ensure this path is correct
const App = () => {
    return (
        <Router>
            <Routes>
                {/* Landing Page */}
                <Route path="/" element={<LandingPage />} />

                {/* Admin Login */}
                <Route path="/admin-login" element={<AdminLogin />} />

                {/* Ticket Form - as a Route */}
                <Route path="/ticket-form" element={<TicketForm />} />

                {/* Admin Dashboard */}
                <Route path="/admin-dashboard" element={<AdminDashboard />} />
            </Routes>
        </Router>
    );
};

export default App;