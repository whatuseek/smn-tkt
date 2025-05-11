// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';         // Import App from the same directory
import './styles/index.css';    // Import global styles from the styles directory
// MUI Date Picker Imports
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns' // Or AdapterDayjs, etc.

// Find the root DOM element
const rootElement = document.getElementById('root');

// Create a React root if the element exists
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      {/* Wrap App with LocalizationProvider */}
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <App />{/* Main App Component */}
      </LocalizationProvider>
    </React.StrictMode>,
  );
} else {
  console.error('Failed to find the root element with ID "root". Ensure it exists in your index.html.');
}