// src/context/DashboardContext.js
import { createContext } from 'react';

// Create the context object.
// Providing a default value (null in this case) is good practice,
// though the actual value will come from the Provider in AdminDashboardLayout.
const DashboardContext = createContext(null);

// Export the context object so other components can use it (via useContext hook).
export default DashboardContext;