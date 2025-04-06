// frontend/src/App.jsx
import { BrowserRouter as HashRouter, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import TicketForm from "./components/TicketForm"; // Ensure this path is correct
import TicketList from "./components/TicketList";
import UserUpload from "./components/UserUpload";

const App = () => {
  return (
    // <HashRouter basename="/">
    <HashRouter >
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Admin Login */}
        <Route path="/admin-login" element={<AdminLogin />} />

        {/* Admin Dashboard with nested routes */}
        <Route path="/admin-dashboard/*" element={<AdminDashboard />}>
          <Route index element={<AdminDashboard />} />  {/* Home route - optional if dashboard itself is the home */}
          <Route path="tickets" element={<TicketList />} />
          <Route path="addUser" element={<UserUpload />} />
          <Route path="ticketForm" element={<TicketForm />} />
          {/* <Route path="*" element={<Navigate to="/admin-dashboard" />} /> */}
        </Route>

        {/* Catch-all route */}
        <Route path="*" element={<LandingPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;