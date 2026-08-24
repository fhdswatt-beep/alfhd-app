import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import FullRebuildShell from './FullRebuildShell.jsx';
import fullRebuildCss from './full-rebuild.css?inline';
import fullRebuildOverrides from './full-rebuild-overrides.css?inline';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <FullRebuildShell />
  </React.StrictMode>
);

const mountFullRebuild = () => {
  document.getElementById('alfhd-full-rebuild-style')?.remove();
  document.getElementById('alfhd-full-rebuild-overrides')?.remove();

  const style = document.createElement('style');
  style.id = 'alfhd-full-rebuild-style';
  style.textContent = fullRebuildCss;
  document.head.appendChild(style);

  const overrides = document.createElement('style');
  overrides.id = 'alfhd-full-rebuild-overrides';
  overrides.textContent = fullRebuildOverrides;
  document.head.appendChild(overrides);
};

requestAnimationFrame(() => requestAnimationFrame(mountFullRebuild));
