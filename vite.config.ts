import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: '/home-loan-tracker/', // Set base path for GitHub Pages - Commented out for local dev
})
