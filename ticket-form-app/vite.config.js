// ticket-form-app/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/", // Ensure that the base URL is correctly configured.
  server: {
    port: 5171, // Replace with your desired port number
  },
})