import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ApprovedMobileShell from './ApprovedMobileShell.jsx';
import premiumCss from './reference-exact.css?inline';
import approvedMobileCss from './approved-mobile.css?inline';
import approvedMobilePolishCss from './approved-mobile-polish.css?inline';
import approvedMobileMotionCss from './approved-mobile-motion.css?inline';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ApprovedMobileShell />
  </React.StrictMode>
);

// App.jsx still contains a large legacy inline theme block. Inject the approved
// visual layers after React mounts so this experimental branch always wins the
// cascade without touching production logic or data behavior.
const mountPremiumLayer = () => {
  document.getElementById('alfhd-premium-final-layer')?.remove();
  document.getElementById('alfhd-approved-mobile-layer')?.remove();
  document.getElementById('alfhd-approved-mobile-polish-layer')?.remove();
  document.getElementById('alfhd-approved-mobile-motion-layer')?.remove();

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
};

requestAnimationFrame(() => requestAnimationFrame(mountPremiumLayer));
