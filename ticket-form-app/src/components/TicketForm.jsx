// ticket-form-app/src/components/TicketForm.jsx
import { useState, useEffect } from "react";
import axios from "axios";
import { FaChevronDown } from "react-icons/fa";
import "../../src/App.css";
import "../../src/index.css";
import { motion } from 'framer-motion';

const TicketForm = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [formData, setFormData] = useState({
    user_id: "",
    mobile_number: "",
    location: "",
    issue_type: "",
    comments: "",
  });
  const [errors, setErrors] = useState({});
  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast] = useState({ message: "", type: "" });

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Clear toast notification after 3 seconds
  useEffect(() => {
    if (toast.message) {
      const timeout = setTimeout(() => setToast({ message: "", type: "" }), 3000);
      return () => clearTimeout(timeout);
    }
  }, [toast]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error dynamically for each field
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  // Handle dropdown selection
  const handleDropdownSelect = (type) => {
    setFormData({ ...formData, issue_type: type });
    setShowDropdown(false);

    // Clear error for issue_type
    if (errors.issue_type) {
      setErrors({ ...errors, issue_type: "" });
    }
  };

  // Validate form fields
  const validateForm = () => {
    const newErrors = {};

    if (!formData.user_id.trim()) newErrors.user_id = "User ID is required.";
    if (!formData.mobile_number.match(/^\d{10}$/))
      newErrors.mobile_number = "Enter a valid 10-digit mobile number.";
    if (!formData.location.trim()) newErrors.location = "Location is required.";
    if (!formData.issue_type) newErrors.issue_type = "Please select an issue type.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0; // Returns true if no errors
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const response = await axios.post(import.meta.env.VITE_BACKEND_URL + "/api/tickets",
        formData); // Updated API call

      if (response.status === 201) {
        setToast({ message: "Ticket created successfully!", type: "success" });
        setFormData({
          user_id: "",
          mobile_number: "",
          location: "",
          issue_type: "",
          comments: "",
        });
      } else {
        throw new Error("Unexpected response from the server.");
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || "Error creating ticket.",
        type: "error",
      });
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create Support Ticket</h2>

      {/* Timestamp */}
      <div className="mb-6 text-center">
        <div className="text-xl font-bold text-gray-700">
          {currentTime.toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </div>
        <div className="text-2xl font-mono text-blue-600">
          {currentTime.toLocaleTimeString("en-US", {
            hour12: true,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </div>

      {/* Toast Notification */}
      {toast.message && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className={`mb-4 px-4 py-3 rounded ${toast.type === "success"
            ? "bg-green-100 border border-green-400 text-green-700"
            : "bg-red-100 border border-red-400 text-red-700"
            } flex items-center animate-fade-in-out`}
        >
          <span>{toast.message}</span>
        </motion.div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">User ID <span className="text-red-600 font-bold">*</span>
          </label>
          <input
            type="text"
            name="user_id"
            placeholder="Enter User ID"
            value={formData.user_id}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
          />
          {errors.user_id && (
            <p className="text-red-500 text-xs mt-1">{errors.user_id}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Mobile Number <span className="text-red-600 font-bold">*</span></label>
          <input
            type="text"
            name="mobile_number"
            placeholder="Enter registered Mobile #No."
            value={formData.mobile_number}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            pattern="\d{10}"
          />
          {errors.mobile_number && (
            <p className="text-red-500 text-xs mt-1">{errors.mobile_number}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Address <span className="text-red-600 font-bold">*</span></label>
          <textarea
            name="location"
            placeholder="Enter full address"
            value={formData.location}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="2"
          ></textarea>
          {errors.location && (
            <p className="text-red-500 text-xs mt-1">{errors.location}</p>
          )}
        </div>

        <div>
          <label className="block text-gray-700 text-sm font-bold mb-2">Issue Type <span className="text-red-600 font-bold">*</span></label>
          <div className="relative" onClick={() => setShowDropdown(!showDropdown)}>
            <div className="flex items-center shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline cursor-pointer">
              {formData.issue_type || "Select Issue Type"}
              <FaChevronDown
                className={`ml-auto transform transition-transform duration-300 ${showDropdown ? "rotate-180" : "rotate-0"
                  }`}
              />
            </div>
            {showDropdown && (
              <ul className="absolute z-10 bg-white border rounded shadow-md w-full mt-2">
                {[
                  "HARDWARE",
                  "SOFTWARE",
                  "NETWORK",
                  "CONNECTION",
                  "SPEED",
                  "INTERMITTENT",
                  "ROUTER",
                  "BILLING",
                  "INSTALLATION",
                  "WIFI",
                  "SERVICE_OUTAGE",
                  "PACKAGE",
                  "TECHNICAL",
                  "DEVICE",
                  "OTHER",
                ].map((type) => (
                  <li
                    key={type}
                    onClick={() => handleDropdownSelect(type)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    {type}
                  </li>
                ))}
              </ul>
            )}
          </div>
          {errors.issue_type && (
            <p className="text-red-500 text-xs mt-1">{errors.issue_type}</p>
          )}
        </div>

        <div>

          <label className="block text-gray-700 text-sm font-bold mb-2">Description <span className="text-gray-400 font-extralight">(optional)</span></label>
          <textarea
            name="comments"
            placeholder="Enter issue details"
            value={formData.comments}
            onChange={handleChange}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            rows="4"
          ></textarea>
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-300"
        >
          Submit Ticket
        </button>
      </form>
    </div>
  );
};

export default TicketForm;