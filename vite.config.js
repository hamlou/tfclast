import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Fixed port for consistent Firebase verification links
    strictPort: true // Fail if port is in use (instead of auto-changing)
  }
})
