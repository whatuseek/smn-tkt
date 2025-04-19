//
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'; // <--- Import BrowserRouter
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* --- Ensure App is wrapped by BrowserRouter --- */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
    {/* --- End Wrapper --- */}

  </StrictMode>,
)
