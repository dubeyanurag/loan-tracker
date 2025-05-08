/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/home-loan-tracker/', // Set base path for GitHub Pages - Uncomment for build/deploy
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts', // Optional setup file
    css: true, // If you need CSS processing during tests
  },
})
