import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import FullRebuildShellV3 from './FullRebuildShellV3.jsx';
import fullRebuildV2Css from './full-rebuild-v2.css?inline';
import fullRebuildOverrides from './full-rebuild-overrides.css?inline';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <FullRebuildShellV3 />
  </React.StrictMode>
);

const mountFullRebuild = () => {
  document.getElementById('alfhd-full-rebuild-v2-style')?.remove();
  document.getElementById('alfhd-full-rebuild-overrides')?.remove();

  const style = document.createElement('style');
  style.id = 'alfhd-full-rebuild-v2-style';
  style.textContent = fullRebuildV2Css;
  document.head.appendChild(style);

  const overrides = document.createElement('style');
  overrides.id = 'alfhd-full-rebuild-overrides';
  overrides.textContent = fullRebuildOverrides;
  document.head.appendChild(overrides);
};

requestAnimationFrame(() => requestAnimationFrame(mountFullRebuild));
