import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { initializeAnalytics } from './lib/analytics';
import './styles/index.css';

initializeAnalytics({
  measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  enabled: import.meta.env.PROD || import.meta.env.VITE_GA_DEBUG === 'true',
  debug: import.meta.env.VITE_GA_DEBUG === 'true',
});

// antd is scoped to the lazily loaded parts via <AntdProvider> (src/theme/AntdProvider.tsx),
// which keeps it out of the first-paint bundle.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
