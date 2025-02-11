// frontend/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ticketFormConfig = {
  plugins: [react()],
  build: {
    rollupOptions: {
      input: path.resolve(__dirname, 'src/ticket-form/index.html'),
      output: {
        entryFileNames: 'ticket-form.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: 'dist-ticket-form',
    emptyOutDir: true,
  },
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  if (mode === 'ticketForm') {
    return ticketFormConfig;
  } else {
    return {
      plugins: [react()],
      build: {
        rollupOptions: {
          input: path.resolve(__dirname, 'index.html'),
        },
        outDir: 'dist',
        emptyOutDir: true,
      },
    };
  }
});