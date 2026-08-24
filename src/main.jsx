import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import premiumCss from './reference-exact.css?inline';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// App.jsx still contains a large legacy inline theme block. Inject the approved
// premium UI layer after React mounts so this experimental branch always wins
// the cascade without touching production logic or data behavior.
const mountPremiumLayer = () => {
  const old = document.getElementById('alfhd-premium-final-layer');
  if (old) old.remove();
  const style = document.createElement('style');
  style.id = 'alfhd-premium-final-layer';
  style.textContent = premiumCss;
  document.head.appendChild(style);
};

requestAnimationFrame(() => requestAnimationFrame(mountPremiumLayer));
