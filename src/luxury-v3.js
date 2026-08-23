// AlFhd Luxury Tech V3 — interaction layer only; no business logic.
const SELECTORS = [
  '.alfhd-order-card', '.alfhd-stat-card', '.alfhd-modal',
  '[class*="orderCard"]', '[class*="statCard"]'
];

function add3DTilt(el) {
  if (!el || el.dataset.luxTilt === '1') return;
  el.dataset.luxTilt = '1';
  el.classList.add('lux-3d-surface');
  const move = (e) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - .5;
    const y = (e.clientY - r.top) / r.height - .5;
    el.style.setProperty('--lux-rx', `${(-y * 5).toFixed(2)}deg`);
    el.style.setProperty('--lux-ry', `${(x * 6).toFixed(2)}deg`);
    el.style.setProperty('--lux-mx', `${((x + .5) * 100).toFixed(1)}%`);
    el.style.setProperty('--lux-my', `${((y + .5) * 100).toFixed(1)}%`);
  };
  const leave = () => {
    el.style.setProperty('--lux-rx', '0deg');
    el.style.setProperty('--lux-ry', '0deg');
  };
  el.addEventListener('pointermove', move, { passive: true });
  el.addEventListener('pointerleave', leave, { passive: true });
}

function classify() {
  document.documentElement.classList.add('lux-v3-live');
  const root = document.querySelector('#root > div');
  if (root) root.classList.add('lux-app-root');
  document.querySelectorAll('aside').forEach((e) => e.classList.add('lux-sidebar'));
  document.querySelectorAll('header').forEach((e) => e.classList.add('lux-topbar'));
  document.querySelectorAll('nav').forEach((e) => e.classList.add('lux-nav'));
  document.querySelectorAll('button').forEach((e) => e.classList.add('lux-button'));
  document.querySelectorAll('input,textarea,select').forEach((e) => e.classList.add('lux-input'));
  SELECTORS.forEach((s) => document.querySelectorAll(s).forEach(add3DTilt));

  // Promote visually card-like inline-style surfaces without touching app behavior.
  document.querySelectorAll('div').forEach((e) => {
    if (e.dataset.luxScan === '1') return;
    e.dataset.luxScan = '1';
    const st = e.getAttribute('style') || '';
    if (/border-radius:\s*(1[2-9]|2\d)px/i.test(st) && /background/i.test(st) && e.children.length > 0) {
      e.classList.add('lux-auto-card');
      if (e.getBoundingClientRect().width > 180) add3DTilt(e);
    }
  });
}

let raf = 0;
const schedule = () => {
  cancelAnimationFrame(raf);
  raf = requestAnimationFrame(classify);
};

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', schedule, { once: true });
else schedule();
new MutationObserver(schedule).observe(document.documentElement, { childList: true, subtree: true });
