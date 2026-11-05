import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { DoctorPage } from './pages/doctor/DoctorPage';
import { PROFILES } from './pages/doctor/profiles';
import { initializeAnalytics } from './lib/analytics';
import './styles/index.css';

// Entry of a surgeon's own page: doctors/<slug>/index.html names the doctor in #root's data-doctor.
initializeAnalytics({
  measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  clarityId: import.meta.env.VITE_CLARITY_PROJECT_ID,
  enabled: import.meta.env.PROD || import.meta.env.VITE_GA_DEBUG === 'true',
  debug: import.meta.env.VITE_GA_DEBUG === 'true',
});

const root = document.getElementById('root')!;
const profile = PROFILES[root.dataset.doctor ?? ''];
if (profile) {
  // Analytics adds this name to every click (same "Имя Фамилия" as the Framer doctor pages).
  document.documentElement.setAttribute('data-rr-doctor', profile.shortName);
  createRoot(root).render(
    <StrictMode>
      <DoctorPage profile={profile} />
    </StrictMode>,
  );
}
