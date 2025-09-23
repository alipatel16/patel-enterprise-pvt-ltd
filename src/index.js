import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Get the root element
const container = document.getElementById('root');

// Check if root element exists
if (!container) {
  throw new Error('Root element with id="root" not found in the HTML');
}

if (process.env.NODE_ENV === 'production' && process.env.REACT_APP_CONSOLE_DISABLED === 'true') {
  console.log = () => { };
  console.warn = () => { };
  console.info = () => { };
  // Keep console.error for critical issues
}

// Create root and render app
const root = createRoot(container);

// Render the app
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Hide initial loader when React app mounts
setTimeout(() => {
  const loader = document.getElementById('initial-loader');
  if (loader) {
    document.body.classList.add('app-loaded');
  }
}, 100);