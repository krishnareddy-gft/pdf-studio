
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles.css'

// Disable SW in dev to avoid caching issues; keep in prod builds if needed
if ('serviceWorker' in navigator) {
  if (import.meta && import.meta.env && import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations?.().then(regs => regs.forEach(r => r.unregister()))
    console.log('SW unregistered in dev to prevent stale cache')
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    })
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
