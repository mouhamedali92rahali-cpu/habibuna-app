import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/amiri/400.css';
import '@fontsource/amiri/700.css';
import '@fontsource/noto-naskh-arabic/400.css';
import '@fontsource/noto-naskh-arabic/600.css';
import '@fontsource/tajawal/400.css';
import '@fontsource/tajawal/700.css';
import './index.css';
import App from './App';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
