import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import FullRebuildShell from './FullRebuildShell.jsx';
import fullRebuildCss from './full-rebuild.css?inline';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <FullRebuildShell />
  </React.StrictMode>
);

const mountFullRebuild = () => {
  document.getElementById('alfhd-full-rebuild-style')?.remove();
  const style = document.createElement('style');
  style.id = 'alfhd-full-rebuild-style';
  style.textContent = fullRebuildCss;
  document.head.appendChild(style);
};

requestAnimationFrame(() => requestAnimationFrame(mountFullRebuild));
