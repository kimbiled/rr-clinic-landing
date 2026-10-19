import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/index.css';

// antd is scoped to the lazily loaded parts via <AntdProvider> (src/theme/AntdProvider.tsx),
// which keeps it out of the first-paint bundle.
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
