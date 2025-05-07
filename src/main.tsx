import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx' // Assuming App.tsx will be our main app component
import './index.css' // Standard Vite CSS import
import { AppProvider } from './contexts/AppContext.tsx'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
)
