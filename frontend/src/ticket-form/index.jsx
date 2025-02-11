// frontend/src/ticket-form/index.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import TicketForm from '../components/TicketForm'; // Adjust the path to your TicketForm component
import '../../index.css'; // Import global styles if needed, adjust path as necessary

// Render the TicketForm component into the 'root' element
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <TicketForm />
  </React.StrictMode>
);