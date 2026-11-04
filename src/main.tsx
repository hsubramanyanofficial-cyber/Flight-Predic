// Suppress Vite WebSocket HMR errors in containerized preview iframe environment
window.addEventListener('unhandledrejection', (event) => {
  const reason = event?.reason;
  const msg = typeof reason === 'string' ? reason : reason?.message || '';
  if (msg.includes('WebSocket') || msg.includes('ws://') || msg.includes('wss://') || msg.includes('closed without opened')) {
    event.preventDefault();
  }
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (msg.includes('WebSocket') || msg.includes('closed without opened')) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
