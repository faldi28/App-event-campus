import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      // This policy allows both 'unsafe-eval' and 'unsafe-inline'
      'Content-Security-Policy': "script-src 'self' 'unsafe-eval' 'unsafe-inline'"
    }
  }
})