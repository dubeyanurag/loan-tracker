import React from 'react'
import * as ReactDOM from 'react-dom/client' // Changed import style
import App from './App' // Removed .tsx extension
import './index.css' 
import { AppProvider } from './contexts/AppContext' // Removed .tsx extension

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>,
)
