import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import TicketForm from "./components/TicketForm";
import TicketList from "./components/TicketList";
import UserUpload from "./components/UserUpload";

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Admin Dashboard & Nested Routes */}
        <Route path="/admin-dashboard" element={<AdminDashboard />}>
          <Route index element={<AdminDashboard />} />
          <Route path="tickets" element={<TicketList />} />
          <Route path="addUser" element={<UserUpload />} />
          <Route path="ticketForm" element={<TicketForm />} />
        </Route>

        {/* Catch-All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};

export default App;
