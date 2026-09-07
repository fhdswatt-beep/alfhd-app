// يطبّق إصلاح مفتاح الرد الآلي على src/App.jsx وقت البناء (idempotent)
import fs from 'node:fs';

const FILE = new URL('../src/App.jsx', import.meta.url);
const src = fs.readFileSync(FILE, 'utf8');

if (src.includes('async function aiReadSettings(')) {
  console.log('[ai-patch] already applied');
  process.exit(0);
}

const START = 'async function aiFallbackStatus() {';
const END = 'const aiRpcBlocked = new Set();';
const i = src.indexOf(START);
const j = src.indexOf(END);
if (i === -1 || j === -1 || j < i) {
  console.log('[ai-patch] anchors not found — skipped');
  process.exit(0);
}

const NEW = `async function aiReadSettings() {
 try {
  const res = await fetch(\`\${SUPABASE_URL}/rest/v1/ai_settings?id=eq.1&select=enabled_globally,outbound_enabled,runtime_scope\`, { headers: sbHeaders });
  const rows = await res.json();
  return Array.isArray(rows) && rows[0] ? rows[0] : null;
 } catch (_e) { return null; }
}
async function aiFallbackStatus() {
 const [activeCount, eligibleCount, settings] = await Promise.all([
  sbCount('alfhd_conversations', '&ai_mode=eq.active&tab=neq.handoff'),
  sbCount('alfhd_conversations', '&tab=neq.handoff'),
  aiReadSettings(),
 ]);
 const globalOn = settings ? (settings.enabled_globally !== false && settings.outbound_enabled !== false) : true;
 let scope = 'off';
 if (globalOn && activeCount > 0) scope = activeCount >= eligibleCount ? 'all' : 'selective';
 return { ok: true, fallback: true, scope, enabled: scope !== 'off', active_count: globalOn ? activeCount : 0, eligible_count: eligibleCount };
}
async function aiFallbackSaveScope(scope) {
 try {
  const on = scope !== 'off';
  await fetch(\`\${SUPABASE_URL}/rest/v1/ai_settings?id=eq.1\`, { method: 'PATCH', headers: { ...sbHeaders, 'Prefer': 'return=minimal' },
   body: JSON.stringify({ runtime_scope: scope, enabled_globally: on, outbound_enabled: on }) });
 } catch (_e) { /* ignore */ }
}
async function aiBulkSetMode(mode) {
 for (let round = 0; round < 40; round++) {
  const res = await fetch(\`\${SUPABASE_URL}/rest/v1/alfhd_conversations?select=id&tab=neq.handoff&ai_mode=neq.\${mode}&limit=1000\`, { headers: sbHeaders });
  if (!res.ok) throw new Error('تعذّر قراءة المحادثات: ' + res.status);
  const rows = await res.json();
  if (!Array.isArray(rows) || rows.length === 0) return;
  for (let i2 = 0; i2 < rows.length; i2 += 250) {
   const ids = rows.slice(i2, i2 + 250).map((r) => r.id).join(',');
   const up = await fetch(\`\${SUPABASE_URL}/rest/v1/alfhd_conversations?id=in.(\${ids})\`, {
    method: 'PATCH', headers: { ...sbHeaders, 'Prefer': 'return=minimal' }, body: JSON.stringify({ ai_mode: mode }) });
   if (!up.ok) { const t = await up.text(); throw new Error('تعذّر تغيير حالة الرد: ' + up.status + ' — ' + t); }
  }
 }
}
async function aiFallbackSetGlobal(enabled) {
 const mode = enabled ? 'active' : 'paused';
 await aiFallbackSaveScope(enabled ? 'all' : 'off');
 await aiBulkSetMode(mode);
 const status = await aiFallbackStatus();
 await aiFallbackSaveScope(status.scope);
 return status;
}
async function aiFallbackSetConversation(convId, enabled) {
 if (!convId) throw new Error('محادثة غير معروفة');
 if (enabled) {
  const s = await aiReadSettings();
  if (!s || s.enabled_globally === false || s.outbound_enabled === false) await aiFallbackSaveScope('selective');
 }
 const res = await fetch(\`\${SUPABASE_URL}/rest/v1/alfhd_conversations?id=eq.\${convId}\`, {
  method: 'PATCH', headers: { ...sbHeaders, 'Prefer': 'return=minimal' }, body: JSON.stringify({ ai_mode: enabled ? 'active' : 'paused' }) });
 if (!res.ok) { const t = await res.text(); throw new Error('تعذّر تغيير حالة المحادثة: ' + res.status + ' — ' + t); }
 const status = await aiFallbackStatus();
 await aiFallbackSaveScope(status.scope);
 return status;
}
`;

fs.writeFileSync(FILE, src.slice(0, i) + NEW + src.slice(j), 'utf8');
console.log('[ai-patch] applied');
