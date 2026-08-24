import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ApprovedMobileShell from './ApprovedMobileShell.jsx';
import premiumCss from './reference-exact.css?inline';
import approvedMobileCss from './approved-mobile.css?inline';
import approvedMobilePolishCss from './approved-mobile-polish.css?inline';
import approvedMobileMotionCss from './approved-mobile-motion.css?inline';
import approvedSystemFinalCss from './approved-system-final.css?inline';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ApprovedMobileShell />
  </React.StrictMode>
);

// Keep every approved visual layer after the large legacy inline style block in App.jsx.
// The system-final layer is mounted last so it remains the final source of visual truth
// on this experimental branch without changing production data or business logic.
const mountPremiumLayer = () => {
  document.getElementById('alfhd-premium-final-layer')?.remove();
  document.getElementById('alfhd-approved-mobile-layer')?.remove();
  document.getElementById('alfhd-approved-mobile-polish-layer')?.remove();
  document.getElementById('alfhd-approved-mobile-motion-layer')?.remove();
  document.getElementById('alfhd-approved-system-final-layer')?.remove();

  const premium = document.createElement('style');
  premium.id = 'alfhd-premium-final-layer';
  premium.textContent = premiumCss;
  document.head.appendChild(premium);

  const approved = document.createElement('style');
  approved.id = 'alfhd-approved-mobile-layer';
  approved.textContent = approvedMobileCss;
  document.head.appendChild(approved);

  const polish = document.createElement('style');
  polish.id = 'alfhd-approved-mobile-polish-layer';
  polish.textContent = approvedMobilePolishCss;
  document.head.appendChild(polish);

  const motion = document.createElement('style');
  motion.id = 'alfhd-approved-mobile-motion-layer';
  motion.textContent = approvedMobileMotionCss;
  document.head.appendChild(motion);

  const systemFinal = document.createElement('style');
  systemFinal.id = 'alfhd-approved-system-final-layer';
  systemFinal.textContent = approvedSystemFinalCss;
  document.head.appendChild(systemFinal);
};

requestAnimationFrame(() => requestAnimationFrame(mountPremiumLayer));
