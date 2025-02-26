// frontend/src/components/AdminLogin.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Read credentials from environment variables
    const hardcodedAdminId = import.meta.env.VITE_ADMIN_ID;
    const hardcodedPassword = import.meta.env.VITE_ADMIN_PASSWORD;

    if (adminId === hardcodedAdminId && password === hardcodedPassword) {
      alert("Login successful!");
      // Store authentication status in local storage
      localStorage.setItem("adminLoggedIn", "true");
      navigate("/admin-dashboard");
    } else {
      alert("Invalid credentials. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen shadow-emerald-100 bo">
      <h1 className="font-raleway text-white text-2xl font-bold mb-4">Admin Login</h1>
      <input
        type="text"
        placeholder="Enter Admin ID"
        value={adminId}
        onChange={(e) => setAdminId(e.target.value)}
        className="font-raleway mb-4 px-3 py-2 border rounded w-64"
      />
      <input
        type="password"
        placeholder="Enter Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="font-raleway mb-4 px-3 py-2 border rounded w-64"
      />
      <button
        onClick={handleLogin}
        className="font-raleway bg-green-700 text-white px-4 py-2 rounded hover:bg-green-500"
      >
        Login
      </button>
    </div>
  );
};

export default AdminLogin;