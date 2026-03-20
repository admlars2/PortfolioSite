import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Suppress React DevTools semver error (known issue with React 19)
if (import.meta.env.DEV) {
  // Catch uncaught errors from React DevTools
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('Invalid argument not valid semver') ||
      event.message?.includes('validateAndParse') ||
      event.filename?.includes('agent.js') ||
      event.filename?.includes('index.js') ||
      event.message?.includes('message channel closed') ||
      event.message?.includes('asynchronous response')
    ) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  // Suppress console errors from React DevTools
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    // Suppress the semver validation error from React DevTools
    if (
      args.length > 0 &&
      typeof args[0] === 'string' &&
      (args[0].includes('Invalid argument not valid semver') ||
       args[0].includes('validateAndParse'))
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  // Suppress WebGL fallback warning (browser warning, not actionable)
  const originalWarn = console.warn;
  console.warn = (...args: unknown[]) => {
    // Suppress WebGL fallback deprecation warning
    if (
      args.length > 0 &&
      typeof args[0] === 'string' &&
      (args[0].includes('Automatic fallback to software WebGL') ||
       args[0].includes('GroupMarkerNotSet'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

// Suppress browser extension message channel errors (harmless) - always active
window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const errorMessage = reason?.message || (typeof reason === 'string' ? reason : String(reason || ''));
  
  if (
    errorMessage.includes('message channel closed') ||
    errorMessage.includes('asynchronous response') ||
    errorMessage.includes('A listener indicated an asynchronous response')
  ) {
    event.preventDefault();
    return;
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
