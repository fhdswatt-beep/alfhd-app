import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ApprovedMobileShell from './ApprovedMobileShell.jsx';
import { startDesignRebuild } from './design-rebuild.js';
import premiumCss from './reference-exact.css?inline';
import approvedMobileCss from './approved-mobile.css?inline';
import approvedMobilePolishCss from './approved-mobile-polish.css?inline';
import approvedMobileMotionCss from './approved-mobile-motion.css?inline';
import approvedSystemFinalCss from './approved-system-final.css?inline';
import approvedEverywhereCss from './approved-everywhere.css?inline';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ApprovedMobileShell />
  </React.StrictMode>
);

// App.jsx contains substantial legacy inline styling. Mount all approved visual
// layers after React, with approved-everywhere last, so every section—including
// inline-styled warehouse/admin/AI screens—uses the same final design language.
const mountPremiumLayer = () => {
  document.getElementById('alfhd-premium-final-layer')?.remove();
  document.getElementById('alfhd-approved-mobile-layer')?.remove();
  document.getElementById('alfhd-approved-mobile-polish-layer')?.remove();
  document.getElementById('alfhd-approved-mobile-motion-layer')?.remove();
  document.getElementById('alfhd-approved-system-final-layer')?.remove();
  document.getElementById('alfhd-approved-everywhere-layer')?.remove();

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

  const everywhere = document.createElement('style');
  everywhere.id = 'alfhd-approved-everywhere-layer';
  everywhere.textContent = approvedEverywhereCss;
  document.head.appendChild(everywhere);
};

requestAnimationFrame(() => requestAnimationFrame(() => {
  mountPremiumLayer();
  startDesignRebuild();
}));
