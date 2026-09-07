// Visual-only rebuild layer. It transforms the legacy Telegram inline palette
// after React renders, including screens/modals mounted later. No data or business logic is touched.

const oldPalette = new Map([
  ['rgb(10, 14, 20)', '#09090d'],
  ['rgb(20, 26, 34)', '#121217'],
  ['rgb(30, 38, 48)', '#191820'],
  ['rgb(76, 141, 255)', '#8a55ff'],
  ['rgb(58, 120, 232)', '#7446e8'],
  ['rgb(52, 211, 153)', '#52d78c'],
  ['rgb(242, 80, 80)', '#f06878'],
  ['rgb(244, 247, 251)', '#f8f7fb'],
  ['rgb(139, 154, 179)', '#9693a2'],
  ['rgb(143, 160, 181)', '#777482'],
]);

const surfaceColors = new Set([
  'rgb(10, 14, 20)', 'rgb(20, 26, 34)', 'rgb(30, 38, 48)',
  'rgb(15, 23, 42)', 'rgb(17, 24, 39)',
]);

function rgbaSwap(value='') {
  return value
    .replace(/rgba?\(76,\s*141,\s*255(?:,\s*([\d.]+))?\)/g, (_,a)=>a==null?'rgb(138, 85, 255)':`rgba(138, 85, 255, ${a})`)
    .replace(/rgba?\(58,\s*120,\s*232(?:,\s*([\d.]+))?\)/g, (_,a)=>a==null?'rgb(116, 70, 232)':`rgba(116, 70, 232, ${a})`)
    .replace(/rgba?\(34,\s*158,\s*217(?:,\s*([\d.]+))?\)/g, (_,a)=>a==null?'rgb(126, 81, 255)':`rgba(126, 81, 255, ${a})`)
    .replace(/rgba?\(255,\s*255,\s*255,\s*0\.0?7\)/g,'rgba(255,255,255,.075)');
}

function setImportant(el, prop, val) {
  try { el.style.setProperty(prop, val, 'important'); } catch {}
}

function tuneElement(el) {
  if (!(el instanceof HTMLElement)) return;
  if (el.closest('.approved-home, .approved-bottom-nav')) return; // already rebuilt shell

  const cs = getComputedStyle(el);
  const inline = el.getAttribute('style') || '';
  const tag = el.tagName;

  // Translate exact legacy colors used by App.jsx inline style object.
  const colorProps = ['color','background-color','border-color','border-top-color','border-right-color','border-bottom-color','border-left-color'];
  for (const prop of colorProps) {
    const current = cs.getPropertyValue(prop).trim();
    const next = oldPalette.get(current);
    if (next) setImportant(el, prop, next);
  }

  // Translate gradients/shadows that still contain Telegram blue.
  for (const prop of ['background','background-image','box-shadow','text-shadow','border']) {
    const val = cs.getPropertyValue(prop);
    const swapped = rgbaSwap(val);
    if (swapped && swapped !== val && swapped !== 'none') setImportant(el, prop, swapped);
  }

  // Legacy panels/cards built only with inline styles: make them premium surfaces.
  if (surfaceColors.has(cs.backgroundColor) || /#141A22|#181F29|#1E2630|#111827|#0F172A/i.test(inline)) {
    setImportant(el, 'background', 'linear-gradient(155deg, rgba(27,26,34,.98), rgba(17,17,22,.98))');
    if (cs.borderStyle !== 'none' || /border/i.test(inline)) setImportant(el, 'border-color', 'rgba(255,255,255,.075)');
    if (/borderRadius|border-radius/i.test(inline) || ['SECTION','ARTICLE'].includes(tag)) setImportant(el, 'border-radius', window.innerWidth < 861 ? '20px' : '16px');
  }

  // Inputs/selectors in every section.
  if (['INPUT','TEXTAREA','SELECT'].includes(tag)) {
    setImportant(el, 'background', '#18181e');
    setImportant(el, 'border-color', 'rgba(255,255,255,.085)');
    setImportant(el, 'color', '#f8f7fb');
    setImportant(el, 'border-radius', '13px');
    setImportant(el, 'box-shadow', 'none');
  }

  // Operational buttons that still carry the old primary blue.
  if (tag === 'BUTTON') {
    const bg = cs.backgroundColor;
    const hasOldBlue = bg === 'rgb(76, 141, 255)' || bg === 'rgb(58, 120, 232)' || /76,\s*141,\s*255|#4C8DFF|#3A78E8/i.test(inline);
    if (hasOldBlue) {
      setImportant(el, 'background', 'linear-gradient(135deg,#9d6aff,#7446e8)');
      setImportant(el, 'border-color', 'rgba(181,137,255,.32)');
      setImportant(el, 'box-shadow', '0 10px 26px rgba(116,70,232,.22)');
      setImportant(el, 'color', '#fff');
    }
    if (cs.borderRadius !== '0px') setImportant(el, 'border-radius', '13px');
  }

  // Tables and dense data views across warehouse/debts/sales/admin.
  if (tag === 'TH') {
    setImportant(el, 'background', '#121217');
    setImportant(el, 'color', '#9693a2');
    setImportant(el, 'border-color', 'rgba(255,255,255,.07)');
  }
  if (tag === 'TD') {
    setImportant(el, 'border-color', 'rgba(255,255,255,.055)');
  }

  // Mobile: turn modal-like fixed panels into premium sheets where appropriate.
  if (window.innerWidth < 861 && cs.position === 'fixed' && /bottom|inset|height|maxHeight|max-height/i.test(inline)) {
    if (cs.backgroundColor !== 'rgba(0, 0, 0, 0)' && el.children.length > 0) {
      setImportant(el, 'border-color', 'rgba(255,255,255,.08)');
    }
  }
}

function rebuild(root=document) {
  if (root instanceof HTMLElement) tuneElement(root);
  root.querySelectorAll?.('*').forEach(tuneElement);
}

let scheduled = false;
function schedule(root=document) {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => {
    scheduled = false;
    rebuild(root);
  });
}

export function startDesignRebuild() {
  const run = () => schedule(document);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, {once:true});
  else run();

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        m.addedNodes.forEach(n => { if (n instanceof HTMLElement) schedule(n); });
      } else if (m.type === 'attributes' && m.target instanceof HTMLElement) {
        schedule(m.target);
      }
    }
  });
  observer.observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:['style','class']});
  window.addEventListener('resize', run, {passive:true});
  setTimeout(run, 400);
  setTimeout(run, 1200);
}
