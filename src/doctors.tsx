import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DoctorsPage } from './pages/doctors/DoctorsPage';
import { initializeAnalytics } from './lib/analytics';
import './styles/index.css';

// Entry of /doctors/ ("Хирурги"), a separate Vite page next to the home page (see vite.config.ts).
initializeAnalytics({
  measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  enabled: import.meta.env.PROD || import.meta.env.VITE_GA_DEBUG === 'true',
  debug: import.meta.env.VITE_GA_DEBUG === 'true',
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DoctorsPage />
  </StrictMode>,
);
