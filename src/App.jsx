import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
MessageSquare, Package, Users, LogOut, Search,
Plus, BarChart3, CheckCircle2, XCircle,
Truck, Printer, ChevronDown, X, Shield, ShieldCheck,
Eye, EyeOff, Trash2, Edit3, UserPlus, Facebook,
ArrowUpRight, Sparkles, Bot,
Pin, Phone, MapPin, Calendar, RefreshCw,
Mic, Send, Image, ArrowRight,
AlertCircle,
Warehouse, ShoppingCart, CreditCard, DollarSign,
TrendingUp, Percent, Home, Bell,
LayoutDashboard, Boxes, Receipt, UserCog, FileBarChart,
} from 'lucide-react';

// ──────────────────────────────────────────────
// اتصال Supabase
// ──────────────────────────────────────────────
const SUPABASE_URL = 'https://wqfuovvebgipiowaarbo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZnVvdnZlYmdpcGlvd2FhcmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTM2ODEsImV4cCI6MjA5NzQ4OTY4MX0.xeQ80kco6TOpbyMnYonzSCBDI3Hn_EKiavKKfC7kLl8';
const WA_BRIDGE_URL = 'https://alfhd-wa-bridge-production.up.railway.app';
const FB_APP_ID = '1011276044687764';
const FB_REDIRECT_URI = 'https://alfhd-app.vercel.app/';
const FB_OAUTH_SCOPE = 'pages_show_list,pages_messaging,pages_manage_metadata,public_profile,business_management';
const FB_EXCHANGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/dynamic-processor`;
const FB_SUBSCRIBE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fb-subscribe-page`;
const FB_SEND_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fb-send-message`;
const ORDER_EXTRACT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/order-extract-from-image`;
const FB_POLL_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fb-poll-messages`;
const JENNI_CREATE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/jenni-create-shipment`;
const JENNI_SYNC_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/jenni-sync`;
const JENNI_UPDATE_STATUS_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/jenni-update-status`;
const JENNI_STICKERS_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/jenni-stickers`;

const IRAQ_GOVERNORATES = [
{ code: 'BGD', name: 'بغداد' }, { code: 'BAS', name: 'البصرة' },
{ code: 'NIN', name: 'نينوى' }, { code: 'ARB', name: 'أربيل' },
{ code: 'NJF', name: 'النجف' }, { code: 'KRB', name: 'كربلاء' },
{ code: 'BBL', name: 'بابل' }, { code: 'DHI', name: 'ذي قار' },
{ code: 'DYL', name: 'ديالى' }, { code: 'ANB', name: 'الأنبار' },
{ code: 'KRK', name: 'كركوك' }, { code: 'WST', name: 'واسط' },
{ code: 'SAH', name: 'صلاح الدين' }, { code: 'QAD', name: 'القادسية' },
{ code: 'MYS', name: 'ميسان' }, { code: 'MTH', name: 'المثنى' },
{ code: 'DOH', name: 'دهوك' }, { code: 'SMH', name: 'السليمانية' },
];

function startFacebookLogin() {
const dialogUrl = new URL('https://www.facebook.com/v23.0/dialog/oauth');
dialogUrl.searchParams.set('client_id', FB_APP_ID);
dialogUrl.searchParams.set('redirect_uri', FB_REDIRECT_URI);
dialogUrl.searchParams.set('scope', FB_OAUTH_SCOPE);
dialogUrl.searchParams.set('response_type', 'code');
window.location.href = dialogUrl.toString();
}

const sbHeaders = {
'apikey': SUPABASE_KEY,
'Authorization': `Bearer ${SUPABASE_KEY}`,
'Content-Type': 'application/json',
'Accept-Profile': 'public',
'Content-Profile': 'public',
};
async function sbSelect(table, query = '') {
const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*${query}`, { headers: sbHeaders });
if (!res.ok) throw new Error(`sbSelect ${table} failed: ${res.status}`);
return res.json();
}
async function sbSelectColumns(table, columns, query = '') {
const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}${query}`, { headers: sbHeaders });
if (!res.ok) throw new Error(`sbSelectColumns ${table} failed: ${res.status}`);
return res.json();
}
async function sbInsert(table, payload) {
const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
method: 'POST',
headers: { ...sbHeaders, 'Prefer': 'return=representation' },
body: JSON.stringify(payload),
});
if (!res.ok) {
const errBody = await res.text();
throw new Error(`sbInsert ${table} failed: ${res.status} — ${errBody}`);
}
return res.json();
}
async function sbUpdate(table, id, payload) {
const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
method: 'PATCH',
headers: { ...sbHeaders, 'Prefer': 'return=representation' },
body: JSON.stringify(payload),
});
if (!res.ok) {
const errBody = await res.text();
throw new Error(`sbUpdate ${table} failed: ${res.status} — ${errBody}`);
}
return res.json();
}
async function sbDelete(table, id) {
const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
method: 'DELETE', headers: sbHeaders,
});
if (!res.ok) {
const errBody = await res.text();
throw new Error(`sbDelete ${table} failed: ${res.status} — ${errBody}`);
}
return true;
}
function fileToBase64(file) {
return new Promise((resolve, reject) => {
const reader = new FileReader();
reader.onload = () => {
const result = reader.result || '';
const base64 = String(result).split(',')[1] || '';
resolve({ base64, mediaType: file.type || 'image/jpeg' });
};
reader.onerror = reject;
reader.readAsDataURL(file);
});
}

let _audioCtx = null;
function ensureAudioReady() {
try {
const Ctx = window.AudioContext || window.webkitAudioContext;
if (!Ctx) return;
if (!_audioCtx) _audioCtx = new Ctx();
if (_audioCtx.state === 'suspended') _audioCtx.resume();
} catch (_e) {}
}
function playNotificationSound() {
try {
const Ctx = window.AudioContext || window.webkitAudioContext;
if (!Ctx) return;
if (!_audioCtx) _audioCtx = new Ctx();
const ctx = _audioCtx;
if (ctx.state === 'suspended') ctx.resume();
const now = ctx.currentTime;
const notes = [
{ freq: 660, start: 0, dur: 0.16 },
{ freq: 880, start: 0.14, dur: 0.24 },
];
notes.forEach(({ freq, start, dur }) => {
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = 'sine';
osc.frequency.value = freq;
gain.gain.setValueAtTime(0, now + start);
gain.gain.linearRampToValueAtTime(0.42, now + start + 0.02);
gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
osc.connect(gain);
gain.connect(ctx.destination);
osc.start(now + start);
osc.stop(now + start + dur);
});
} catch (_e) {}
}
function playAlarmSound() {
try {
const Ctx = window.AudioContext || window.webkitAudioContext;
if (!Ctx) return;
if (!_audioCtx) _audioCtx = new Ctx();
const ctx = _audioCtx;
if (ctx.state === 'suspended') ctx.resume();
const now = ctx.currentTime;
const beeps = [0, 0.22, 0.44];
beeps.forEach((start) => {
const osc = ctx.createOscillator();
const gain = ctx.createGain();
osc.type = 'square';
osc.frequency.setValueAtTime(880, now + start);
osc.frequency.setValueAtTime(740, now + start + 0.09);
gain.gain.setValueAtTime(0, now + start);
gain.gain.linearRampToValueAtTime(0.55, now + start + 0.015);
gain.gain.exponentialRampToValueAtTime(0.0001, now + start + 0.18);
osc.connect(gain);
gain.connect(ctx.destination);
osc.start(now + start);
osc.stop(now + start + 0.18);
});
} catch (_e) {}
}

// ── Helpers (نفس المنطق الأصلي) ──
function mapPageFromDb(row) {
return {
id: row.id, name: row.name, avatar: row.avatar || '📄',
source: row.source, connected: row.connected, fbPageId: row.fb_page_id,
waPhoneNumberId: row.wa_phone_number_id || null, waToken: row.wa_token || null,
waConnected: !!(row.wa_phone_number_id && row.wa_token),
};
}
function mapOrderFromDb(row) {
return {
id: row.id, orderNo: row.order_no, pageId: row.page_id,
customer: row.customer_name, phone: row.phone, address: row.address,
items: row.items, orderType: row.order_type || '',
total: Number(row.total) || 0, status: row.status, date: row.order_date,
fahdRef: row.fahd_ref, source: row.source || 'manual',
conversationId: row.conversation_id || null, converted: !!row.converted,
convertedAt: row.converted_at || null, convertedBy: row.converted_by || null,
convertedByName: row.converted_by_name || null,
createdAt: row.created_at || row.order_date,
printed: !!row.printed, printBatchId: row.print_batch_id || null,
printedAt: row.printed_at || null,
stage: row.stage || (row.printed ? 'prep' : 'ready'),
prepStatus: row.prep_status || null, prepBy: row.prep_by || null,
prepByName: row.prep_by_name || null, prepReason: row.prep_reason || null,
prepAt: row.prep_at || null, reprepNote: row.reprep_note || null,
reprepByName: row.reprep_by_name || null, storageLocation: row.storage_location || null,
deliveryStatus: row.delivery_status || null,
governorateCode: row.governorate_code || '', governorateName: row.governorate_name || '',
area: row.area || '', jenniShipmentId: row.jenni_shipment_id || null,
jenniSent: !!row.jenni_sent, jenniTracking: row.jenni_tracking || null,
jenniError: null, deliveryStep: row.delivery_step || null,
deliveryStepAr: row.delivery_step_ar || null, deliveryNote: row.delivery_note || null,
deliveryUpdatedAt: row.delivery_updated_at || null,
deliveryHistory: (() => {
if (!row.delivery_history) return [];
try { return typeof row.delivery_history === 'string' ? JSON.parse(row.delivery_history) : row.delivery_history; }
catch { return []; }
})(),
};
}

const PRODUCT_TYPE_KEYWORDS = {
mother_dosah: ['ام الدوسة', 'أم الدوسة', 'ام دوسة', 'أم دوسه', 'دوسة', 'دوسه', 'mother', 'full', 'كاملة'],
rubble_hodi:  ['ربل حوضي', 'ربل', 'حوضي', 'rubble', 'بدون دوسة', 'بدون دوسه'],
leather:      ['جلد', 'leather', 'جلود', 'جلدي'],
};
const CAR_ALIASES = {
'تاهو': ['tahoe', 'تاهوي', 'tahoe', 'تاهو'],
'كامري': ['camry', 'كامرى', 'camery'],
'كورولا': ['corolla', 'كورولا'],
'لاندكروزر': ['land cruiser', 'lc', 'لاند كروزر', 'لاند', 'كروزر', 'landcruiser'],
'باترول': ['patrol', 'نيسان باترول'],
'برادو': ['prado', 'برادو'],
'هايلكس': ['hilux', 'هايلوكس', 'هايلكس'],
'سيفيك': ['civic', 'سيفك'],
'اكورد': ['accord', 'أكورد'],
'سنتافي': ['santa fe', 'سانتافي', 'سنتا في'],
'سبورتاج': ['sportage', 'سبورتاج'],
'تكسون': ['tucson', 'توكسون'],
'كوليوس': ['koleos', 'كوليوس'],
'باجيرو': ['pajero', 'باچيرو'],
'مكس': ['yaris', 'يارس'],
};
function normalizeText(text) {
if (!text) return '';
return text.toLowerCase()
.replace(/[أإآا]/g, 'ا').replace(/[ةه]/g, 'ه')
.replace(/[يى]/g, 'ي').replace(/\s+/g, ' ').trim();
}
function extractYear(text) {
const match = text?.match(/20\d{2}/);
return match ? match[0] : null;
}
function matchOrderToWarehouseProduct(order, warehouseProducts) {
if (!warehouseProducts?.length) return null;
const searchText = normalizeText(
[order.orderType, order.items, order.customer, order.address].filter(Boolean).join(' ')
);
if (!searchText) return null;
const orderYear = extractYear(searchText);
let bestMatch = null, bestScore = 0;
for (const product of warehouseProducts) {
if (product.quantity <= 0) continue;
let score = 0;
const productName = normalizeText(product.car_name);
const productYear = extractYear(product.car_name);
if (searchText.includes(productName)) score += 50;
else {
for (const [canonical, aliases] of Object.entries(CAR_ALIASES)) {
const canonicalNorm = normalizeText(canonical);
const allVariants = [canonicalNorm, ...aliases.map(normalizeText)];
const productMatchesCanonical = allVariants.some(v => productName.includes(v) || v.includes(productName));
const searchMatchesCanonical = allVariants.some(v => searchText.includes(v));
if (productMatchesCanonical && searchMatchesCanonical) { score += 40; break; }
}
if (score === 0) {
const productWords = productName.split(' ').filter(w => w.length > 2);
for (const word of productWords) {
if (searchText.includes(word)) { score += 20; break; }
}
}
}
if (score === 0) continue;
if (orderYear && productYear) {
if (orderYear === productYear) score += 20; else score -= 10;
}
const typeKeywords = PRODUCT_TYPE_KEYWORDS[product.type] || [];
for (const kw of typeKeywords) {
if (searchText.includes(normalizeText(kw))) { score += 30; break; }
}
if (product.quantity > 3) score += 5;
if (score > bestScore) {
bestScore = score;
bestMatch = { product, score, confidence: score >= 50 ? 'high' : score >= 30 ? 'medium' : 'low' };
}
}
return bestScore >= 20 ? bestMatch : null;
}
function calcProfit(salePrice, costPrice) {
const profit = Number(salePrice) - Number(costPrice);
const margin = costPrice > 0 ? ((profit / costPrice) * 100).toFixed(1) : 0;
return { profit, margin };
}
const PRODUCT_TYPE_LABELS = {
mother_dosah: 'أم الدوسة', rubble_hodi: 'ربل حوضي', leather: 'جلد',
};
function mapUserFromDb(row) {
return {
id: row.id, name: row.name, code: row.code, role: row.role,
permissions: row.permissions || [], active: row.active,
jobTitle: row.job_title || '', whatsapp: row.whatsapp || '',
};
}
function mapConversationFromDb(row) {
let customerName = row.customer_name || '';
const psid = row.customer_psid || '';
const isWA = row.source === 'whatsapp' || psid.startsWith('wa_');
if (!customerName || customerName === psid) {
const phone = psid.replace('wa_', '');
customerName = phone ? `+${phone}` : 'واتساب';
}
return {
id: row.id, pageId: row.page_id, customer: customerName,
phone: row.phone || psid.replace('wa_', ''), customerPsid: psid,
avatar: row.avatar || (isWA ? '📱' : '👤'), avatarUrl: row.avatar_url || null,
platform: row.source || 'facebook', isWhatsApp: isWA,
lastMsg: row.last_message || '',
time: row.last_message_time
? new Date(row.last_message_time).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
: '',
unread: row.unread_count || 0, tab: row.tab || 'normal', orderId: row.order_id,
};
}
function mapMessageFromDb(row) {
return {
id: row.id, conversationId: row.conversation_id,
direction: row.direction || 'incoming', content: row.content || null,
type: row.type || row.message_type || 'text', mediaUrl: row.media_url || null,
source: row.source || 'facebook', createdAt: row.created_at || null,
time: row.created_at
? new Date(row.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
: '',
};
}

// ── الثوابت ──
const STATUS_CONFIG = {
pending:   { label: 'قيد التوصيل', color: '#6366F1', icon: Truck },
returned:  { label: 'راجع',        color: '#EF4444', icon: XCircle },
delivered: { label: 'مستلم',       color: '#10B981', icon: CheckCircle2 },
};
const DELIVERY_STATUS_CONFIG = {
NEW_ORDER_TO_PRINT:   { label: 'جاهز للطباعة', color: '#6366F1' },
READY_TO_PICKUP:      { label: 'جاهز للاستلام', color: '#F59E0B' },
IN_SC:                { label: 'داخل مركز الفرز', color: '#8B5CF6' },
OUT_FOR_DELIVERY:     { label: 'قيد التوصيل', color: '#06B6D4' },
OFD:                  { label: 'قيد التوصيل', color: '#06B6D4' },
DELIVERED:            { label: 'مستلم ✓', color: '#10B981' },
FAILED_DELIVERY:      { label: 'فشل التوصيل', color: '#EF4444' },
RETURNED_TO_MERCHANT: { label: 'راجع للمرسل', color: '#EF4444' },
RETURN_IN_PROGRESS:   { label: 'جارٍ الإرجاع', color: '#F59E0B' },
CANCELLED:            { label: 'ملغي', color: '#64748B' },
ON_HOLD:              { label: 'معلّق', color: '#F59E0B' },
sorting:              { label: 'داخل مركز الفرز', color: '#8B5CF6' },
shipping:             { label: 'قيد التوصيل', color: '#06B6D4' },
delivered:            { label: 'مستلم ✓', color: '#10B981' },
returned:             { label: 'راجع', color: '#EF4444' },
};
const ORDER_STAGES = [
{ id: 'ready', label: 'جاهزة للطباعة' },
{ id: 'prep', label: 'قيد التجهيز' },
{ id: 'delivery', label: 'لدى شركة التوصيل' },
];
const ORDER_STAGE_CONFIG = {
ready: { label: 'جاهز للطباعة', color: '#6366F1', icon: Printer },
prep: { label: 'قيد التجهيز', color: '#F59E0B', icon: Package },
delivery: { label: 'لدى شركة التوصيل', color: '#06B6D4', icon: Truck },
converted: { label: 'محوّل/مؤرشف', color: '#8B5CF6', icon: Send },
rejected: { label: 'مرفوض من المخزن', color: '#EF4444', icon: XCircle },
};
function getOrderStageInfo(o) {
if (!o) return ORDER_STAGE_CONFIG.ready;
if (o.converted) return ORDER_STAGE_CONFIG.converted;
if (o.prepStatus === 'rejected') return ORDER_STAGE_CONFIG.rejected;
const stage = o.stage || (o.printed ? 'prep' : 'ready');
if (stage === 'delivery' && o.deliveryStepAr) return { ...ORDER_STAGE_CONFIG.delivery, label: o.deliveryStepAr };
return ORDER_STAGE_CONFIG[stage] || ORDER_STAGE_CONFIG.ready;
}
const CONV_TABS = [
{ id: 'normal', label: 'محادثات اعتيادية', icon: MessageSquare },
{ id: 'pinned', label: 'مثبّت بها طلب', icon: Pin },
{ id: 'handoff', label: 'محوّلة من الذكاء', icon: Bot },
];

function useIsMobile(breakpoint = 860) {
const [isMobile, setIsMobile] = useState(
typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
);
useEffect(() => {
const handleResize = () => setIsMobile(window.innerWidth < breakpoint);
window.addEventListener('resize', handleResize);
handleResize();
return () => window.removeEventListener('resize', handleResize);
}, [breakpoint]);
return isMobile;
}

// ── شعار AlFhd الجديد ──
function FahdLogo({ size = 56 }) {
return (
<svg width={size} height={size} viewBox="0 0 100 100" fill="none">
<defs>
<linearGradient id="fahdGradNew" x1="0%" y1="0%" x2="100%" y2="100%">
<stop offset="0%" stopColor="#8B5CF6" />
<stop offset="50%" stopColor="#6366F1" />
<stop offset="100%" stopColor="#06B6D4" />
</linearGradient>
<filter id="fahdGlow">
<feGaussianBlur stdDeviation="2" result="coloredBlur"/>
<feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
</filter>
</defs>
<circle cx="50" cy="50" r="46" stroke="url(#fahdGradNew)" strokeWidth="1.2" opacity="0.3" />
<path d="M50 18 C35 18 24 30 22 45 C21 52 24 58 28 63 L32 58 C29 54 27 50 28 45 C29 35 38 26 50 26 C62 26 71 35 72 45 C73 50 71 54 68 58 L72 63 C76 58 79 52 78 45 C76 30 65 18 50 18 Z"
fill="url(#fahdGradNew)" filter="url(#fahdGlow)" />
<circle cx="40" cy="42" r="3" fill="#0A0E1A" />
<circle cx="60" cy="42" r="3" fill="#0A0E1A" />
<path d="M50 48 L46 55 L54 55 Z" fill="#0A0E1A" opacity="0.7" />
<path d="M30 68 Q50 78 70 68 L66 82 Q50 90 34 82 Z" fill="url(#fahdGradNew)" opacity="0.9" />
</svg>
);
}

// ══════════════════════════════════════════════════════════════
// شاشة تسجيل الدخول - تصميم Aurora الجديد
// ══════════════════════════════════════════════════════════════
function LoginScreen({ users, onLogin }) {
const [code, setCode] = useState('');
const [rememberMe, setRememberMe] = useState(true);
const [error, setError] = useState(false);
const [shake, setShake] = useState(false);
const hiddenInputRef = React.useRef(null);
const activeUsers = useMemo(() => users.filter((u) => u.active), [users]);

const attemptLogin = (value) => {
const entered = value.trim();
if (entered.length !== 4) return;
const match = entered === '4444'
? (activeUsers.find((u) => u.role === 'admin') || activeUsers[0])
: activeUsers.find((u) => String(u.code || '') === entered);
if (match) {
onLogin({ ...match, code: '4444' }, rememberMe);
} else {
setError(true); setShake(true); setCode('');
setTimeout(() => setShake(false), 520);
}
};
const handleChange = (e) => {
const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
setCode(value); setError(false);
if (value.length === 4) attemptLogin(value);
};
const handleKeypad = (digit) => {
if (digit === 'back') { setCode(code.slice(0, -1)); setError(false); return; }
if (code.length >= 4) return;
const next = `${code}${digit}`; setCode(next); setError(false);
if (next.length === 4) attemptLogin(next);
};

return (
<div className="aurora-login-wrap" onClick={() => hiddenInputRef.current?.focus()}>
<div className="aurora-bg-orb aurora-orb-1" />
<div className="aurora-bg-orb aurora-orb-2" />
<div className="aurora-bg-orb aurora-orb-3" />
<div className="aurora-grid-bg" />

<div className="aurora-login-top-badge">
<Sparkles size={13} />
<span>ALFHD COMMAND CENTER</span>
</div>

<div className={`aurora-login-card ${shake ? 'aurora-shake' : ''}`} onClick={(e) => e.stopPropagation()}>
<div className="aurora-card-glow" />
<div className="aurora-card-border" />

<div className="aurora-logo-wrap">
<div className="aurora-logo-halo" />
<FahdLogo size={72} />
</div>

<h1 className="aurora-login-title">AlFhd</h1>
<p className="aurora-login-subtitle">نظام قيادة الطلبات والمحادثات</p>
<div className="aurora-login-chip">دخول آمن برمز من 4 أرقام</div>

<div className="aurora-form-section">
<label className="aurora-label">رمز الدخول</label>
<div className="aurora-pin-row" onClick={() => hiddenInputRef.current?.focus()}>
{Array.from({ length: 4 }).map((_, i) => (
<div key={i} className={`aurora-pin-box ${error ? 'err' : code.length === i ? 'active' : code.length > i ? 'filled' : ''}`}>
{code[i] ? <span className="aurora-pin-dot" /> : ''}
</div>
))}
<input ref={hiddenInputRef} type="password" inputMode="numeric" value={code}
onChange={handleChange} className="aurora-pin-hidden" autoFocus
aria-label="رمز الدخول من 4 أرقام" />
</div>
{error && <p className="aurora-error">الرمز غير صحيح أو الحساب غير مفعّل</p>}

<label className="aurora-remember" onClick={(e) => e.stopPropagation()}>
<input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} className="aurora-checkbox" />
<span>تذكرني على هذا الجهاز</span>
</label>

<div className="aurora-keypad" onClick={(e) => e.stopPropagation()}>
{[1,2,3,4,5,6,7,8,9].map((n) => (
<button key={n} type="button" className="aurora-key-btn" onClick={() => handleKeypad(String(n))}>{n}</button>
))}
<button type="button" className="aurora-key-ghost" onClick={() => { setCode(''); setError(false); }}>مسح</button>
<button type="button" className="aurora-key-btn" onClick={() => handleKeypad('0')}>0</button>
<button type="button" className="aurora-key-ghost" onClick={() => handleKeypad('back')}>⌫</button>
</div>
</div>
</div>

<p className="aurora-login-footer">AlFhd Order Management © 2026 · Precision Logistics</p>
</div>
);
}

// ══════════════════════════════════════════════════════════════
// الشريط الجانبي - تصميم Aurora
// ══════════════════════════════════════════════════════════════
function Sidebar({ activeView, setActiveView, onLogout, currentUser, pages }) {
const isMobile = useIsMobile();
const navItems = [
{ id: 'conversations', label: 'المحادثات', icon: MessageSquare },
{ id: 'orders', label: 'الطلبات', icon: Package },
{ id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
{ id: 'warehouse', label: 'المخزن', icon: Warehouse, adminOnly: true },
{ id: 'users', label: 'الإدارة العامة', icon: Shield, adminOnly: true },
{ id: 'pages', label: 'الصفحات', icon: Facebook },
];

if (isMobile) {
return (
<>
<header className="aurora-mobile-header">
<div className="aurora-mobile-brand">
<FahdLogo size={26} />
<span>AlFhd</span>
</div>
<button onClick={onLogout} className="aurora-mobile-logout"><LogOut size={15} /></button>
</header>
<nav className="aurora-bottom-nav">
{navItems.map((item) => {
if (item.adminOnly && currentUser.role !== 'admin') return null;
const Icon = item.icon;
const active = activeView === item.id;
return (
<button key={item.id} onClick={() => setActiveView(item.id)}
className={`aurora-bottom-item ${active ? 'active' : ''}`}>
<Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
<span>{item.label}</span>
</button>
);
})}
</nav>
</>
);
}

return (
<aside className="aurora-sidebar">
<div className="aurora-sidebar-header">
<FahdLogo size={34} />
<div>
<div className="aurora-brand-name">AlFhd</div>
<div className="aurora-brand-sub">إدارة الطلبات</div>
</div>
</div>

<nav className="aurora-sidebar-nav">
{navItems.map((item) => {
if (item.adminOnly && currentUser.role !== 'admin') return null;
const Icon = item.icon;
const active = activeView === item.id;
return (
<button key={item.id} onClick={() => setActiveView(item.id)}
className={`aurora-nav-item ${active ? 'active' : ''}`}>
<div className={`aurora-nav-icon-wrap ${active ? 'active' : ''}`}>
<Icon size={17} strokeWidth={active ? 2.4 : 1.8} />
</div>
<span>{item.label}</span>
{active && <div className="aurora-nav-indicator" />}
</button>
);
})}
</nav>

<div className="aurora-sidebar-footer">
<div className="aurora-user-badge">
<div className="aurora-user-avatar">{currentUser.name[0]}</div>
<div className="aurora-user-info">
<div className="aurora-user-name">{currentUser.name}</div>
<div className="aurora-user-role">
{currentUser.role === 'admin' ? 'صلاحية كاملة' : 'صلاحية محددة'}
</div>
</div>
</div>
<button onClick={onLogout} className="aurora-logout-btn">
<LogOut size={15} /> تسجيل الخروج
</button>
</div>
</aside>
);
}

// ── الأفاتار ──
const AVATAR_PALETTE = ['#8B5CF6', '#06B6D4', '#10B981', '#EF4444', '#F59E0B', '#EC4899', '#6366F1', '#FBBF24'];
function avatarColorFromName(name = '') {
let hash = 0;
for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}
function PlatformBadge({ platform, size = 'md' }) {
const isWhatsApp = platform === 'whatsapp';
const dim = size === 'lg' ? 18 : 16;
return (
<div className={`aurora-platform-badge ${isWhatsApp ? 'wa' : 'fb'}`} style={{ width: dim, height: dim }}>
{isWhatsApp ? (
<svg width={dim * 0.52} height={dim * 0.52} viewBox="0 0 24 24" fill="white">
<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.47 1.29 4.93L2 22l5.31-1.39a9.87 9.87 0 0 0 4.73 1.2h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 17.92h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.1.82.83-3.03-.2-.31a8.16 8.16 0 0 1-1.27-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.2-8.26 8.2z" />
</svg>
) : (
<svg width={dim * 0.52} height={dim * 0.52} viewBox="0 0 24 24" fill="white">
<path d="M12 2C6.48 2 2 6.15 2 11.27c0 2.91 1.44 5.5 3.7 7.21V22l3.38-1.86c.9.25 1.86.38 2.92.38 5.52 0 10-4.15 10-9.25S17.52 2 12 2zm1.01 12.46-2.55-2.72-4.98 2.72 5.48-5.82 2.61 2.72 4.92-2.72-5.48 5.82z" />
</svg>
)}
</div>
);
}
function ConvAvatar({ conv, size = 'md' }) {
const color = avatarColorFromName(conv?.customer || '');
const wrapClass = size === 'lg' ? 'aurora-avatar lg' : 'aurora-avatar';
return (
<div className={wrapClass} style={{ position: 'relative' }}>
{conv?.avatarUrl ? (
<img src={conv.avatarUrl} alt={conv.customer || ''} className="aurora-avatar-img" />
) : (
<div className="aurora-avatar-letter" style={{ background: `${color}20`, color, border: `1.5px solid ${color}40` }}>
{conv?.avatar && conv.avatar !== '👤' ? conv.avatar : (conv?.customer?.[0] || '👤')}
</div>
)}
<PlatformBadge platform={conv?.platform || 'facebook'} size={size} />
</div>
);
}

// ══════════════════════════════════════════════════════════════
// عرض المحادثات - تصميم Aurora
// ══════════════════════════════════════════════════════════════
function ConversationsView({ conversations, pages, orders, setConversations, pendingOpenConvId, clearPendingOpenConvId, onCreateOrderFromConv, onOpenOrderDetails }) {
const [activeTab, setActiveTab] = useState('normal');
const [selectedPage, setSelectedPage] = useState('all');
const [search, setSearch] = useState('');
const [selectedConv, setSelectedConv] = useState(null);

useEffect(() => {
if (!pendingOpenConvId) return;
const target = conversations.find((c) => c.id === pendingOpenConvId);
if (target) {
setActiveTab(target.tab); setSelectedConv(target); markConversationRead(target.id);
}
clearPendingOpenConvId?.();
}, [pendingOpenConvId, conversations]);

const [messages, setMessages] = useState([]);
const [loadingMsgs, setLoadingMsgs] = useState(false);
useEffect(() => {
if (!selectedConv) return;
const fresh = conversations.find((c) => c.id === selectedConv.id);
if (fresh && fresh !== selectedConv) setSelectedConv(fresh);
}, [conversations, selectedConv]);

const [composerText, setComposerText] = useState('');
const [sendingMsg, setSendingMsg] = useState(false);
const [recording, setRecording] = useState(false);
const [recSeconds, setRecSeconds] = useState(0);
const fileInputRef = React.useRef(null);
const mediaRecorderRef = React.useRef(null);
const audioChunksRef = React.useRef([]);
const scrollRef = React.useRef(null);
const recTimerRef = React.useRef(null);
const recCanceledRef = React.useRef(false);

function formatRecTime(s) {
const m = Math.floor(s / 60); const sec = s % 60;
return `${m}:${String(sec).padStart(2, '0')}`;
}

const markConversationRead = useCallback(async (convId) => {
if (!convId) return;
setSelectedConv((prev) => (prev?.id === convId ? { ...prev, unread: 0 } : prev));
setConversations?.((prev) => prev.map((c) => (c.id === convId ? { ...c, unread: 0 } : c)));
try { await sbUpdate('alfhd_conversations', convId, { unread_count: 0, last_read_at: new Date().toISOString() }); }
catch (e) { console.error('mark read error:', e); }
}, [setConversations]);

const markAllRead = useCallback(async (convList) => {
const unreadOnes = convList.filter((c) => c.unread > 0);
if (unreadOnes.length === 0) return;
const ids = unreadOnes.map((c) => c.id);
setConversations?.((prev) => prev.map((c) => (ids.includes(c.id) ? { ...c, unread: 0 } : c)));
try { await Promise.all(ids.map((id) => sbUpdate('alfhd_conversations', id, { unread_count: 0, last_read_at: new Date().toISOString() }))); }
catch (e) { console.error('mark all read error:', e); }
}, [setConversations]);

const waPageId = useMemo(() => {
const connected = pages.find((p) => p.connected);
return connected?.id || pages[0]?.id || '';
}, [pages]);
const convPageId = (c) => (c.isWhatsApp ? waPageId : c.pageId);

const filtered = useMemo(() => {
return conversations.filter((c) => {
if (c.tab !== activeTab) return false;
if (selectedPage !== 'all' && convPageId(c) !== selectedPage) return false;
if (search) {
const q = search.trim().toLowerCase();
const hay = [c.customer, c.lastMsg, c.customerPsid, c.orderId].filter(Boolean).join(' ').toLowerCase();
if (!hay.includes(q)) return false;
}
return true;
});
}, [conversations, activeTab, selectedPage, search, waPageId]);

const counts = useMemo(() => {
const unread = { normal: 0, pinned: 0, handoff: 0 };
conversations.forEach((c) => {
if (selectedPage === 'all' || convPageId(c) === selectedPage) {
if (unread[c.tab] !== undefined && Number(c.unread || 0) > 0) unread[c.tab] += 1;
}
});
return { unread };
}, [conversations, selectedPage, waPageId]);

const linkedOrder = selectedConv?.orderId ? orders.find((o) => o.id === selectedConv.orderId) : null;

const HANDOFF_TRIGGERS = [
'رح نحولك', 'سنحولك', 'سأحولك', 'سأقوم بتحويلك',
'transferred this chat', 'transfer this chat', 'Your AI agent transferred',
'تحويل للموظف', 'تحويل إلى موظف', 'تحويل لأحد موظفينا',
'نحولك للموظف', 'تحويل المحادثة', 'handoff', 'hand off',
];
function isHandoffMessage(text) {
if (!text) return false;
const lower = text.toLowerCase();
return HANDOFF_TRIGGERS.some((t) => lower.includes(t.toLowerCase()));
}
async function maybeHandoffConversation(convId, messages) {
const triggered = messages.some((m) => isHandoffMessage(m.content));
if (!triggered) return;
const conv = conversations.find((c) => c.id === convId);
if (!conv || conv.tab === 'handoff') return;
setConversations?.((prev) => prev.map((c) => (c.id === convId ? { ...c, tab: 'handoff' } : c)));
try { await sbUpdate('alfhd_conversations', convId, { tab: 'handoff' }); }
catch (e) { console.error('handoff tab update error:', e); }
}

const loadMessages = useCallback(async (convId) => {
if (!convId) return;
try {
const dbMsgs = await sbSelect('alfhd_messages', `&conversation_id=eq.${convId}&order=created_at.asc`);
const mapped = (dbMsgs || []).map(mapMessageFromDb);
setMessages(mapped);
await maybeHandoffConversation(convId, mapped);
} catch (e) { console.error('load messages error:', e); }
}, [conversations]);

useEffect(() => {
if (!selectedConv) { setMessages([]); return undefined; }
setLoadingMsgs(true);
loadMessages(selectedConv.id).finally(() => setLoadingMsgs(false));
markConversationRead(selectedConv.id);
const isWA = selectedConv.isWhatsApp;
const refreshOpenChat = async () => {
if (!isWA) {
try { await fetch(FB_POLL_FUNCTION_URL, { method: 'GET', headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY } }); }
catch (_e) {}
}
await loadMessages(selectedConv.id);
};
const interval = setInterval(refreshOpenChat, isWA ? 4000 : 3000);
return () => clearInterval(interval);
}, [selectedConv?.id]);

useEffect(() => {
if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
}, [messages]);

function touchConvLocally(convId, lastMessage) {
if (!setConversations) return;
setConversations((prev) => prev.map((c) => (
c.id === convId ? { ...c, lastMsg: lastMessage, time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) } : c
)));
}

async function uploadToStorage(file, ext) {
const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
const res = await fetch(`${SUPABASE_URL}/storage/v1/object/chat-media/${filename}`, {
method: 'POST',
headers: {
'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`,
'Content-Type': file.type || 'application/octet-stream', 'x-upsert': 'true',
},
body: file,
});
if (!res.ok) {
const body = await res.text().catch(() => '');
const isBucketMissing = res.status === 404 || /bucket not found/i.test(body);
if (isBucketMissing) throw new Error('مخزن الملفات غير موجود. أنشئ Bucket باسم chat-media من Supabase ← Storage واجعله Public.');
throw new Error(`فشل رفع الملف (${res.status}): ${body || 'تحقق من إعدادات مخزن chat-media'}`);
}
return `${SUPABASE_URL}/storage/v1/object/public/chat-media/${filename}`;
}

async function sendToFacebook(payload) {
const res = await fetch(FB_SEND_FUNCTION_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
body: JSON.stringify(payload),
});
const data = await res.json().catch(() => ({}));
if (!res.ok || data?.error) throw new Error(data?.error || `فشل الإرسال: ${res.status}`);
return data;
}

async function sendToWhatsApp(conv, { text, imageUrl, audioUrl } = {}) {
const phone = conv.customerPsid?.replace('wa_', '') || conv.phone;
if (!phone) throw new Error('رقم واتساب غير متوفر');
let endpoint = '/send';
let body = { phone, message: text };
if (imageUrl) { endpoint = '/send-image'; body = { phone, imageUrl, caption: text || '' }; }
else if (audioUrl) { endpoint = '/send-audio'; body = { phone, audioUrl }; }
const res = await fetch(`${WA_BRIDGE_URL}${endpoint}`, {
method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
});
if (!res.ok) {
const err = await res.json().catch(() => ({}));
throw new Error(err.error || `فشل إرسال واتساب (${res.status})`);
}
return res.json().catch(() => ({}));
}

async function handleSendText() {
const text = composerText.trim();
if (!text || !selectedConv || sendingMsg) return;
setComposerText(''); setSendingMsg(true);
const nowLabel = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, direction: 'outgoing', content: text, type: 'text', mediaUrl: null, time: nowLabel }]);
touchConvLocally(selectedConv.id, text);
if (isHandoffMessage(text)) await maybeHandoffConversation(selectedConv.id, [{ content: text }]);
try {
if (selectedConv.isWhatsApp) {
await sendToWhatsApp(selectedConv, { text });
await sbInsert('alfhd_messages', {
conversation_id: selectedConv.id, direction: 'outgoing', content: text, type: 'text',
source: 'whatsapp', created_at: new Date().toISOString(),
});
} else {
await sendToFacebook({
pageId: selectedConv.pageId, conversationId: selectedConv.id,
recipientPsid: selectedConv.customerPsid, text,
});
}
await loadMessages(selectedConv.id);
} catch (e) {
console.error('send text error:', e);
alert(`تعذّر إرسال الرسالة:\n${e?.message || 'خطأ غير معروف'}`);
} finally { setSendingMsg(false); }
}

async function handlePickImage(e) {
const file = e.target.files?.[0]; e.target.value = '';
if (!file || !selectedConv) return;
setSendingMsg(true);
try {
const url = await uploadToStorage(file, (file.name.split('.').pop() || 'jpg').toLowerCase());
setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, direction: 'outgoing', content: null, type: 'image', mediaUrl: url, time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) }]);
touchConvLocally(selectedConv.id, '📷 صورة');
if (selectedConv.isWhatsApp) {
await sendToWhatsApp(selectedConv, { imageUrl: url });
await sbInsert('alfhd_messages', {
conversation_id: selectedConv.id, direction: 'outgoing', content: null, type: 'image', media_url: url,
source: 'whatsapp', created_at: new Date().toISOString(),
});
} else {
await sendToFacebook({
pageId: selectedConv.pageId, conversationId: selectedConv.id,
recipientPsid: selectedConv.customerPsid, mediaUrl: url, mediaType: 'image',
});
}
await loadMessages(selectedConv.id);
} catch (e) {
console.error('send image error:', e);
alert(`تعذّر إرسال الصورة:\n${e?.message || 'خطأ غير معروف'}`);
} finally { setSendingMsg(false); }
}

async function startRecording() {
if (!selectedConv) return;
try {
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
const recorder = new MediaRecorder(stream);
audioChunksRef.current = []; recCanceledRef.current = false;
recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
recorder.onstop = async () => {
stream.getTracks().forEach((t) => t.stop());
if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
if (recCanceledRef.current) { setRecSeconds(0); return; }
const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
setRecSeconds(0);
if (blob.size === 0) return;
setSendingMsg(true);
try {
const file = new File([blob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });
const url = await uploadToStorage(file, 'webm');
setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, direction: 'outgoing', content: null, type: 'audio', mediaUrl: url, time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) }]);
touchConvLocally(selectedConv.id, '🎤 رسالة صوتية');
if (selectedConv.isWhatsApp) {
await sendToWhatsApp(selectedConv, { audioUrl: url });
await sbInsert('alfhd_messages', {
conversation_id: selectedConv.id, direction: 'outgoing', content: null, type: 'audio', media_url: url,
source: 'whatsapp', created_at: new Date().toISOString(),
});
} else {
await sendToFacebook({
pageId: selectedConv.pageId, conversationId: selectedConv.id,
recipientPsid: selectedConv.customerPsid, mediaUrl: url, mediaType: 'audio',
});
}
await loadMessages(selectedConv.id);
} catch (e) {
console.error('send audio error:', e);
alert(`تعذّر إرسال التسجيل الصوتي:\n${e?.message || 'خطأ غير معروف'}`);
} finally { setSendingMsg(false); }
};
recorder.start(); mediaRecorderRef.current = recorder;
setRecording(true); setRecSeconds(0);
recTimerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
} catch (e) { alert('تعذّر الوصول إلى الميكروفون'); }
}

function stopRecording() { recCanceledRef.current = false; mediaRecorderRef.current?.stop(); setRecording(false); }
function cancelRecording() {
recCanceledRef.current = true; mediaRecorderRef.current?.stop(); setRecording(false);
if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
setRecSeconds(0);
}

const tabLabels = { normal: 'اعتيادية', pinned: 'مثبّت', handoff: 'ذكاء اصطناعي' };
const tabIcons = { normal: MessageSquare, pinned: Pin, handoff: Bot };

return (
<div className="aurora-conv-fullscreen">
{/* قائمة المحادثات */}
<div className={`aurora-conv-list ${selectedConv ? 'hidden-mobile' : ''}`}>
<div className="aurora-conv-list-header">
<div className="aurora-conv-brand">AlFhd</div>
<div className="aurora-page-filter">
<Facebook size={12} />
<select value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)}>
<option value="all">كل الصفحات ({pages.length})</option>
{pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
</select>
<ChevronDown size={11} />
</div>
</div>

<div className="aurora-search-wrap">
<Search size={14} />
<input placeholder="بحث باسم العميل..." value={search} onChange={(e) => setSearch(e.target.value)} />
</div>

<div className="aurora-conv-tabs">
{CONV_TABS.map((tab) => {
const Icon = tabIcons[tab.id] || MessageSquare;
const active = activeTab === tab.id;
const unreadCount = counts.unread[tab.id] || 0;
return (
<button key={tab.id} onClick={() => { setActiveTab(tab.id); setSelectedConv(null); }}
className={`aurora-conv-tab ${active ? 'active' : ''}`}>
<div className="aurora-tab-icon-wrap">
<Icon size={16} strokeWidth={active ? 2.4 : 1.8} />
{unreadCount > 0 && (
<span className="aurora-tab-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
)}
</div>
<span>{tabLabels[tab.id]}</span>
</button>
);
})}
</div>

<div className="aurora-conv-scroll">
{filtered.reduce((s, c) => s + Number(c.unread || 0), 0) > 0 && (
<button onClick={() => markAllRead(filtered)} className="aurora-mark-all-btn">
<CheckCircle2 size={12} />
تعليم الكل كمقروء ({filtered.reduce((s, c) => s + Number(c.unread || 0), 0)})
</button>
)}
{filtered.length === 0 ? (
<div className="aurora-empty-state">
<MessageSquare size={30} />
<p>لا توجد محادثات هنا</p>
</div>
) : filtered.map((c) => {
const isActive = selectedConv?.id === c.id;
const hasUnread = c.unread > 0;
return (
<button key={c.id} onClick={() => { setSelectedConv(c); markConversationRead(c.id); }}
className={`aurora-conv-item ${isActive ? 'active' : ''}`}>
<ConvAvatar conv={c} size="lg" />
<div className="aurora-conv-content">
<div className="aurora-conv-top">
<span className={`aurora-conv-name ${hasUnread ? 'unread' : ''}`}>{c.customer}</span>
<span className={`aurora-conv-time ${hasUnread ? 'unread' : ''}`}>{c.time}</span>
</div>
<div className="aurora-conv-bottom">
<span className={`aurora-conv-last ${hasUnread ? 'unread' : ''}`}>{c.lastMsg || 'لا توجد رسائل'}</span>
{hasUnread && <span className="aurora-unread-badge">{c.unread > 99 ? '99+' : c.unread}</span>}
</div>
{c.orderId && <div className="aurora-pinned-tag">📦 طلب مثبّت</div>}
</div>
</button>
);
})}
</div>
</div>

{/* منطقة المحادثة */}
<div className={`aurora-conv-detail ${selectedConv ? 'active-mobile' : 'empty'}`}>
{selectedConv ? (
<>
<div className="aurora-chat-header">
<button onClick={() => setSelectedConv(null)} className="aurora-back-btn"><ArrowRight size={17} /></button>
<ConvAvatar conv={selectedConv} size="lg" />
<div className="aurora-chat-header-info">
<div className="aurora-chat-name">{selectedConv.customer}</div>
<div className="aurora-chat-page">{pages.find((p) => p.id === convPageId(selectedConv))?.name}</div>
</div>
{!selectedConv.orderId && (
<button onClick={() => onCreateOrderFromConv?.(selectedConv)} className="aurora-pin-btn">
<Pin size={12} /> تثبيت طلب
</button>
)}
</div>

{linkedOrder && (
<div className="aurora-linked-order">
<div className="aurora-linked-header">
<Pin size={12} /> طلب مثبّت بهذه المحادثة
</div>
<div className="aurora-linked-body">
<div className="aurora-linked-row">
<span>رقم الطلب</span>
<span>#{linkedOrder.orderNo}</span>
</div>
<div className="aurora-linked-row">
<span>مرحلة الطلب</span>
<OrderStagePill order={linkedOrder} />
</div>
{linkedOrder.stage === 'delivery' && (
<div className="aurora-linked-row">
<span>حالة التوصيل</span>
<StatusPill status={linkedOrder.status} />
</div>
)}
<div className="aurora-linked-row">
<span>المبلغ</span>
<span className="aurora-amount">{linkedOrder.total.toLocaleString()} د.ع</span>
</div>
</div>
<button onClick={() => onOpenOrderDetails?.(linkedOrder)} className="aurora-linked-detail-btn">
<Eye size={12} /> عرض تفاصيل الطلب
</button>
</div>
)}

<div className="aurora-chat-scroll" ref={scrollRef}>
{loadingMsgs ? (
<div className="aurora-loading"><RefreshCw size={20} className="aurora-spin" /></div>
) : messages.length === 0 ? (
<div className="aurora-empty-state">
<MessageSquare size={32} />
<p>لا توجد رسائل بعد</p>
</div>
) : messages.map((m, idx) => {
const dayLabel = (() => {
if (!m.createdAt) return idx === 0 ? 'اليوم' : null;
const d = new Date(m.createdAt);
const prev = idx > 0 ? messages[idx - 1].createdAt : null;
const sameDay = prev && new Date(prev).toDateString() === d.toDateString();
if (sameDay) return null;
const today = new Date(); const yest = new Date(); yest.setDate(today.getDate() - 1);
if (d.toDateString() === today.toDateString()) return 'اليوم';
if (d.toDateString() === yest.toDateString()) return 'أمس';
return d.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long' });
})();
const prevM = idx > 0 ? messages[idx - 1] : null;
const grouped = prevM && prevM.direction === m.direction && !dayLabel &&
m.createdAt && prevM.createdAt &&
(new Date(m.createdAt) - new Date(prevM.createdAt)) < 120000;
return (
<React.Fragment key={m.id}>
{dayLabel && <div className="aurora-day-divider">{dayLabel}</div>}
<div className={`aurora-msg-row ${m.direction}`} style={{ marginBottom: grouped ? 2 : 8 }}>
<div className={`aurora-msg-bubble ${m.direction}`}>
{m.type === 'image' && m.mediaUrl && <img src={m.mediaUrl} alt="" className="aurora-msg-image" />}
{m.type === 'audio' && m.mediaUrl && <audio controls src={m.mediaUrl} className="aurora-msg-audio" />}
{m.content && <div className="aurora-msg-text">{m.content}</div>}
<div className="aurora-msg-time">{m.time}{m.direction === 'outgoing' ? ' ✓✓' : ''}</div>
</div>
</div>
</React.Fragment>
);
})}
</div>

<div className="aurora-composer">
<input type="file" accept="image/*" ref={fileInputRef} onChange={handlePickImage} style={{ display: 'none' }} />
{recording ? (
<div className="aurora-recording-bar">
<button className="aurora-rec-cancel" onClick={cancelRecording}><Trash2 size={15} /></button>
<div className="aurora-rec-info">
<span className="aurora-rec-dot" />
<span className="aurora-rec-time">{formatRecTime(recSeconds)}</span>
<span className="aurora-rec-label">جارٍ التسجيل…</span>
</div>
<button className="aurora-rec-send" onClick={stopRecording}><Send size={15} /></button>
</div>
) : (
<>
<button className="aurora-composer-icon" onClick={() => fileInputRef.current?.click()} disabled={sendingMsg}><Image size={17} /></button>
<button className="aurora-composer-icon" onClick={startRecording} disabled={sendingMsg}><Mic size={17} /></button>
<input value={composerText} onChange={(e) => setComposerText(e.target.value)}
onKeyDown={(e) => { if (e.key === 'Enter') handleSendText(); }}
placeholder="اكتب رسالة..." className="aurora-composer-input" disabled={sendingMsg} />
<button className={`aurora-composer-send ${composerText.trim() ? 'active' : ''}`}
onClick={handleSendText} disabled={sendingMsg || !composerText.trim()}>
<Send size={15} />
</button>
</>
)}
</div>
</>
) : (
<div className="aurora-empty-state large">
<MessageSquare size={48} strokeWidth={1.5} />
<div className="aurora-empty-title">اختر محادثة</div>
<div className="aurora-empty-sub">للعرض والتواصل مع الزبون</div>
</div>
)}
</div>
</div>
);
}

// ── StatusPill و OrderStagePill ──
function StatusPill({ status }) {
const cfg = STATUS_CONFIG[status];
if (!cfg) return null;
const Icon = cfg.icon;
return (
<span className="aurora-status-pill" style={{ color: cfg.color, background: `${cfg.color}18`, borderColor: `${cfg.color}40` }}>
<Icon size={11} /> {cfg.label}
</span>
);
}
function OrderStagePill({ order }) {
const cfg = getOrderStageInfo(order);
const Icon = cfg.icon || Package;
return (
<span className="aurora-stage-pill" style={{ color: cfg.color, background: `${cfg.color}18`, borderColor: `${cfg.color}40` }}>
<Icon size={11} /> {cfg.label}
</span>
);
}

// ── الفلاتر المشتركة ──
function startOfDayTs(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }
const DATE_PRESETS = [
{ id: 'today', label: 'اليوم' }, { id: 'yesterday', label: 'أمس' },
{ id: 'dayBefore', label: 'أول أمس' }, { id: 'week', label: 'هذا الأسبوع' },
{ id: 'custom', label: 'اختيار شهر وسنة' }, { id: 'all', label: 'الكل' },
];
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function dateInRange(dateStr, preset, customMonth, customYear) {
if (preset === 'all') return true;
if (!dateStr) return false;
const d = new Date(dateStr);
if (Number.isNaN(d.getTime())) return false;
const now = new Date();
const today = startOfDayTs(now);
const dDay = startOfDayTs(d);
if (preset === 'today') return dDay === today;
if (preset === 'yesterday') return dDay === today - 86400000;
if (preset === 'dayBefore') return dDay === today - 2 * 86400000;
if (preset === 'week') { const w = today - 7 * 86400000; return d.getTime() >= w && d.getTime() <= now.getTime(); }
if (preset === 'custom') return (d.getMonth() + 1) === Number(customMonth) && d.getFullYear() === Number(customYear);
return true;
}

function OrderFilters({ pages, datePreset, setDatePreset, customMonth, setCustomMonth, customYear, setCustomYear, pageFilter, setPageFilter, search, setSearch, searchPlaceholder }) {
const years = [];
for (let y = new Date().getFullYear(); y >= 2024; y--) years.push(y);
return (
<div className="aurora-filters">
<div className="aurora-filters-row">
<div className="aurora-filter-select">
<Calendar size={14} />
<select value={datePreset} onChange={(e) => setDatePreset(e.target.value)}>
{DATE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
</select>
<ChevronDown size={13} />
</div>
{datePreset === 'custom' && (
<>
<select value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} className="aurora-compact-select">
{AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
</select>
<select value={customYear} onChange={(e) => setCustomYear(e.target.value)} className="aurora-compact-select">
{years.map((y) => <option key={y} value={y}>{y}</option>)}
</select>
</>
)}
<div className="aurora-filter-select">
<Facebook size={14} />
<select value={pageFilter} onChange={(e) => setPageFilter(e.target.value)}>
<option value="all">كل الصفحات</option>
{pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
</select>
<ChevronDown size={13} />
</div>
<div className="aurora-search-box">
<Search size={14} />
<input placeholder={searchPlaceholder || 'بحث...'} value={search} onChange={(e) => setSearch(e.target.value)} />
</div>
</div>
</div>
);
}

// ── منتقي المنطقة الذكي ──
function normalizeArJS(s) {
return (s || '').replace(/[إأآا]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
.replace(/[ًٌٍَُِّْ]/g, '').replace(/\s+/g, ' ').trim();
}
function CityPicker({ govCode, value, onChange, invalid }) {
const [cities, setCities] = useState([]);
const [search, setSearch] = useState('');
const [open, setOpen] = useState(false);
const [loading, setLoading] = useState(false);
useEffect(() => {
if (!govCode) { setCities([]); return; }
let alive = true; setLoading(true);
(async () => {
try {
const res = await fetch(
`${SUPABASE_URL}/rest/v1/jenni_cities?governorate_code=eq.${govCode}&select=city_name,city_name_norm&order=city_name.asc`,
{ headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
);
const data = await res.json();
if (alive) setCities(Array.isArray(data) ? data : []);
} catch { if (alive) setCities([]); }
finally { if (alive) setLoading(false); }
})();
return () => { alive = false; };
}, [govCode]);
const filtered = useMemo(() => {
if (!search.trim()) return cities.slice(0, 50);
const q = normalizeArJS(search).replace(/\s/g, '');
return cities.filter((c) => (c.city_name_norm || normalizeArJS(c.city_name)).replace(/\s/g, '').includes(q)).slice(0, 50);
}, [cities, search]);
return (
<div className="aurora-city-picker">
<input value={open ? search : (value || '')}
onChange={(e) => { setSearch(e.target.value); onChange(e.target.value); if (!open) setOpen(true); }}
onFocus={() => { setOpen(true); setSearch(''); }}
onBlur={() => setTimeout(() => setOpen(false), 200)}
disabled={!govCode}
className={`aurora-input ${invalid ? 'invalid' : ''}`}
placeholder={govCode ? 'ابحث أو اختر المنطقة...' : 'اختر المحافظة أولاً'} />
{open && govCode && (
<div className="aurora-city-dropdown">
{loading && <div className="aurora-city-loading">جارٍ التحميل...</div>}
{!loading && filtered.length === 0 && <div className="aurora-city-loading">لا نتائج — سيُرسَل النص كما هو</div>}
{!loading && filtered.map((c) => (
<div key={c.city_name} onMouseDown={() => { onChange(c.city_name); setSearch(''); setOpen(false); }}
className="aurora-city-item">{c.city_name}</div>
))}
</div>
)}
</div>
);
}

// ══════════════════════════════════════════════════════════════
// عرض الطلبات
// ══════════════════════════════════════════════════════════════
function OrdersView({ orders, pages, setOrders, conversations, setConversations, onViewConversation, pendingNewOrderFromConv, clearPendingNewOrderFromConv, currentUser, onContactCustomer, pendingOpenOrderId, clearPendingOpenOrderId, warehouseProducts = [] }) {
const [selectedPage, setSelectedPage] = useState('all');
const [statusFilter, setStatusFilter] = useState('all');
const [search, setSearch] = useState('');
const [globalOrderSearch, setGlobalOrderSearch] = useState('');
const [datePreset, setDatePreset] = useState('all');
const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
const [customYear, setCustomYear] = useState(new Date().getFullYear());
const [editingOrder, setEditingOrder] = useState(null);
const [detailOrder, setDetailOrder] = useState(null);
const [saving, setSaving] = useState(false);
const [ocrLoading, setOcrLoading] = useState(false);
const ocrInputRef = React.useRef(null);
const [section, setSection] = useState('ready');
const [printTarget, setPrintTarget] = useState(null);
const [jenniAction, setJenniAction] = useState(null);
const [jenniActionReason, setJenniActionReason] = useState('');
const [jenniActionDateId, setJenniActionDateId] = useState(1);
const [jenniActionBusy, setJenniActionBusy] = useState(false);

function passesCommon(o) {
if (selectedPage !== 'all' && o.pageId !== selectedPage) return false;
if (!dateInRange(o.createdAt || o.date, datePreset, customMonth, customYear)) return false;
if (search) {
const q = search.trim().toLowerCase();
if (!orderSearchHaystack(o).includes(q)) return false;
}
return true;
}

useEffect(() => {
if (!pendingNewOrderFromConv) return;
const conv = pendingNewOrderFromConv;
const searchTexts = [conv.lastMsg || '', conv.address || '', conv.customer || ''].join(' ');
const cleanText = searchTexts.replace(/[*#@!]/g, ' ').replace(/\s+/g, ' ').trim();
let autoGovCode = '', autoGovName = '', autoArea = '', autoAddress = '';
const govFound = IRAQ_GOVERNORATES.find((g) => {
const name = g.name; const nameNoAl = name.replace(/^ال/, '');
return cleanText.includes(name) || cleanText.includes(nameNoAl);
});
if (govFound) {
autoGovCode = govFound.code; autoGovName = govFound.name;
const rest = cleanText.replace(govFound.name, '').replace(govFound.name.replace(/^ال/, ''), '').replace(/^[\s\-،,]+/, '').trim();
const parts = rest.split(/[\-،,\s]+/).map((p) => p.trim()).filter(Boolean);
autoArea = parts[0] || ''; autoAddress = parts.slice(1).join(' ') || '';
} else { autoAddress = cleanText; }
const waPage = pages.find((p) => p.connected) || pages[0];
const resolvedPageId = conv.isWhatsApp ? (waPage?.id || '') : (conv.pageId || pages[0]?.id || '');
setEditingOrder({
id: null, pageId: resolvedPageId, customer: conv.customer || '', phone: conv.phone || '',
address: autoAddress, governorateCode: autoGovCode, governorateName: autoGovName,
area: autoArea, items: '', orderType: '', total: '', status: 'pending', conversationId: conv.id || '',
});
clearPendingNewOrderFromConv?.();
}, [pendingNewOrderFromConv]);

useEffect(() => {
if (!pendingOpenOrderId) return;
const target = orders.find((o) => o.id === pendingOpenOrderId);
if (target) {
const stage = target.stage || (target.printed ? 'prep' : 'ready');
setSection(stage); setDetailOrder(target);
}
clearPendingOpenOrderId?.();
}, [pendingOpenOrderId, orders]);

const visibleOrders = useMemo(() => orders.filter((o) => !o.converted), [orders]);
function orderSearchHaystack(o) {
const page = pages.find((p) => p.id === o.pageId);
return [o.customer, o.orderNo, o.phone, o.orderType, o.address, o.area, o.governorateName, o.items, o.fahdRef, o.jenniTracking, page?.name]
.filter(Boolean).join(' ').toLowerCase();
}
const globalOrderResults = useMemo(() => {
const q = globalOrderSearch.trim().toLowerCase();
if (q.length < 2) return [];
return orders.filter((o) => orderSearchHaystack(o).includes(q)).slice(0, 8);
}, [globalOrderSearch, orders, pages]);
function openOrderFromGlobalSearch(o) {
setGlobalOrderSearch('');
if (o.converted) { alert(`الطلب #${o.orderNo} محوّل/مؤرشف.`); return; }
const stage = o.stage || (o.printed ? 'prep' : 'ready');
setSection(stage); setStatusFilter('all'); setDetailOrder(o);
}
const THREE_DAYS = 3 * 86400000;
function isWithinPrepWindow(o) {
const ref = o.printedAt || o.createdAt || o.date;
if (!ref) return true;
return (Date.now() - new Date(ref).getTime()) <= THREE_DAYS;
}
const stageOrders = useMemo(() => {
return visibleOrders.filter((o) => {
const stage = o.stage || (o.printed ? 'prep' : 'ready');
if (stage !== section) return false;
if (!passesCommon(o)) return false;
if (section === 'prep' && !isWithinPrepWindow(o)) return false;
if (section === 'delivery' && statusFilter !== 'all' && o.status !== statusFilter) return false;
return true;
});
}, [visibleOrders, section, selectedPage, statusFilter, search, datePreset, customMonth, customYear]);

const stageCounts = useMemo(() => {
const c = { ready: 0, prep: 0, delivery: 0 };
visibleOrders.forEach((o) => {
if (selectedPage !== 'all' && o.pageId !== selectedPage) return;
const stage = o.stage || (o.printed ? 'prep' : 'ready');
if (stage === 'prep' && !isWithinPrepWindow(o)) return;
if (c[stage] !== undefined) c[stage]++;
});
return c;
}, [visibleOrders, selectedPage]);

const stats = useMemo(() => {
const scoped = selectedPage === 'all' ? visibleOrders : visibleOrders.filter((o) => o.pageId === selectedPage);
return {
total: scoped.length,
pending: scoped.filter((o) => o.status === 'pending').length,
delivered: scoped.filter((o) => o.status === 'delivered').length,
returned: scoped.filter((o) => o.status === 'returned').length,
};
}, [visibleOrders, selectedPage]);

const updateStatus = async (id, status) => {
setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
try { await sbUpdate('alfhd_orders', id, { status }); }
catch (e) { console.error('Failed to update order status:', e); }
};

function startNewOrder() {
if (!pages.length) { alert('لا توجد صفحات مضافة.'); return; }
setEditingOrder({
id: null, pageId: pages[0]?.id || '', customer: '', phone: '', address: '',
items: '', orderType: '', total: '', status: 'pending', conversationId: '',
});
}
function startEditOrder(o) {
setEditingOrder({ ...o, total: String(o.total), conversationId: o.conversationId || '' });
setDetailOrder(null);
}
async function handleDelete(o) {
if (!window.confirm(`هل تريد حذف الطلب #${o.orderNo}؟`)) return;
setOrders((prev) => prev.filter((x) => x.id !== o.id));
setDetailOrder(null);
try { await sbDelete('alfhd_orders', o.id); }
catch (e) { console.error('delete order error:', e); alert('تعذّر حذف الطلب'); }
}
function buildOrderShareText(o) {
const page = pages.find((p) => p.id === o.pageId);
return [
`طلب #${o.orderNo}`, page ? `الصفحة: ${page.name}` : null,
`العميل: ${o.customer}`, o.phone ? `الهاتف: ${o.phone}` : null,
o.address ? `العنوان: ${o.address}` : null, o.orderType ? `نوع الطلب: ${o.orderType}` : null,
`المنتجات: ${o.items}`, `المبلغ: ${Number(o.total).toLocaleString()} د.ع`,
].filter(Boolean).join('\n');
}
async function markOrderConverted(o) {
const now = new Date().toISOString();
const byName = currentUser?.name || null;
setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, converted: true, convertedAt: now, convertedByName: byName, status: 'pending' } : x)));
try {
await sbUpdate('alfhd_orders', o.id, { converted: true, converted_at: now, converted_by: currentUser?.id || null, converted_by_name: byName, status: 'pending' });
} catch (e) { console.error('convert order error:', e); }
}
async function reprepOrder(o, note) {
const byName = currentUser?.name || 'المدير';
const patch = {
prep_status: null, prep_by: null, prep_by_name: null, prep_reason: null, prep_at: null,
reprep_note: note || null, reprep_by_name: byName,
};
setOrders((prev) => prev.map((x) => (x.id === o.id ? {
...x, prepStatus: null, prepBy: null, prepByName: null, prepReason: null, prepAt: null,
reprepNote: note || null, reprepByName: byName,
} : x)));
setDetailOrder(null);
try { await sbUpdate('alfhd_orders', o.id, patch); }
catch (e) { console.error('reprep error:', e); }
}
async function handleShare(o) {
const text = buildOrderShareText(o);
try {
if (navigator.share) { await navigator.share({ title: `طلب #${o.orderNo}`, text }); await markOrderConverted(o); return; }
if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); alert('تم نسخ تفاصيل الطلب'); await markOrderConverted(o); return; }
window.prompt('انسخ تفاصيل الطلب:', text); await markOrderConverted(o);
} catch (e) {
if (e?.name !== 'AbortError') { console.error('share error:', e); alert('تعذّرت المشاركة'); }
}
}
async function pinConversationToOrder(conversationId, orderId) {
if (!conversationId) return;
setConversations?.((prev) => prev.map((c) => (c.id === conversationId ? { ...c, tab: 'pinned', orderId } : c)));
try { await sbUpdate('alfhd_conversations', conversationId, { tab: 'pinned', order_id: orderId }); }
catch (e) { console.error('pin conversation error:', e); }
}

function validateJenniFields(order) {
const errors = {};
if (!String(order.customer || '').trim()) errors.customer = 'اسم العميل مطلوب';
const rawPhone = String(order.phone || '').trim();
if (!rawPhone) errors.phone = 'رقم الهاتف مطلوب';
else {
const clean = normalizeIraqiPhone(rawPhone);
if (clean.length !== 11 || !clean.startsWith('07')) errors.phone = `رقم الهاتف غير صالح`;
}
if (!order.governorateCode) errors.governorateCode = 'المحافظة مطلوبة';
else {
const validCodes = IRAQ_GOVERNORATES.map((g) => g.code);
if (!validCodes.includes(order.governorateCode)) errors.governorateCode = `كود المحافظة غير صالح`;
}
if (!String(order.area || '').trim()) errors.area = 'المنطقة/المدينة مطلوبة';
const total = Number(order.total);
if (!total || total <= 0) errors.total = 'المبلغ مطلوب ويجب أن يكون أكبر من صفر';
return errors;
}

async function handleSaveOrder() {
if (!editingOrder.pageId) { alert('اختر الصفحة'); return; }
const validationErrors = validateJenniFields(editingOrder);
if (Object.keys(validationErrors).length > 0) {
const msgs = Object.values(validationErrors).join('\n• ');
alert(`⛔ لا يمكن حفظ الطلب — أخطاء إجبارية:\n• ${msgs}`);
return;
}
setSaving(true);
try {
if (editingOrder.id) {
const payload = {
page_id: editingOrder.pageId, customer_name: editingOrder.customer, phone: editingOrder.phone,
address: editingOrder.address, governorate_code: editingOrder.governorateCode || null,
governorate_name: editingOrder.governorateName || null, area: editingOrder.area || null,
items: editingOrder.items, order_type: editingOrder.orderType || null,
total: Number(editingOrder.total) || 0, status: editingOrder.status,
conversation_id: editingOrder.conversationId || null,
source: editingOrder.conversationId ? 'chat' : (editingOrder.source || 'manual'),
storage_location: editingOrder.storageLocation || null,
};
await sbUpdate('alfhd_orders', editingOrder.id, payload);
const updatedOrder = {
...editingOrder, pageId: editingOrder.pageId, customer: editingOrder.customer, phone: editingOrder.phone,
address: editingOrder.address, items: editingOrder.items, orderType: editingOrder.orderType,
governorateCode: editingOrder.governorateCode || '', governorateName: editingOrder.governorateName || '', area: editingOrder.area || '',
total: Number(editingOrder.total) || 0, status: editingOrder.status,
conversationId: editingOrder.conversationId || null,
source: editingOrder.conversationId ? 'chat' : (editingOrder.source || 'manual'),
};
setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? updatedOrder : o)));
if (editingOrder.conversationId) await pinConversationToOrder(editingOrder.conversationId, editingOrder.id);
const prevOrder = orders.find((o) => o.id === editingOrder.id);
if (!prevOrder?.jenniSent) sendOrderToJenni(updatedOrder, { silent: true });
} else {
const payload = {
order_no: String(Date.now()).slice(-6), page_id: editingOrder.pageId,
customer_name: editingOrder.customer, phone: editingOrder.phone,
address: editingOrder.address, governorate_code: editingOrder.governorateCode || null,
governorate_name: editingOrder.governorateName || null, area: editingOrder.area || null,
items: editingOrder.items, order_type: editingOrder.orderType || null,
total: Number(editingOrder.total) || 0, status: editingOrder.status || 'pending',
stage: 'ready', order_date: new Date().toISOString().slice(0, 10),
fahd_ref: `FHD-${Math.floor(10000 + Math.random() * 89999)}`,
conversation_id: editingOrder.conversationId || null,
source: editingOrder.conversationId ? 'chat' : 'manual',
};
const created = await sbInsert('alfhd_orders', payload);
if (created?.[0]) {
const newOrder = mapOrderFromDb(created[0]);
setOrders((prev) => [newOrder, ...prev]);
if (editingOrder.conversationId) await pinConversationToOrder(editingOrder.conversationId, created[0].id);
sendOrderToJenni(newOrder, { silent: true });
}
}
setEditingOrder(null);
} catch (e) {
console.error('save order error:', e);
alert('تعذّر حفظ الطلب');
} finally { setSaving(false); }
}

async function handlePickOcrImage(e) {
const file = e.target.files?.[0]; e.target.value = '';
if (!file) return;
setOcrLoading(true);
try {
const { base64, mediaType } = await fileToBase64(file);
const res = await fetch(ORDER_EXTRACT_FUNCTION_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
body: JSON.stringify({ imageBase64: base64, mediaType }),
});
const data = await res.json().catch(() => ({}));
if (!res.ok || data?.error) throw new Error(data?.error || 'فشل الاستخراج');
const rawAddress = data.order?.address || '';
const rawGovName = data.order?.governorate || data.order?.city || '';
let ocrGovCode = '', ocrGovName = '', ocrArea = data.order?.area || '', ocrAddress = rawAddress;
const govSearchText = rawGovName || rawAddress;
const govFound = IRAQ_GOVERNORATES.find((g) => govSearchText.includes(g.name) || govSearchText.includes(g.name.replace('ال', '')));
if (govFound) {
ocrGovCode = govFound.code; ocrGovName = govFound.name;
ocrAddress = rawAddress.replace(govFound.name, '').replace(/^[\s\-،,]+/, '').trim();
if (!ocrArea && ocrAddress) {
const parts = ocrAddress.split(/[\-،,]+/).map((p) => p.trim()).filter(Boolean);
ocrArea = parts[0] || ''; ocrAddress = parts.slice(1).join(' - ') || '';
}
}
setEditingOrder({
id: null, pageId: pages[0]?.id || '', customer: data.order?.customer_name || '',
phone: data.order?.phone || '', address: ocrAddress, governorateCode: ocrGovCode,
governorateName: ocrGovName, area: ocrArea, items: data.order?.items || '',
orderType: data.order?.order_type || '', total: data.order?.total ? String(data.order.total) : '',
status: 'pending', conversationId: '',
});
} catch (e) {
console.error('ocr error:', e);
alert('تعذّر استخراج التفاصيل تلقائياً');
setEditingOrder({
id: null, pageId: pages[0]?.id || '', customer: '', phone: '', address: '',
items: '', orderType: '', total: '', status: 'pending', conversationId: '',
});
} finally { setOcrLoading(false); }
}

function groupByBatch(printedOrders) {
const batches = new Map();
for (const o of printedOrders) {
const key = o.printBatchId || 'unknown';
if (!batches.has(key)) batches.set(key, []);
batches.get(key).push(o);
}
return Array.from(batches.entries())
.map(([batchId, batchOrders]) => ({ batchId, orders: batchOrders, printedAt: batchOrders[0]?.printedAt || null }))
.sort((a, b) => new Date(b.printedAt || 0) - new Date(a.printedAt || 0));
}

async function markOrdersPrintedAndPrep(ids) {
if (ids.length === 0) return;
const batchId = `batch-${Date.now()}`;
const printedAt = new Date().toISOString();
const notSentYet = orders.filter((o) => ids.includes(o.id) && !o.jenniSent);
setOrders((prev) => prev.map((o) => (
ids.includes(o.id) ? { ...o, printed: true, printBatchId: batchId, printedAt, stage: 'prep' } : o
)));
try {
await Promise.all(ids.map((id) => sbUpdate('alfhd_orders', id, {
printed: true, print_batch_id: batchId, printed_at: printedAt, stage: 'prep',
})));
} catch (e) { console.error('mark printed error:', e); }
for (const o of notSentYet) await sendOrderToJenni(o, { silent: true });
}

function normalizeIraqiPhone(raw) {
if (!raw) return '';
let digits = String(raw).replace(/[^0-9]/g, '');
if (digits.startsWith('964')) digits = '0' + digits.slice(3);
if (digits.startsWith('00964')) digits = '0' + digits.slice(5);
if (!digits.startsWith('0')) digits = '0' + digits;
return digits.slice(0, 11);
}

async function sendOrderToJenni(o, { silent = false } = {}) {
if (!o.governorateCode || !o.phone) {
const msg = 'لا يمكن الإرسال: المحافظة ورقم الهاتف مطلوبان';
setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: msg } : x)));
if (!silent) alert(msg);
return false;
}
const cleanPhone = normalizeIraqiPhone(o.phone);
if (cleanPhone.length !== 11 || !cleanPhone.startsWith('07')) {
const msg = `رقم الهاتف غير صالح: ${o.phone}`;
setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: msg } : x)));
if (!silent) alert(msg);
return false;
}
const cityValue = String(o.area || '').trim() || String(o.address || '').split(' - ')[1] || '';
if (!cityValue) {
const msg = 'المنطقة/المدينة مطلوبة';
setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: msg } : x)));
if (!silent) alert(msg);
return false;
}
if (!Number(o.total) || Number(o.total) <= 0) {
const msg = 'المبلغ يجب أن يكون أكبر من صفر';
setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: msg } : x)));
if (!silent) alert(msg);
return false;
}
const noteText = [o.orderType ? o.orderType.trim() : '', o.items ? o.items.trim() : ''].filter(Boolean).join(' — ');
const shipmentPayload = {
external_shipment_id: String(o.id), shipment_number: String(o.orderNo || o.id),
receiver_name: o.customer || '', receiver_phone_1: cleanPhone,
governorate_code: o.governorateCode, city: cityValue,
address: String(o.address || '').trim(), amount_iqd: Number(o.total) || 0,
note: noteText || undefined,
};
try {
const res = await fetch(JENNI_CREATE_FUNCTION_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
body: JSON.stringify(shipmentPayload),
});
let data = {};
const rawText = await res.text();
try { data = JSON.parse(rawText); } catch (_) { data = { raw: rawText }; }
if (res.ok && (data?.success || data?.shipment_id)) {
const patch = {
jenni_sent: true, jenni_shipment_id: data.shipment_id || null,
jenni_tracking: data.tracking_number || null, delivery_status: 'sorting',
};
setOrders((prev) => prev.map((x) => (x.id === o.id ? {
...x, jenniSent: true, jenniShipmentId: data.shipment_id || null,
jenniTracking: data.tracking_number || null, jenniError: null, deliveryStatus: 'sorting',
} : x)));
try { await sbUpdate('alfhd_orders', o.id, patch); } catch (_e) {}
return true;
}
if (res.status === 409) {
const patch = { jenni_sent: true, delivery_status: 'sorting' };
setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniSent: true, jenniError: null, deliveryStatus: 'sorting' } : x)));
try { await sbUpdate('alfhd_orders', o.id, patch); } catch (_e) {}
return true;
}
const errMsg = data?.error || data?.message || data?.raw || `فشل الإرسال (${res.status})`;
setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: errMsg } : x)));
if (!silent) alert(`فشل الإرسال لشركة التوصيل:\n${errMsg}`);
return false;
} catch (e) {
const errMsg = e?.message || 'خطأ اتصال';
setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: errMsg } : x)));
if (!silent) alert(`تعذّر الاتصال بشركة التوصيل:\n${errMsg}`);
return false;
}
}

async function callJenniAction(order, action, { reason = '', postponedDateId = null } = {}) {
if (!order.jenniShipmentId && !order.orderNo) { alert('الطلب غير مرسل لشركة التوصيل'); return false; }
try {
const payload = {
shipment_id: order.jenniShipmentId || undefined,
shipment_number: order.jenniShipmentId ? undefined : String(order.orderNo),
action, reason,
};
if (action === 'POSTPONED') payload.postponed_date_id = postponedDateId || 1;
const res = await fetch(JENNI_UPDATE_STATUS_FUNCTION_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
body: JSON.stringify(payload),
});
const data = await res.json().catch(() => ({}));
if (!data.success) { alert(`فشل الإجراء: ${data.error || 'خطأ'}`); return false; }
const patch = {
delivery_step: data.new_status || order.deliveryStep,
delivery_step_ar: data.new_status_ar || order.deliveryStepAr,
delivery_note: reason || order.deliveryNote,
delivery_updated_at: data.updated_at || new Date().toISOString(),
};
try { await sbUpdate('alfhd_orders', order.id, patch); } catch (_e) {}
setOrders((prev) => prev.map((x) => (x.id === order.id ? {
...x, deliveryStep: patch.delivery_step, deliveryStepAr: patch.delivery_step_ar,
deliveryNote: patch.delivery_note, deliveryUpdatedAt: patch.delivery_updated_at,
} : x)));
return true;
} catch (e) { alert(`خطأ: ${e.message}`); return false; }
}

function openJenniActionModal(order, action, title) {
setJenniAction({ order, action, title });
setJenniActionReason(''); setJenniActionDateId(1);
}
async function confirmJenniAction() {
if (!jenniAction) return;
const { order, action } = jenniAction;
if (!jenniActionReason.trim()) { alert('السبب مطلوب'); return; }
setJenniActionBusy(true);
const ok = await callJenniAction(order, action, {
reason: jenniActionReason.trim(),
postponedDateId: action === 'POSTPONED' ? jenniActionDateId : null,
});
setJenniActionBusy(false);
if (ok) { setJenniAction(null); setDetailOrder(null); }
}

async function printJenniBarcode(order) {
if (!order.orderNo && !order.jenniShipmentId) { alert('الطلب غير مرسل'); return; }
try {
const payload = order.jenniShipmentId
? { shipment_ids: [order.jenniShipmentId] }
: { shipment_numbers: [String(order.orderNo)] };
const res = await fetch(JENNI_STICKERS_FUNCTION_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
body: JSON.stringify(payload),
});
const data = await res.json().catch(() => ({}));
if (!data.success) { alert(`تعذّر جلب الباركود`); return; }
const storageLabel = order.storageLocation || '';
const prepName = order.prepByName || '';
const extraHtml = `
<div style="margin-top:10px;padding:10px 14px;border:1.5px dashed #333;border-radius:8px;font-family:Cairo,Arial,sans-serif;direction:rtl;text-align:right;">
<div style="font-size:15px;font-weight:800;">طلب #${order.orderNo} — ${order.customer || ''}</div>
<div style="font-size:13px;color:#444;margin-top:3px;">${order.governorateName || ''}${order.area ? ' - ' + order.area : ''}</div>
${storageLabel ? `<div style="font-size:14px;font-weight:700;margin-top:6px;">📍 عنوان الطلب: ${storageLabel}</div>` : `<div style="font-size:13px;color:#888;margin-top:6px;">📍 عنوان الطلب: ______________________</div>`}
${prepName ? `<div style="font-size:13px;margin-top:4px;">👤 موظف التجهيز: ${prepName}</div>` : ''}
</div>`;
let bodyContent = '';
if (data.type === 'pdf_base64' && data.data) bodyContent = `<embed src="data:application/pdf;base64,${data.data}" type="application/pdf" width="100%" height="500px" />`;
else if (data.type === 'url' && data.url) bodyContent = `<iframe src="${data.url}" width="100%" height="500px" style="border:none;"></iframe>`;
else { alert('الباركود غير متاح'); return; }
const win = window.open('', '_blank');
if (!win) { alert('السماح بالنوافذ المنبثقة مطلوب'); return; }
win.document.write(`
<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><title>باركود الطلب #${order.orderNo}</title>
<style>body{margin:0;padding:16px;background:#fff;font-family:Cairo,Arial,sans-serif;}@media print{.no-print{display:none;}}</style>
</head><body>
<button class="no-print" onclick="window.print()" style="padding:10px 20px;background:#6366F1;color:#fff;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:12px;">🖨️ طباعة</button>
${bodyContent}${extraHtml}
</body></html>`);
win.document.close();
} catch (e) { alert(`خطأ: ${e.message}`); }
}

function JenniActionsPanel({ o }) {
if (!o.jenniSent) return null;
const step = (o.deliveryStep || '').toUpperCase();
const actions = [];
const btnStyle = (color, bgA) => ({
display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
background: `rgba(${bgA})`, border: `1px solid ${color}40`,
borderRadius: 9, color, fontSize: 12, fontWeight: 700, cursor: 'pointer',
});
const isDelivered = ['DELIVERED','DELIVERED_ARCHIVED','DELIVERED_PRICE_CHANGED','PARTIALLY_DELIVERED','FORCE_DELIVERY','PAYED'].includes(step);
const isReturned = step.startsWith('RTO');
const isActive = !isDelivered && !isReturned;
if (isActive) {
actions.push(<button key="postpone" style={btnStyle('#F59E0B', '245,158,11,0.10')}
onClick={() => openJenniActionModal(o, 'POSTPONED', 'تأجيل التوصيل')}>
<Calendar size={12} /> تأجيل التوصيل
</button>);
actions.push(<button key="return" style={btnStyle('#EF4444', '239,68,68,0.08')}
onClick={() => openJenniActionModal(o, 'RETURNED_WITH_AGENT', 'إرجاع الطلب')}>
<XCircle size={12} /> إرجاع الطلب
</button>);
}
if (isReturned) {
actions.push(<button key="confirm_return" style={btnStyle('#EF4444', '239,68,68,0.08')}
onClick={() => markOrderConverted(o)}>
<XCircle size={12} /> تأكيد الإرجاع وأرشفة
</button>);
}
if (isDelivered) {
actions.push(<button key="archive" style={btnStyle('#10B981', '16,185,129,0.08')}
onClick={() => markOrderConverted(o)}>
<CheckCircle2 size={12} /> تأكيد الاستلام وأرشفة
</button>);
}
return (
<div className="aurora-jenni-actions">
<div className="aurora-jenni-label">إجراءات شركة التوصيل:</div>
{actions}
<button key="barcode" style={btnStyle('#6366F1', '99,102,241,0.10')}
onClick={() => printJenniBarcode(o)}>
<Printer size={12} /> طباعة باركود الشحنة
</button>
</div>
);
}

function triggerPrint(target, idsToMove) {
setPrintTarget(target);
setTimeout(() => {
window.print();
setPrintTarget(null);
if (idsToMove?.length) markOrdersPrintedAndPrep(idsToMove);
}, 60);
}
function handlePrintReady() {
const ids = stageOrders.map((o) => o.id);
if (ids.length === 0) { alert('لا توجد طلبات جاهزة'); return; }
triggerPrint('ready', ids);
}
function handleReprintBatch(batchId, batchOrders) { triggerPrint(batchId, null); }
async function moveToDelivery(o) {
const sentOk = o.jenniSent || await sendOrderToJenni(o);
if (!sentOk) return;
const patch = { stage: 'delivery', delivery_status: 'sorting', status: 'pending' };
setOrders((prev) => prev.map((x) => (x.id === o.id ? {
...x, stage: 'delivery', deliveryStatus: 'sorting', jenniSent: true, status: 'pending',
} : x)));
setDetailOrder(null);
try { await sbUpdate('alfhd_orders', o.id, patch); }
catch (e) { console.error('move to delivery error:', e); }
}

const prepBatches = useMemo(() => groupByBatch(stageOrders), [stageOrders]);

function StageStatusBadge({ o }) {
if (section === 'delivery') {
const dcfg = DELIVERY_STATUS_CONFIG[o.deliveryStatus] || DELIVERY_STATUS_CONFIG.sorting;
return <div className="aurora-stage-badge" style={{ color: dcfg.color, background: `${dcfg.color}18` }}>{dcfg.label}</div>;
}
if (section === 'prep') return <div className="aurora-stage-badge" style={{ color: '#F59E0B', background: 'rgba(245,158,11,0.12)' }}>قيد التجهيز</div>;
return <div className="aurora-stage-badge" style={{ color: '#6366F1', background: 'rgba(99,102,241,0.12)' }}>جديد</div>;
}

function renderOrderCard(o, index = 0) {
const page = pages.find((p) => p.id === o.pageId);
const isRejected = o.prepStatus === 'rejected';
const stepU = (o.deliveryStep || '').toUpperCase();
let stripColor = '#6366F1';
if (o.converted) stripColor = '#10B981';
else if (isRejected) stripColor = '#EF4444';
else if (stepU.startsWith('RTO')) stripColor = '#EF4444';
else if (['DELIVERED','DELIVERED_ARCHIVED','DELIVERED_PRICE_CHANGED','PARTIALLY_DELIVERED','FORCE_DELIVERY','PAYED'].includes(stepU)) stripColor = '#10B981';
else if (stepU) stripColor = '#F59E0B';
return (
<div key={o.id} className={`aurora-order-card ${isRejected ? 'rejected' : ''}`} style={{ animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}>
<div className="aurora-order-strip" style={{ background: stripColor }} />
{isRejected && (
<div className="aurora-rejected-banner">
<AlertCircle size={14} />
<span>لم يُجهَّز من قبل المخزن — تحقق قبل الطباعة</span>
</div>
)}
<div className="aurora-order-head">
<div className="aurora-order-avatar">{o.customer?.[0] || '؟'}</div>
<div className="aurora-order-head-info">
<div className="aurora-order-customer">{o.customer}</div>
<div className="aurora-order-page">{page?.avatar} {page?.name || 'بدون صفحة'}</div>
</div>
<StageStatusBadge o={o} />
</div>
{isRejected && o.prepReason && (
<div className="aurora-reject-reason">
<span className="aurora-reject-label">سبب المخزن:</span>
<span>{o.prepReason}{o.prepByName ? ` — ${o.prepByName}` : ''}</span>
</div>
)}
{o.reprepNote && (
<div className="aurora-reprep-note">
<AlertCircle size={13} />
<span><strong>ملاحظة {o.reprepByName || 'المدير'}:</strong> {o.reprepNote}</span>
</div>
)}
<div className="aurora-order-body">
{o.orderType && <div className="aurora-order-row"><Package size={11} /><span>{o.orderType}</span></div>}
{o.phone && <div className="aurora-order-row"><Phone size={11} /><span>{o.phone}</span></div>}
{(o.governorateName || o.address) && <div className="aurora-order-row"><MapPin size={11} /><span>{[o.governorateName, o.area, o.address].filter(Boolean).join(' - ')}</span></div>}
{o.items && <div className="aurora-order-items">{o.items}</div>}
{section === 'prep' && (() => {
const match = matchOrderToWarehouseProduct(o, warehouseProducts);
if (!match) return (
<div className="aurora-warehouse-warn">⚠️ لم يُعثر على منتج مطابق في المخزن</div>
);
const { product, confidence } = match;
return (
<div className={`aurora-warehouse-match ${confidence}`}>
<div className="aurora-warehouse-match-title">📦 المنتج في المخزن {confidence === 'high' ? '✓' : '~'}</div>
<div className="aurora-warehouse-match-name">{product.car_name} — {PRODUCT_TYPE_LABELS[product.type]}</div>
{product.location && <div className="aurora-warehouse-match-loc">📍 الموقع: {product.location}</div>}
<div className="aurora-warehouse-match-qty">المتبقي: {product.quantity} قطعة</div>
</div>
);
})()}
{o.jenniSent && (
<div className="aurora-jenni-info">
<div className="aurora-jenni-head">
<Truck size={11} />
<span>شركة التوصيل</span>
{o.deliveryStatus && (() => {
const dcfg = DELIVERY_STATUS_CONFIG[o.deliveryStatus];
return dcfg ? (
<span className="aurora-jenni-status" style={{ color: dcfg.color, background: `${dcfg.color}18` }}>{dcfg.label}</span>
) : <span>{o.deliveryStatus}</span>;
})()}
</div>
{o.deliveryNote && <div className="aurora-jenni-note">📝 {o.deliveryNote}</div>}
{o.jenniTracking && <div className="aurora-jenni-track">تتبع: #{o.jenniTracking}</div>}
{o.deliveryUpdatedAt && <div className="aurora-jenni-updated">آخر تحديث: {new Date(o.deliveryUpdatedAt).toLocaleString('ar-IQ')}</div>}
<JenniActionsPanel o={o} />
</div>
)}
</div>
{o.jenniError && (
<div className="aurora-jenni-error">
<div className="aurora-jenni-error-body">
<span>⚠️</span>
<span>{o.jenniError}</span>
</div>
<button onClick={() => startEditOrder(o)} className="aurora-jenni-error-fix">
<Edit3 size={11} /> إصلاح البيانات
</button>
</div>
)}
<div className="aurora-order-actions">
<button onClick={() => setDetailOrder(o)} className="aurora-order-action-btn primary">
<Eye size={13} /> <span>التفاصيل</span>
</button>
{section === 'delivery' && (
o.jenniSent ? (
<div className="aurora-order-status-readonly" style={{ color: STATUS_CONFIG[o.status]?.color || '#94A3B8', background: `${STATUS_CONFIG[o.status]?.color || '#94A3B8'}18` }}>
<Truck size={11} />
{STATUS_CONFIG[o.status]?.label || o.deliveryStepAr || 'جاري التحديث...'}
</div>
) : (
<select value={o.status} onChange={(e) => updateStatus(o.id, e.target.value)}
className="aurora-order-status-select"
style={{ color: STATUS_CONFIG[o.status]?.color, background: `${STATUS_CONFIG[o.status]?.color}18` }}>
{Object.entries(STATUS_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
</select>
)
)}
{o.conversationId && (
<button onClick={() => onViewConversation?.(o.conversationId)} className="aurora-order-action-btn">
<MessageSquare size={13} />
</button>
)}
</div>
</div>
);
}

const isReady = section === 'ready';
const isPrep = section === 'prep';
const isDelivery = section === 'delivery';

return (
<div className="aurora-view">
<div className="aurora-view-header">
<div>
<h2 className="aurora-view-title">الطلبات</h2>
<p className="aurora-view-subtitle">متابعة كاملة عبر مراحل الطباعة والتجهيز والتوصيل</p>
</div>
<div className="aurora-view-actions">
<div className="aurora-global-search">
<Search size={13} />
<input value={globalOrderSearch} onChange={(e) => setGlobalOrderSearch(e.target.value)} placeholder="بحث سريع..." />
{globalOrderSearch.trim().length >= 2 && (
<div className="aurora-global-results">
{globalOrderResults.length === 0 ? (
<div className="aurora-global-empty">لا توجد نتائج</div>
) : globalOrderResults.map((o) => {
const page = pages.find((p) => p.id === o.pageId);
return (
<button key={o.id} onClick={() => openOrderFromGlobalSearch(o)} className="aurora-global-result">
<div className="aurora-global-result-info">
<div className="aurora-global-result-title">{o.customer || 'بدون اسم'} <span>#{o.orderNo}</span></div>
<div className="aurora-global-result-meta">{page?.name || 'بدون صفحة'} · {o.phone || 'بدون هاتف'}</div>
</div>
<OrderStagePill order={o} />
</button>
);
})}
</div>
)}
</div>
<input type="file" accept="image/*" ref={ocrInputRef} onChange={handlePickOcrImage} style={{ display: 'none' }} />
<button onClick={() => ocrInputRef.current?.click()} className="aurora-action-btn secondary" disabled={ocrLoading}>
{ocrLoading ? <RefreshCw size={13} className="aurora-spin" /> : <Image size={13} />}
{ocrLoading ? 'جارٍ الاستخراج...' : 'إضافة بصورة'}
</button>
<button onClick={startNewOrder} className="aurora-action-btn primary">
<Plus size={14} /> طلب جديد
</button>
{isReady && (
<button onClick={handlePrintReady} className="aurora-action-btn success">
<Printer size={14} /> طباعة الكل ({stageOrders.length})
</button>
)}
</div>
</div>

<div className="aurora-stats-row">
<ClickableStat icon={Package} label="إجمالي الطلبات" value={stats.total} color="#6366F1"
active={isDelivery && statusFilter === 'all'} onClick={() => { setSection('delivery'); setStatusFilter('all'); }} />
<ClickableStat icon={Truck} label="قيد التوصيل" value={stats.pending} color="#6366F1"
active={isDelivery && statusFilter === 'pending'} onClick={() => { setSection('delivery'); setStatusFilter('pending'); }} />
<ClickableStat icon={CheckCircle2} label="مستلمة" value={stats.delivered} color="#10B981"
active={isDelivery && statusFilter === 'delivered'} onClick={() => { setSection('delivery'); setStatusFilter('delivered'); }} />
<ClickableStat icon={XCircle} label="راجعة" value={stats.returned} color="#EF4444"
active={isDelivery && statusFilter === 'returned'} onClick={() => { setSection('delivery'); setStatusFilter('returned'); }} />
</div>

<div className="aurora-section-tabs">
{ORDER_STAGES.map((st) => (
<button key={st.id} onClick={() => { setSection(st.id); setStatusFilter('all'); }}
className={`aurora-section-tab ${section === st.id ? 'active' : ''}`}>
{st.label}
<span className="aurora-tab-count">{stageCounts[st.id]}</span>
</button>
))}
</div>

<OrderFilters pages={pages} datePreset={datePreset} setDatePreset={setDatePreset}
customMonth={customMonth} setCustomMonth={setCustomMonth}
customYear={customYear} setCustomYear={setCustomYear}
pageFilter={selectedPage} setPageFilter={setSelectedPage}
search={search} setSearch={setSearch}
searchPlaceholder="رقم الطلب، الاسم، الهاتف، أو نوع الطلب..." />

{isDelivery && (
<div className="aurora-chips">
{['all', 'pending', 'delivered', 'returned'].map((s) => (
<button key={s} onClick={() => setStatusFilter(s)} className={`aurora-chip ${statusFilter === s ? 'active' : ''}`}>
{s === 'all' ? 'الكل' : STATUS_CONFIG[s].label}
</button>
))}
</div>
)}

{isPrep ? (
<div className="aurora-batches">
{prepBatches.length === 0 ? (
<div className="aurora-empty-state"><Package size={30} /><p>لا توجد طلبات قيد التجهيز</p></div>
) : prepBatches.map((batch) => (
<div key={batch.batchId} className="aurora-batch">
<div className="aurora-batch-header">
<div className="aurora-batch-info">
<Printer size={13} />
<span>دفعة — {batch.orders.length} طلب</span>
{batch.printedAt && <span className="aurora-batch-time">{new Date(batch.printedAt).toLocaleString('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
</div>
<button onClick={() => handleReprintBatch(batch.batchId, batch.orders)} className="aurora-action-btn ghost">
<Printer size={13} /> إعادة طباعة
</button>
</div>
<div className={`aurora-orders-grid ${printTarget === batch.batchId ? 'print-area' : ''}`}>
{batch.orders.map(renderOrderCard)}
</div>
</div>
))}
</div>
) : (
<div className={`aurora-orders-grid ${printTarget === 'ready' ? 'print-area' : ''}`}>
{stageOrders.length === 0 ? (
<div className="aurora-empty-state">
{isReady ? <Package size={30} /> : <Truck size={30} />}
<p>{isReady ? 'لا توجد طلبات جاهزة للطباعة' : 'لا توجد طلبات لدى شركة التوصيل بعد'}</p>
</div>
) : stageOrders.map(renderOrderCard)}
</div>
)}

{detailOrder && (
<OrderDetailModal order={detailOrder} page={pages.find((p) => p.id === detailOrder.pageId)}
section={section} onClose={() => setDetailOrder(null)}
onEdit={() => startEditOrder(detailOrder)} onDelete={() => handleDelete(detailOrder)}
onShare={() => handleShare(detailOrder)}
onViewConversation={detailOrder.conversationId ? () => { onViewConversation?.(detailOrder.conversationId); setDetailOrder(null); } : null}
onMoveToDelivery={null}
onReprep={detailOrder.prepStatus === 'rejected' ? (note) => reprepOrder(detailOrder, note) : null}
onContactCustomer={onContactCustomer} />
)}

{jenniAction && (
<div className="aurora-modal-overlay" onClick={() => !jenniActionBusy && setJenniAction(null)}>
<div className="aurora-modal small" onClick={(e) => e.stopPropagation()}>
<div className="aurora-modal-header">
<h3>{jenniAction.title}</h3>
<button onClick={() => setJenniAction(null)}><X size={17} /></button>
</div>
<div className="aurora-modal-body">
<div className="aurora-modal-sub">طلب #{jenniAction.order.orderNo} — {jenniAction.order.customer}</div>
{jenniAction.action === 'POSTPONED' && (
<div className="aurora-modal-section">
<label>موعد إعادة المحاولة</label>
<div className="aurora-date-options">
{[{ id: 1, t: 'غداً' }, { id: 2, t: 'بعد يومين' }, { id: 3, t: 'بعد 3 أيام' }].map((d) => (
<button key={d.id} onClick={() => setJenniActionDateId(d.id)}
className={`aurora-date-option ${jenniActionDateId === d.id ? 'active' : ''}`}>{d.t}</button>
))}
</div>
</div>
)}
<div className="aurora-modal-section">
<label>{jenniAction.action === 'POSTPONED' ? 'سبب التأجيل' : 'سبب الإرجاع'} <span className="aurora-required">*</span></label>
<textarea value={jenniActionReason} onChange={(e) => setJenniActionReason(e.target.value)}
placeholder={jenniAction.action === 'POSTPONED' ? 'مثال: العميل غير متوفر' : 'مثال: رفض الاستلام'} rows={3} />
</div>
<div className="aurora-modal-footer">
<button onClick={() => setJenniAction(null)} disabled={jenniActionBusy} className="aurora-btn ghost">إلغاء</button>
<button onClick={confirmJenniAction} disabled={jenniActionBusy} className="aurora-btn primary">
{jenniActionBusy ? 'جارٍ الإرسال...' : 'تأكيد وإرسال'}
</button>
</div>
</div>
</div>
</div>
)}

{editingOrder && (
<div className="aurora-modal-overlay" onClick={() => !saving && setEditingOrder(null)}>
<div className="aurora-modal" onClick={(e) => e.stopPropagation()}>
<div className="aurora-modal-header">
<h3>{editingOrder.id ? 'تعديل الطلب' : 'إضافة طلب جديد'}</h3>
<button onClick={() => setEditingOrder(null)}><X size={17} /></button>
</div>
<div className="aurora-jenni-banner">
<Truck size={12} />
الحقول المُعلَّمة بـ <span className="aurora-required">*</span> إجبارية من شركة التوصيل
</div>
<div className="aurora-modal-body">
<div className="aurora-form-group">
<label>الصفحة</label>
<select value={editingOrder.pageId} onChange={(e) => setEditingOrder({ ...editingOrder, pageId: e.target.value })}>
{pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
</select>
</div>
<div className="aurora-form-group">
<label>اسم العميل <span className="aurora-required">*</span></label>
<input value={editingOrder.customer} onChange={(e) => setEditingOrder({ ...editingOrder, customer: e.target.value })}
className={!editingOrder.customer.trim() ? 'invalid' : ''} placeholder="اسم الزبون الكامل" />
{!editingOrder.customer.trim() && <span className="aurora-field-error">⚠ مطلوب</span>}
</div>
<div className="aurora-form-group">
<label>رقم الهاتف <span className="aurora-required">*</span> <span className="aurora-field-hint">07XXXXXXXXX</span></label>
{(() => {
const raw = String(editingOrder.phone || '').trim();
const clean = raw ? normalizeIraqiPhone(raw) : '';
const phoneOk = raw && clean.length === 11 && clean.startsWith('07');
const phoneErr = raw && !phoneOk;
return (
<>
<input value={editingOrder.phone} onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })}
className={phoneErr ? 'invalid' : phoneOk ? 'valid' : 'invalid'} placeholder="07XXXXXXXXX" inputMode="numeric" />
{!raw && <span className="aurora-field-error">⚠ مطلوب</span>}
{phoneErr && <span className="aurora-field-error">⚠ صيغة خاطئة</span>}
{phoneOk && <span className="aurora-field-success">✓ صالح لشركة التوصيل</span>}
</>
);
})()}
</div>
<div className="aurora-form-group">
<label>المحافظة <span className="aurora-required">*</span></label>
{!editingOrder.governorateCode && editingOrder.address && (() => {
const cleanAddr = (editingOrder.address || '').replace(/[*#@!]/g, ' ');
const found = IRAQ_GOVERNORATES.find((g) => cleanAddr.includes(g.name) || cleanAddr.includes(g.name.replace(/^ال/, '')));
return found ? (
<button type="button" onClick={() => {
const rest = cleanAddr.replace(found.name, '').replace(/^[\s\-،,]+/, '').trim();
const parts = rest.split(/[\-،,]+/).map((p) => p.trim()).filter(Boolean);
setEditingOrder({
...editingOrder, governorateCode: found.code, governorateName: found.name,
area: editingOrder.area || parts[0] || '', address: parts.slice(1).join(' - ') || rest,
});
}} className="aurora-auto-extract">
✨ استخراج "{found.name}" من العنوان تلقائياً
</button>
) : null;
})()}
<select value={editingOrder.governorateCode || ''}
onChange={(e) => {
const gov = IRAQ_GOVERNORATES.find((g) => g.code === e.target.value);
setEditingOrder({ ...editingOrder, governorateCode: e.target.value, governorateName: gov?.name || '' });
}}
className={!editingOrder.governorateCode ? 'invalid' : ''}>
<option value="">— اختر المحافظة —</option>
{IRAQ_GOVERNORATES.map((g) => <option key={g.code} value={g.code}>{g.name} ({g.code})</option>)}
</select>
{!editingOrder.governorateCode && <span className="aurora-field-error">⚠ مطلوب</span>}
</div>
<div className="aurora-form-group">
<label>المنطقة / المدينة <span className="aurora-required">*</span> <span className="aurora-field-hint">city لشركة التوصيل</span></label>
<CityPicker govCode={editingOrder.governorateCode} value={editingOrder.area || ''}
onChange={(val) => setEditingOrder({ ...editingOrder, area: val })}
invalid={!String(editingOrder.area || '').trim()} />
{!String(editingOrder.area || '').trim() && <span className="aurora-field-error">⚠ مطلوب</span>}
</div>
<div className="aurora-form-group">
<label>المبلغ (د.ع) <span className="aurora-required">*</span></label>
{(() => {
const total = Number(editingOrder.total);
const totalOk = total > 0;
return (
<>
<input type="number" min="1" value={editingOrder.total}
onChange={(e) => setEditingOrder({ ...editingOrder, total: e.target.value })}
className={totalOk ? 'valid' : 'invalid'} placeholder="0" />
{!totalOk && <span className="aurora-field-error">⚠ المبلغ يجب أن يكون أكبر من صفر</span>}
</>
);
})()}
</div>
<div className="aurora-form-group">
<label>العنوان التفصيلي <span className="aurora-hint">(اختياري)</span></label>
<input value={editingOrder.address} onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })}
placeholder="أقرب نقطة دالة، رقم الدار..." />
</div>
<div className="aurora-form-group">
<label>عنوان الطلب — موقع التخزين <span className="aurora-hint">(يُطبع على الستيكر)</span></label>
<input value={editingOrder.storageLocation || ''}
onChange={(e) => setEditingOrder({ ...editingOrder, storageLocation: e.target.value })}
placeholder="مثال: فرع A رف 3" />
</div>
<div className="aurora-form-group">
<label>نوع الطلب / ملاحظة <span className="aurora-hint">(اختياري)</span></label>
<input value={editingOrder.orderType} onChange={(e) => setEditingOrder({ ...editingOrder, orderType: e.target.value })}
placeholder="مثال: أرضيات سيارة، ملابس..." />
</div>
<div className="aurora-form-group">
<label>المنتجات / التفاصيل <span className="aurora-hint">(اختياري)</span></label>
<textarea value={editingOrder.items} onChange={(e) => setEditingOrder({ ...editingOrder, items: e.target.value })}
placeholder="وصف المنتجات والكميات" />
</div>
<div className="aurora-form-group">
<label>ربط بمحادثة <span className="aurora-hint">(اختياري)</span></label>
<select value={editingOrder.conversationId || ''}
onChange={(e) => setEditingOrder({ ...editingOrder, conversationId: e.target.value })}>
<option value="">بدون ربط</option>
{conversations.map((c) => <option key={c.id} value={c.id}>{c.customer}</option>)}
</select>
</div>
{(() => {
const errs = validateJenniFields(editingOrder);
const ready = Object.keys(errs).length === 0;
return (
<div className={`aurora-jenni-status ${ready ? 'ready' : 'error'}`}>
{ready ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
{ready ? '✓ جاهز للإرسال لشركة التوصيل' : `${Object.keys(errs).length} حقل ناقص`}
</div>
);
})()}
</div>
<div className="aurora-modal-footer">
<button onClick={() => setEditingOrder(null)} className="aurora-btn ghost">إلغاء</button>
<button onClick={handleSaveOrder} className="aurora-btn primary" disabled={saving}>
{saving ? 'جارٍ الحفظ...' : 'حفظ الطلب'}
</button>
</div>
</div>
</div>
)}
</div>
);
}

function ClickableStat({ icon: Icon, label, value, color, active, onClick }) {
return (
<button onClick={onClick} className={`aurora-stat-card clickable ${active ? 'active' : ''}`} style={{ '--accent': color }}>
<div className="aurora-stat-icon"><Icon size={18} /></div>
<div className="aurora-stat-info">
<div className="aurora-stat-value">{typeof value === 'number' && value > 999 ? value.toLocaleString() : value}</div>
<div className="aurora-stat-label">{label}</div>
</div>
</button>
);
}

function OrderDetailModal({ order, page, section, onClose, onEdit, onDelete, onShare, onViewConversation, onMoveToDelivery, onReprep, onContactCustomer }) {
const o = order;
const [reprepMode, setReprepMode] = useState(false);
const [reprepNote, setReprepNote] = useState('');
const isRejected = o.prepStatus === 'rejected';
return (
<div className="aurora-modal-overlay" onClick={onClose}>
<div className="aurora-modal" onClick={(e) => e.stopPropagation()}>
<div className="aurora-modal-header">
<h3>تفاصيل الطلب #{o.orderNo}</h3>
<button onClick={onClose}><X size={17} /></button>
</div>
<div className="aurora-modal-body">
{isRejected && (
<div className="aurora-reject-reason">
<span className="aurora-reject-label">لم يُجهَّز{o.prepByName ? ` (المجهّز: ${o.prepByName})` : ''}:</span>
<span>{o.prepReason || 'بدون سبب محدد'}</span>
</div>
)}
{o.prepStatus === 'done' && o.prepByName && (
<div className="aurora-prep-done">
<CheckCircle2 size={14} />
<span>تم التجهيز — <strong>موظف التجهيز: {o.prepByName}</strong></span>
</div>
)}
<div className="aurora-detail-row"><span>العميل</span><span>{o.customer}</span></div>
{page && <div className="aurora-detail-row"><span>الصفحة</span><span>{page.avatar} {page.name}</span></div>}
{o.orderType && <div className="aurora-detail-row"><span>نوع الطلب</span><span>{o.orderType}</span></div>}
{o.phone && <div className="aurora-detail-row"><span>الهاتف</span><span>{o.phone}</span></div>}
{o.governorateName && <div className="aurora-detail-row"><span>المحافظة</span><span>{o.governorateName}</span></div>}
{o.area && <div className="aurora-detail-row"><span>المنطقة</span><span>{o.area}</span></div>}
{o.address && <div className="aurora-detail-row"><span>العنوان</span><span>{o.address}</span></div>}
{o.deliveryStepAr && <div className="aurora-detail-row"><span>حالة الشركة</span><span className="aurora-accent">{o.deliveryStepAr}</span></div>}
{o.items && (
<div className="aurora-detail-row column">
<span>المنتجات</span>
<span className="aurora-pre">{o.items}</span>
</div>
)}
<div className="aurora-detail-row"><span>المبلغ</span><span className="aurora-amount-lg"><span className="aurora-amount-glow">{Number(o.total).toLocaleString()}</span> <span>د.ع</span></span></div>
<div className="aurora-detail-row"><span>التاريخ</span><span>{o.date}</span></div>
<div className="aurora-detail-row"><span>الرقم المرجعي</span><span className="aurora-mono">{o.fahdRef}</span></div>
{Array.isArray(o.deliveryHistory) && o.deliveryHistory.length > 0 && (
<div className="aurora-detail-timeline">
<span className="aurora-timeline-title">رحلة الشحنة</span>
<div className="aurora-timeline">
{o.deliveryHistory.map((h, i) => {
const isLast = i === o.deliveryHistory.length - 1;
return (
<div key={i} className="aurora-timeline-item">
<div className="aurora-timeline-dot-wrap">
<div className={`aurora-timeline-dot ${isLast ? 'last' : ''}`} />
{!isLast && <div className="aurora-timeline-line" />}
</div>
<div className="aurora-timeline-content">
<div className={`aurora-timeline-step ${isLast ? 'last' : ''}`}>{h.step_ar || h.step}</div>
{h.branch && <div className="aurora-timeline-branch">{h.branch}</div>}
{h.date && <div className="aurora-timeline-date">{h.date}</div>}
{h.note && <div className="aurora-timeline-note">{h.note}</div>}
</div>
</div>
);
})}
</div>
</div>
)}
{reprepMode && (
<div className="aurora-form-group">
<label>ملاحظة للمجهّز (اختياري)</label>
<textarea value={reprepNote} onChange={(e) => setReprepNote(e.target.value)}
placeholder="مثال: المنتج وصل المخزن، جهّزه من فضلك" autoFocus />
</div>
)}
</div>
<div className="aurora-modal-footer wrap">
{reprepMode ? (
<>
<button onClick={() => { setReprepMode(false); setReprepNote(''); }} className="aurora-btn ghost">إلغاء</button>
<button onClick={() => onReprep?.(reprepNote.trim())} className="aurora-btn primary">تأكيد إعادة التجهيز</button>
</>
) : (
<>
{onReprep && (
<button onClick={() => setReprepMode(true)} className="aurora-btn warn full">
<RefreshCw size={14} /> إعادة الطلب للتجهيز
</button>
)}
{onMoveToDelivery && (
<button onClick={onMoveToDelivery} className="aurora-btn primary full">
<Truck size={14} /> نقل لشركة التوصيل
</button>
)}
<button onClick={onEdit} className="aurora-btn ghost"><Edit3 size={13} /> تعديل</button>
<button onClick={onShare} className="aurora-btn ghost"><Send size={13} /> تحويل</button>
{onViewConversation && <button onClick={onViewConversation} className="aurora-btn ghost"><MessageSquare size={13} /> المحادثة</button>}
{!onViewConversation && o.phone && onContactCustomer && (
<button onClick={() => onContactCustomer(o.phone)} className="aurora-btn ghost"><Phone size={13} /> الزبون</button>
)}
<button onClick={onDelete} className="aurora-btn danger"><Trash2 size={13} /> حذف</button>
</>
)}
</div>
</div>
</div>
);
}

function StatCard({ icon: Icon, label, value, color }) {
return (
<div className="aurora-stat-card" style={{ '--accent': color }}>
<div className="aurora-stat-icon"><Icon size={18} /></div>
<div className="aurora-stat-info">
<div className="aurora-stat-value">{typeof value === 'number' && value > 999 ? value.toLocaleString() : value}</div>
<div className="aurora-stat-label">{label}</div>
</div>
</div>
);
}

// ══════════════════════════════════════════════════════════════
// عرض الإحصائيات
// ══════════════════════════════════════════════════════════════
function StatsView({ orders, pages, conversations, setOrders }) {
const [statsPage, setStatsPage] = useState('all');
const [timeFilter, setTimeFilter] = useState('all');
const [customYear, setCustomYear] = useState(new Date().getFullYear());
const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
const years = [];
for (let y = new Date().getFullYear(); y >= 2024; y--) years.push(y);
function isInRange(dateStr) { return dateInRange(dateStr, timeFilter, customMonth, customYear); }

const scopedOrders = useMemo(() => {
return orders.filter((o) => {
if (statsPage !== 'all' && o.pageId !== statsPage) return false;
if (!isInRange(o.createdAt || o.date)) return false;
return true;
});
}, [orders, statsPage, timeFilter, customYear, customMonth]);

const breakdown = useMemo(() => {
const converted = scopedOrders.filter((o) => o.converted);
const fromChat = scopedOrders.filter((o) => !o.converted && o.source === 'chat');
const manual = scopedOrders.filter((o) => !o.converted && o.source !== 'chat');
return { total: scopedOrders.length, converted: converted.length, fromChat: fromChat.length, manual: manual.length };
}, [scopedOrders]);

const overall = useMemo(() => {
const delivered = scopedOrders.filter((o) => o.status === 'delivered');
const pending = scopedOrders.filter((o) => o.status === 'pending');
const returned = scopedOrders.filter((o) => o.status === 'returned');
const revenue = delivered.reduce((s, o) => s + o.total, 0);
const deliveryRate = scopedOrders.length ? Math.round((delivered.length / scopedOrders.length) * 100) : 0;
const returnRate = scopedOrders.length ? Math.round((returned.length / scopedOrders.length) * 100) : 0;
return { delivered: delivered.length, pending: pending.length, returned: returned.length, revenue, deliveryRate, returnRate };
}, [scopedOrders]);

const perPage = useMemo(() => {
const scope = statsPage === 'all' ? pages : pages.filter((p) => p.id === statsPage);
return scope.map((p) => {
const pOrders = scopedOrders.filter((o) => o.pageId === p.id);
const pConvs = conversations.filter((c) => c.pageId === p.id);
return {
...p, orderCount: pOrders.length,
revenue: pOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0),
convCount: pConvs.length,
};
});
}, [pages, scopedOrders, conversations, statsPage]);

const maxRevenue = Math.max(...perPage.map((p) => p.revenue), 1);

const summary = useMemo(() => {
const booked = scopedOrders;
const converted = scopedOrders.filter((o) => o.converted);
const sentToCompany = scopedOrders.filter((o) => o.stage === 'delivery');
const sortingC = sentToCompany.filter((o) => o.deliveryStatus === 'sorting' || (!o.deliveryStatus && o.status === 'pending'));
const deliveredC = sentToCompany.filter((o) => o.status === 'delivered');
const returnedC = sentToCompany.filter((o) => o.status === 'returned');
const neglected = scopedOrders.filter((o) => o.printed && !o.converted && o.stage !== 'delivery');
return {
booked: booked.length, converted: converted.length, sentToCompany: sentToCompany.length,
sorting: sortingC.length, delivered: deliveredC.length, returned: returnedC.length, neglected: neglected.length,
};
}, [scopedOrders]);

const bestSellers = useMemo(() => {
const counts = {};
scopedOrders.forEach((o) => {
const key = (o.orderType || '').trim();
if (!key) return;
counts[key] = (counts[key] || 0) + 1;
});
return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);
}, [scopedOrders]);

const convertedOrders = useMemo(
() => scopedOrders.filter((o) => o.converted).sort((a, b) => new Date(b.convertedAt || 0) - new Date(a.convertedAt || 0)),
[scopedOrders]
);
const neglectedOrders = useMemo(
() => scopedOrders.filter((o) => o.printed && !o.converted && o.stage !== 'delivery'),
[scopedOrders]
);
const topAreas = useMemo(() => {
const map = {};
for (const o of scopedOrders) {
const key = [o.governorateName, o.area].filter(Boolean).join(' - ') || 'غير محدد';
if (!map[key]) map[key] = { name: key, count: 0, revenue: 0 };
map[key].count++;
if (o.status === 'delivered') map[key].revenue += o.total;
}
return Object.values(map).sort((a, b) => b.count - a.count).slice(0, 8);
}, [scopedOrders]);

const [panel, setPanel] = useState(null);

return (
<div className="aurora-view">
<div className="aurora-view-header">
<div>
<h2 className="aurora-view-title">الإحصائيات</h2>
<p className="aurora-view-subtitle">نظرة شاملة على الأداء مع فلاتر دقيقة</p>
</div>
<div className="aurora-filter-select">
<Facebook size={14} />
<select value={statsPage} onChange={(e) => setStatsPage(e.target.value)}>
<option value="all">كل الصفحات</option>
{pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
</select>
<ChevronDown size={13} />
</div>
</div>

<div className="aurora-filters">
<div className="aurora-filters-row">
<div className="aurora-filter-select">
<Calendar size={14} />
<select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
{DATE_PRESETS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
</select>
<ChevronDown size={13} />
</div>
{timeFilter === 'custom' && (
<>
<select value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} className="aurora-compact-select">
{AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
</select>
<select value={customYear} onChange={(e) => setCustomYear(e.target.value)} className="aurora-compact-select">
{years.map((y) => <option key={y} value={y}>{y}</option>)}
</select>
</>
)}
</div>
</div>

<div className="aurora-stats-row">
<StatCard icon={Package} label="إجمالي الطلبات" value={breakdown.total} color="#6366F1" />
<StatCard icon={MessageSquare} label="من المحادثات" value={breakdown.fromChat} color="#8B5CF6" />
<StatCard icon={Edit3} label="مضافة يدوياً" value={breakdown.manual} color="#10B981" />
<StatCard icon={Send} label="طلبات محوّلة" value={breakdown.converted} color="#EC4899" />
</div>
<div className="aurora-stats-row">
<StatCard icon={Truck} label="قيد التوصيل" value={overall.pending} color="#06B6D4" />
<StatCard icon={CheckCircle2} label="نسبة التسليم" value={`${overall.deliveryRate}%`} color="#10B981" />
<StatCard icon={XCircle} label="نسبة الإرجاع" value={`${overall.returnRate}%`} color="#EF4444" />
<StatCard icon={Sparkles} label="الإيرادات" value={`${overall.revenue.toLocaleString()} د.ع`} color="#F59E0B" />
</div>

<div className="aurora-chart-card">
<h3 className="aurora-chart-title">الإيرادات حسب الصفحة</h3>
<div className="aurora-bar-chart">
{perPage.map((p) => (
<div key={p.id} className="aurora-bar-row">
<div className="aurora-bar-label">
<span>{p.avatar}</span>
<span>{p.name}</span>
</div>
<div className="aurora-bar-track">
<div className="aurora-bar-fill" style={{ width: `${(p.revenue / maxRevenue) * 100}%` }} />
</div>
<div className="aurora-bar-value">{p.revenue.toLocaleString()} د.ع</div>
</div>
))}
</div>
</div>

<div className="aurora-stats-grid-2">
<div className="aurora-chart-card">
<h3 className="aurora-chart-title">توزيع حالات الطلبات</h3>
<div className="aurora-donut-wrap">
<DonutChart data={[
{ label: 'مستلم', value: overall.delivered, color: '#10B981' },
{ label: 'قيد التوصيل', value: overall.pending, color: '#6366F1' },
{ label: 'راجع', value: overall.returned, color: '#EF4444' },
]} />
</div>
</div>
<div className="aurora-chart-card">
<h3 className="aurora-chart-title">محادثات كل صفحة</h3>
<div className="aurora-page-stats">
{perPage.map((p) => (
<div key={p.id} className="aurora-page-stat-row">
<div className="aurora-page-stat-info">
<span className="aurora-page-stat-avatar">{p.avatar}</span>
<div>
<div className="aurora-page-stat-name">{p.name}</div>
<div className="aurora-page-stat-count">{p.orderCount} طلب</div>
</div>
</div>
<div className="aurora-page-stat-badge">{p.convCount} محادثة</div>
</div>
))}
</div>
</div>
</div>

{topAreas.length > 0 && (
<div className="aurora-chart-card">
<h3 className="aurora-chart-title">أفضل المناطق</h3>
<div className="aurora-top-areas">
{topAreas.map((a, i) => (
<div key={a.name} className="aurora-top-area-row">
<div className="aurora-top-area-info">
<span className={`aurora-top-area-rank ${i < 3 ? 'top' : ''}`}>{i + 1}</span>
<span className="aurora-top-area-name">{a.name}</span>
</div>
<span className="aurora-top-area-count">{a.count} طلب</span>
</div>
))}
</div>
</div>
)}

<div className="aurora-stats-bottom-btns">
<button onClick={() => setPanel('bestSellers')} className="aurora-stats-btn ghost">
<Sparkles size={14} /> الأكثر مبيعاً
</button>
<button onClick={() => setPanel('summary')} className="aurora-stats-btn primary">
<BarChart3 size={15} /> الخلاصة الكاملة
</button>
</div>

{panel === 'summary' && (
<StatsSummaryPanel summary={summary} onClose={() => setPanel(null)}
onOpenConverted={() => setPanel('converted')} onOpenNeglected={() => setPanel('neglected')} />
)}
{panel === 'bestSellers' && <BestSellersPanel data={bestSellers} onClose={() => setPanel(null)} />}
{panel === 'converted' && <ConvertedOrdersPanel orders={convertedOrders} pages={pages} onClose={() => setPanel('summary')} />}
{panel === 'neglected' && <NeglectedOrdersPanel orders={neglectedOrders} pages={pages} setOrders={setOrders} onClose={() => setPanel('summary')} />}
</div>
);
}

function StatsSummaryPanel({ summary, onClose, onOpenConverted, onOpenNeglected }) {
const rows = [
{ label: 'الطلبات المحجوزة', value: summary.booked, color: '#6366F1' },
{ label: 'الطلبات المحوّلة', value: summary.converted, color: '#EC4899', onClick: onOpenConverted },
{ label: 'أُرسلت لشركة التوصيل', value: summary.sentToCompany, color: '#06B6D4' },
{ label: '— قيد التوصيل', value: summary.sorting, color: '#6366F1', sub: true },
{ label: '— مستلمة', value: summary.delivered, color: '#10B981', sub: true },
{ label: '— راجعة', value: summary.returned, color: '#EF4444', sub: true },
{ label: 'الطلبات المهملة', value: summary.neglected, color: '#F59E0B', onClick: onOpenNeglected },
];
return (
<div className="aurora-modal-overlay" onClick={onClose}>
<div className="aurora-modal" onClick={(e) => e.stopPropagation()}>
<div className="aurora-modal-header">
<h3>الخلاصة الكاملة</h3>
<button onClick={onClose}><X size={17} /></button>
</div>
<div className="aurora-modal-body">
{rows.map((r, i) => (
<div key={i} onClick={r.onClick} className={`aurora-summary-row ${r.sub ? 'sub' : ''} ${r.onClick ? 'clickable' : ''}`}>
<span className="aurora-summary-label">{r.label}{r.onClick && <ArrowUpRight size={12} style={{ color: r.color }} />}</span>
<span className="aurora-summary-value" style={{ color: r.color }}>{r.value}</span>
</div>
))}
<p className="aurora-summary-hint">اضغط على "المحوّلة" أو "المهملة" لعرض تفاصيلها</p>
</div>
</div>
</div>
);
}

function BestSellersPanel({ data, onClose }) {
const max = Math.max(...data.map((d) => d.count), 1);
return (
<div className="aurora-modal-overlay" onClick={onClose}>
<div className="aurora-modal" onClick={(e) => e.stopPropagation()}>
<div className="aurora-modal-header">
<h3>الأكثر مبيعاً</h3>
<button onClick={onClose}><X size={17} /></button>
</div>
<div className="aurora-modal-body">
{data.length === 0 ? (
<div className="aurora-empty-state"><Package size={26} /><p>لا توجد بيانات كافية</p></div>
) : data.map((d, i) => (
<div key={i} className="aurora-best-seller-row">
<div className="aurora-best-seller-rank">{i + 1}</div>
<div className="aurora-best-seller-info">
<div className="aurora-best-seller-type">{d.type}</div>
<div className="aurora-best-seller-track">
<div className="aurora-best-seller-fill" style={{ width: `${(d.count / max) * 100}%` }} />
</div>
</div>
<div className="aurora-best-seller-count">{d.count}</div>
</div>
))}
</div>
</div>
</div>
);
}

function ConvertedOrdersPanel({ orders, pages, onClose }) {
const [q, setQ] = useState('');
const shown = orders.filter((o) => {
if (!q) return true;
const s = q.trim().toLowerCase();
return [o.customer, o.orderNo, o.phone, o.orderType, o.convertedByName].filter(Boolean).join(' ').toLowerCase().includes(s);
});
return (
<div className="aurora-modal-overlay" onClick={onClose}>
<div className="aurora-modal tall" onClick={(e) => e.stopPropagation()}>
<div className="aurora-modal-header">
<h3>الطلبات المحوّلة ({orders.length})</h3>
<button onClick={onClose}><X size={17} /></button>
</div>
<div className="aurora-modal-body">
<div className="aurora-search-box">
<Search size={14} />
<input placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} />
</div>
{shown.length === 0 ? (
<div className="aurora-empty-state"><Send size={26} /><p>لا توجد طلبات محوّلة</p></div>
) : shown.map((o) => {
const page = pages.find((p) => p.id === o.pageId);
return (
<div key={o.id} className="aurora-converted-row">
<div className="aurora-converted-info">
<div className="aurora-converted-customer">{o.customer} <span>#{o.orderNo}</span></div>
{o.orderType && <div className="aurora-converted-sub">{o.orderType}</div>}
<div className="aurora-converted-meta">
{page && <span>{page.avatar} {page.name}</span>}
{o.convertedByName && <span> · حوّله: {o.convertedByName}</span>}
{o.convertedAt && <span> · {new Date(o.convertedAt).toLocaleDateString('ar-IQ')}</span>}
</div>
</div>
<div className="aurora-converted-total">{Number(o.total).toLocaleString()} د.ع</div>
</div>
);
})}
</div>
</div>
</div>
);
}

function NeglectedOrdersPanel({ orders, pages, setOrders, onClose }) {
const [selected, setSelected] = useState(new Set());
const [q, setQ] = useState('');
const shown = orders.filter((o) => {
if (!q) return true;
const s = q.trim().toLowerCase();
return [o.customer, o.orderNo, o.phone, o.orderType, o.address].filter(Boolean).join(' ').toLowerCase().includes(s);
});
function toggle(id) {
setSelected((prev) => {
const n = new Set(prev);
if (n.has(id)) n.delete(id); else n.add(id);
return n;
});
}
async function reprintSelected() {
const ids = [...selected];
if (ids.length === 0) { alert('حدّد طلباً واحداً على الأقل'); return; }
const batchId = `batch-${Date.now()}`;
const printedAt = new Date().toISOString();
setOrders((prev) => prev.map((o) => (
ids.includes(o.id) ? { ...o, printed: true, printBatchId: batchId, printedAt, stage: 'prep' } : o
)));
try {
await Promise.all(ids.map((id) => sbUpdate('alfhd_orders', id, {
printed: true, print_batch_id: batchId, printed_at: printedAt, stage: 'prep',
})));
} catch (e) { console.error('reprint neglected error:', e); }
setTimeout(() => window.print(), 80);
setSelected(new Set());
}
return (
<div className="aurora-modal-overlay" onClick={onClose}>
<div className="aurora-modal tall" onClick={(e) => e.stopPropagation()}>
<div className="aurora-modal-header">
<h3>الطلبات المهملة ({orders.length})</h3>
<button onClick={onClose}><X size={17} /></button>
</div>
<div className="aurora-modal-body">
<p className="aurora-summary-hint">طلبات طُبعت لكن لم تُحوّل. حدّد ما تريد وأعد طباعته.</p>
<div className="aurora-search-box">
<Search size={14} />
<input placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} />
</div>
{shown.length === 0 ? (
<div className="aurora-empty-state"><Package size={26} /><p>لا توجد طلبات مهملة</p></div>
) : shown.map((o) => {
const page = pages.find((p) => p.id === o.pageId);
const isSel = selected.has(o.id);
return (
<div key={o.id} onClick={() => toggle(o.id)} className={`aurora-neglected-row ${isSel ? 'selected' : ''}`}>
<div className={`aurora-neglected-check ${isSel ? 'on' : ''}`}>
{isSel && <CheckCircle2 size={13} />}
</div>
<div className="aurora-neglected-info">
<div className="aurora-converted-customer">{o.customer} <span>#{o.orderNo}</span></div>
{o.orderType && <div className="aurora-converted-sub">{o.orderType}</div>}
{page && <div className="aurora-converted-meta">{page.avatar} {page.name}</div>}
</div>
<div className="aurora-converted-total">{Number(o.total).toLocaleString()} د.ع</div>
</div>
);
})}
</div>
<div className="aurora-modal-footer">
<button onClick={onClose} className="aurora-btn ghost">إغلاق</button>
<button onClick={reprintSelected} className="aurora-btn primary">
<Printer size={14} /> إعادة طباعة ({selected.size})
</button>
</div>
</div>
</div>
);
}

function DonutChart({ data }) {
const total = data.reduce((s, d) => s + d.value, 0) || 1;
let cumulative = 0;
const radius = 60;
const circumference = 2 * Math.PI * radius;
return (
<div className="aurora-donut">
<svg width="160" height="160" viewBox="0 0 160 160">
<circle cx="80" cy="80" r={radius} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="18" />
{data.map((d, i) => {
const fraction = d.value / total;
const dash = fraction * circumference;
const offset = -cumulative * circumference;
cumulative += fraction;
return (
<circle key={i} cx="80" cy="80" r={radius} fill="none" stroke={d.color} strokeWidth="18"
strokeDasharray={`${dash} ${circumference - dash}`} strokeDashoffset={offset}
transform="rotate(-90 80 80)" strokeLinecap="round" />
);
})}
<text x="80" y="76" textAnchor="middle" fontSize="22" fontWeight="700" fill="#F8FAFC">{total}</text>
<text x="80" y="94" textAnchor="middle" fontSize="11" fill="#94A3B8">طلب</text>
</svg>
<div className="aurora-donut-legend">
{data.map((d, i) => (
<div key={i} className="aurora-donut-legend-item">
<div className="aurora-donut-legend-dot" style={{ background: d.color }} />
<span>{d.label}</span>
<span className="aurora-donut-legend-value">{d.value}</span>
</div>
))}
</div>
</div>
);
}

// ══════════════════════════════════════════════════════════════
// عرض الصفحات
// ══════════════════════════════════════════════════════════════
function PagesView({ pages, setPages }) {
const [exchanging, setExchanging] = useState(false);
const [fbError, setFbError] = useState('');
const [fbCandidates, setFbCandidates] = useState(null);
const [subscribingId, setSubscribingId] = useState(null);

useEffect(() => {
const params = new URLSearchParams(window.location.search);
const code = params.get('code');
const fbErrorParam = params.get('error_description') || params.get('error');
if (fbErrorParam) {
setFbError(decodeURIComponent(fbErrorParam));
window.history.replaceState({}, '', window.location.pathname);
return;
}
if (code) {
window.history.replaceState({}, '', window.location.pathname);
exchangeCodeForPages(code);
}
}, []);

const exchangeCodeForPages = async (code) => {
setExchanging(true); setFbError('');
try {
const res = await fetch(FB_EXCHANGE_FUNCTION_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
body: JSON.stringify({ code, redirectUri: FB_REDIRECT_URI }),
});
const data = await res.json();
if (!res.ok || data.error) throw new Error(data.error || 'فشل الاتصال بفيسبوك');
if (!data.pages || data.pages.length === 0) {
setFbError('لم يتم العثور على أي صفحة فيسبوك مرتبطة بحسابك.');
return;
}
setFbCandidates(data.pages);
} catch (e) {
console.error('FB exchange failed:', e);
setFbError(e.message || 'حدث خطأ غير متوقع');
} finally { setExchanging(false); }
};

const confirmAddPage = async (candidate) => {
const emojis = ['🦅', '👔', '🛍️', '📱', '🏪', '✨', '🎯', '💎'];
const avatar = emojis[pages.length % emojis.length];
try {
const [created] = await sbInsert('alfhd_pages', {
name: candidate.name, avatar, source: 'facebook', connected: true,
fb_page_id: candidate.fb_page_id, page_access_token: candidate.page_access_token,
});
setPages((prev) => [...prev, mapPageFromDb(created)]);
setFbCandidates((prev) => prev.filter((c) => c.fb_page_id !== candidate.fb_page_id));
await subscribePage(created.id);
} catch (e) {
console.error('Failed to add page:', e);
alert('تعذّر حفظ الصفحة');
}
};

const removePage = async (id) => {
setPages((prev) => prev.filter((p) => p.id !== id));
try { await sbDelete('alfhd_pages', id); }
catch (e) { console.error('Failed to delete page:', e); }
};

const [waSettingsPage, setWaSettingsPage] = useState(null);
const [waPhoneInput, setWaPhoneInput] = useState('');
const [waTokenInput, setWaTokenInput] = useState('');
const [savingWa, setSavingWa] = useState(false);

async function saveWaSettings() {
if (!waSettingsPage) return;
if (!waPhoneInput.trim()) { alert('أدخل Phone Number ID'); return; }
if (!waTokenInput.trim()) { alert('أدخل WhatsApp Token'); return; }
setSavingWa(true);
try {
await sbUpdate('alfhd_pages', waSettingsPage.id, {
wa_phone_number_id: waPhoneInput.trim(), wa_token: waTokenInput.trim(),
});
setPages((prev) => prev.map((p) => p.id === waSettingsPage.id ? {
...p, waPhoneNumberId: waPhoneInput.trim(), waToken: waTokenInput.trim(), waConnected: true,
} : p));
setWaSettingsPage(null);
alert('✅ تم ربط واتساب بنجاح!');
} catch (e) { alert('فشل الحفظ: ' + e.message); }
finally { setSavingWa(false); }
}

async function removeWaSettings(pageId) {
if (!window.confirm('هل تريد إلغاء ربط واتساب؟')) return;
try {
await sbUpdate('alfhd_pages', pageId, { wa_phone_number_id: null, wa_token: null });
setPages((prev) => prev.map((p) => p.id === pageId ? { ...p, waPhoneNumberId: null, waToken: null, waConnected: false } : p));
} catch (e) { alert('فشل: ' + e.message); }
}

const subscribePage = async (pageId) => {
setSubscribingId(pageId);
try {
const res = await fetch(FB_SUBSCRIBE_FUNCTION_URL, {
method: 'POST',
headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY },
body: JSON.stringify({ pageId }),
});
const data = await res.json();
if (!res.ok || data.error) throw new Error(data.error || 'فشل تفعيل استقبال الرسائل');
alert('تم تفعيل استقبال الرسائل الحقيقية بنجاح ✅');
} catch (e) {
console.error('Subscribe failed:', e);
alert('تعذّر تفعيل استقبال الرسائل: ' + (e.message || ''));
} finally { setSubscribingId(null); }
};

return (
<div className="aurora-view">
<div className="aurora-view-header">
<div>
<h2 className="aurora-view-title">الصفحات المرتبطة</h2>
<p className="aurora-view-subtitle">صفحات فيسبوك المرتبطة بنظام AlFhd</p>
</div>
<button onClick={startFacebookLogin} className="aurora-action-btn fb" disabled={exchanging}>
<Facebook size={16} />
{exchanging ? 'جارٍ الاتصال...' : 'ربط صفحة جديدة'}
</button>
</div>

{fbError && (
<div className="aurora-alert error">
<XCircle size={17} />
<span>{fbError}</span>
</div>
)}

{exchanging && (
<div className="aurora-alert info">
<RefreshCw size={15} className="aurora-spin" />
جارٍ التحقق من حسابك على فيسبوك وجلب صفحاتك...
</div>
)}

{fbCandidates && fbCandidates.length > 0 && (
<div className="aurora-candidates">
<div className="aurora-candidates-title">
<Facebook size={14} /> اختر الصفحة للربط
</div>
{fbCandidates.map((c) => (
<div key={c.fb_page_id} className="aurora-candidate-row">
{c.avatar
? <img src={c.avatar} alt="" className="aurora-candidate-avatar" />
: <div className="aurora-candidate-avatar fb"><Facebook size={19} /></div>
}
<div className="aurora-candidate-info">
<div className="aurora-candidate-name">{c.name}</div>
<div className="aurora-candidate-id">ID: {c.fb_page_id}</div>
</div>
<button onClick={() => confirmAddPage(c)} className="aurora-btn primary small">ربط</button>
</div>
))}
</div>
)}

{pages.length === 0 ? (
<div className="aurora-empty-state large">
<div className="aurora-empty-icon fb"><Facebook size={30} /></div>
<div className="aurora-empty-title">لا توجد صفحات مرتبطة</div>
<div className="aurora-empty-sub">اضغط "ربط صفحة جديدة" لبدء ربط صفحاتك</div>
</div>
) : (
<div className="aurora-pages-grid">
{pages.map((p) => (
<div key={p.id} className={`aurora-page-card ${p.connected ? 'connected' : ''}`}>
<div className="aurora-page-card-top" />
<div className="aurora-page-card-header">
<div className="aurora-page-avatar-wrap">
<div className="aurora-page-avatar">
{p.avatar && p.avatar !== '📄' ? p.avatar : <Facebook size={26} />}
</div>
<div className={`aurora-page-status-dot ${p.connected ? 'on' : ''}`} />
</div>
<div className="aurora-page-info">
<div className="aurora-page-name">{p.name}</div>
<div className="aurora-page-id">
<Facebook size={9} />
<span>{p.fbPageId ? p.fbPageId.slice(0, 16) + '...' : 'معرّف غير متاح'}</span>
</div>
<div className={`aurora-page-status-pill ${p.connected ? 'on' : ''}`}>
<span className="aurora-page-status-dot-small" />
{p.connected ? 'متصلة' : 'غير متصلة'}
</div>
</div>
<button onClick={() => removePage(p.id)} title="حذف" className="aurora-icon-btn danger">
<Trash2 size={13} />
</button>
</div>
<div className="aurora-page-card-divider" />
<div className="aurora-page-card-actions">
<button onClick={() => subscribePage(p.id)} disabled={subscribingId === p.id}
className={`aurora-page-action-btn ${p.connected ? 'success' : 'primary'}`}>
{subscribingId === p.id
? <><RefreshCw size={12} className="aurora-spin" /> جارٍ التفعيل...</>
: <><CheckCircle2 size={12} /> {p.connected ? 'تحديث ربط ماسنجر' : 'تفعيل ربط ماسنجر'}</>
}
</button>
<button onClick={() => {
setWaSettingsPage(p);
setWaPhoneInput(p.waPhoneNumberId || '');
setWaTokenInput(p.waToken || '');
}} className={`aurora-page-action-btn wa ${p.waConnected ? 'on' : ''}`}>
<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
{p.waConnected ? 'واتساب مربوط ✓' : 'ربط واتساب'}
</button>
</div>
</div>
))}
</div>
)}

{waSettingsPage && (
<div className="aurora-modal-overlay" onClick={() => setWaSettingsPage(null)}>
<div className="aurora-modal" onClick={(e) => e.stopPropagation()}>
<div className="aurora-modal-header">
<h3><span className="aurora-wa-dot">●</span> ربط واتساب — {waSettingsPage.name}</h3>
<button onClick={() => setWaSettingsPage(null)}><X size={17} /></button>
</div>
<div className="aurora-modal-body">
<div className="aurora-wa-help">
<div className="aurora-wa-help-title">كيف أحصل على هذه المعلومات؟</div>
<div>١. افتح developers.facebook.com ← تطبيقك ALfhd-app</div>
<div>٢. واتساب ← إعداد واجهة API</div>
<div>٣. انسخ <b>معرف رقم الهاتف</b> و<b>رمز الوصول</b></div>
</div>
<div className="aurora-form-group">
<label>Phone Number ID <span className="aurora-required">*</span></label>
<input value={waPhoneInput} onChange={(e) => setWaPhoneInput(e.target.value)}
className="aurora-mono" placeholder="مثال: 1187286511134496" />
</div>
<div className="aurora-form-group">
<label>رمز الوصول (Access Token) <span className="aurora-required">*</span></label>
<textarea value={waTokenInput} onChange={(e) => setWaTokenInput(e.target.value)}
className="aurora-mono" placeholder="EAAOXwA1p2Z..." />
</div>
<div className="aurora-form-group">
<label>Webhook URL للواتساب</label>
<div className="aurora-webhook-row">
<input readOnly value={`${SUPABASE_URL}/functions/v1/wa-webhook`} className="aurora-mono" />
<button onClick={() => navigator.clipboard?.writeText(`${SUPABASE_URL}/functions/v1/wa-webhook`)}
className="aurora-btn ghost small">نسخ</button>
</div>
</div>
{waSettingsPage.waConnected && (
<button onClick={() => { removeWaSettings(waSettingsPage.id); setWaSettingsPage(null); }}
className="aurora-btn danger full">إلغاء ربط واتساب</button>
)}
</div>
<div className="aurora-modal-footer">
<button onClick={() => setWaSettingsPage(null)} className="aurora-btn ghost">إلغاء</button>
<button onClick={saveWaSettings} disabled={savingWa} className="aurora-btn wa">
{savingWa ? 'جارٍ الحفظ...' : '✓ حفظ وربط واتساب'}
</button>
</div>
</div>
</div>
)}
</div>
);
}

// ══════════════════════════════════════════════════════════════
// عرض الإدارة
// ══════════════════════════════════════════════════════════════
const PERMISSIONS_LIST = [
{ id: 'conversations', label: 'عرض المحادثات' },
{ id: 'orders_view', label: 'عرض الطلبات' },
{ id: 'orders_edit', label: 'تعديل حالة الطلبات' },
{ id: 'stats', label: 'عرض الإحصائيات' },
{ id: 'pages_manage', label: 'إدارة الصفحات' },
{ id: 'users_manage', label: 'إدارة المستخدمين' },
];

function AdminView({ users, setUsers, orders, conversations, onViewConversation, onContactWhatsApp }) {
const [adminTab, setAdminTab] = useState('managers');
const [showAdd, setShowAdd] = useState(false);
const [editingUser, setEditingUser] = useState(null);
const [form, setForm] = useState({ name: '', code: '', role: 'manager', permissions: [], jobTitle: '', whatsapp: '' });
const [saving, setSaving] = useState(false);
const [formError, setFormError] = useState('');
const managers = users.filter((u) => u.role === 'admin' || u.role === 'manager');
const warehouse = users.filter((u) => u.role === 'warehouse');

const openAddManager = () => {
setForm({ name: '', code: '', role: 'manager', permissions: [], jobTitle: '', whatsapp: '' });
setEditingUser(null); setFormError(''); setShowAdd(true);
};
const openAddWarehouse = () => {
setForm({ name: '', code: '', role: 'warehouse', permissions: [], jobTitle: '', whatsapp: '' });
setEditingUser(null); setFormError(''); setShowAdd(true);
};
const openEdit = (user) => {
setForm({ name: user.name, code: user.code, role: user.role, permissions: user.permissions || [], jobTitle: user.jobTitle || '', whatsapp: user.whatsapp || '' });
setEditingUser(user); setFormError(''); setShowAdd(true);
};
const togglePermission = (permId) => {
setForm((prev) => ({
...prev,
permissions: prev.permissions.includes(permId) ? prev.permissions.filter((p) => p !== permId) : [...prev.permissions, permId],
}));
};
const saveUser = async () => {
if (!form.name.trim() || saving) return;
const code = form.code.trim();
if (!/^\d{4}$/.test(code)) { setFormError('رمز الدخول يجب أن يكون 4 أرقام'); return; }
const codeTaken = users.some((u) => u.code === code && u.id !== editingUser?.id);
if (codeTaken) { setFormError('هذا الرمز مستخدم من قبل'); return; }
setSaving(true); setFormError('');
try {
const payload = {
name: form.name.trim(), code, role: form.role,
permissions: form.role === 'admin' ? ['all'] : form.permissions,
job_title: form.jobTitle || null, whatsapp: form.whatsapp || null,
};
if (editingUser) {
const [updated] = await sbUpdate('alfhd_users', editingUser.id, payload);
setUsers((prev) => prev.map((u) => u.id === editingUser.id ? mapUserFromDb(updated) : u));
} else {
const [created] = await sbInsert('alfhd_users', { ...payload, active: true });
setUsers((prev) => [...prev, mapUserFromDb(created)]);
}
setShowAdd(false);
} catch (e) {
console.error('save user error:', e);
setFormError('خطأ: ' + e.message);
} finally { setSaving(false); }
};
const toggleActive = async (id) => {
const target = users.find((u) => u.id === id);
if (!target) return;
const newActive = !target.active;
setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: newActive } : u));
try { await sbUpdate('alfhd_users', id, { active: newActive }); } catch (e) { console.error(e); }
};
const deleteUser = async (id) => {
if (!window.confirm('حذف هذا الموظف نهائياً؟')) return;
setUsers((prev) => prev.filter((u) => u.id !== id));
try { await sbDelete('alfhd_users', id); } catch (e) { console.error(e); }
};

const fulfillmentOrders = useMemo(() => {
return orders.filter((o) => o.prepStatus === 'done' || o.prepStatus === 'rejected')
.sort((a, b) => new Date(b.prepAt || 0) - new Date(a.prepAt || 0));
}, [orders]);

const ADMIN_TABS = [
{ id: 'managers', label: 'المدراء', icon: ShieldCheck },
{ id: 'warehouse', label: 'موظفي التجهيز', icon: Package },
{ id: 'fulfillment', label: 'متابعة التجهيز', icon: CheckCircle2 },
];

function UserCard({ u, isWarehouse }) {
return (
<div className={`aurora-user-card ${u.active ? '' : 'inactive'}`}>
<div className="aurora-user-card-top">
<div className={`aurora-user-card-avatar ${u.role === 'admin' ? 'admin' : ''}`}>
{u.name[0]}
</div>
<div className="aurora-user-card-info">
<div className="aurora-user-card-name">{u.name}</div>
<div className="aurora-user-card-role">
{u.role === 'admin' ? <><ShieldCheck size={11} color="#10B981" /> مدير عام</>
: u.role === 'warehouse' ? <><Package size={11} color="#F59E0B" /> {u.jobTitle || 'موظف تجهيز'}</>
: <><Shield size={11} color="#6366F1" /> مدير ({(u.permissions || []).length} صلاحية)</>}
</div>
</div>
<div className={`aurora-active-dot ${u.active ? 'on' : ''}`} />
</div>
<div className="aurora-user-card-meta">
<span className="aurora-code-tag">الرمز: {u.code}</span>
{isWarehouse && u.whatsapp && <span className="aurora-code-tag">واتساب: {u.whatsapp}</span>}
</div>
{u.role === 'manager' && (u.permissions || []).length > 0 && (
<div className="aurora-user-perms">
{u.permissions.map((pId) => {
const perm = PERMISSIONS_LIST.find((p) => p.id === pId);
return perm ? <span key={pId} className="aurora-perm-tag">{perm.label}</span> : null;
})}
</div>
)}
<div className="aurora-user-card-actions">
<button onClick={() => openEdit(u)} className="aurora-user-action-btn"><Edit3 size={12} /> تعديل</button>
<button onClick={() => toggleActive(u.id)} className="aurora-user-action-btn">
{u.active ? <EyeOff size={12} /> : <Eye size={12} />} {u.active ? 'تعطيل' : 'تفعيل'}
</button>
{u.role !== 'admin' && (
<button onClick={() => deleteUser(u.id)} className="aurora-user-action-btn danger"><Trash2 size={12} /> حذف</button>
)}
</div>
</div>
);
}

return (
<div className="aurora-view">
<div className="aurora-view-header">
<div>
<h2 className="aurora-view-title">الإدارة العامة</h2>
<p className="aurora-view-subtitle">المدراء، موظفو المخزن، ومتابعة تجهيز الطلبات</p>
</div>
{adminTab === 'managers' && <button onClick={openAddManager} className="aurora-action-btn primary"><UserPlus size={15} /> إضافة مدير</button>}
{adminTab === 'warehouse' && <button onClick={openAddWarehouse} className="aurora-action-btn primary"><UserPlus size={15} /> إضافة موظف تجهيز</button>}
</div>

<div className="aurora-section-tabs">
{ADMIN_TABS.map((t) => {
const Icon = t.icon;
return (
<button key={t.id} onClick={() => setAdminTab(t.id)} className={`aurora-section-tab ${adminTab === t.id ? 'active' : ''}`}>
<Icon size={13} /> {t.label}
</button>
);
})}
</div>

{adminTab === 'managers' && (
<div className="aurora-users-grid">{managers.map((u) => <UserCard key={u.id} u={u} />)}</div>
)}
{adminTab === 'warehouse' && (
warehouse.length === 0 ? (
<div className="aurora-empty-state"><Package size={30} /><p>لا يوجد موظفو تجهيز بعد</p></div>
) : (
<div className="aurora-users-grid">{warehouse.map((u) => <UserCard key={u.id} u={u} isWarehouse />)}</div>
)
)}
{adminTab === 'fulfillment' && (
<FulfillmentList orders={fulfillmentOrders} users={users} onViewConversation={onViewConversation} onContactWhatsApp={onContactWhatsApp} />
)}

{showAdd && (
<div className="aurora-modal-overlay" onClick={() => setShowAdd(false)}>
<div className="aurora-modal" onClick={(e) => e.stopPropagation()}>
<div className="aurora-modal-header">
<h3>{editingUser ? 'تعديل' : (form.role === 'warehouse' ? 'إضافة موظف تجهيز' : 'إضافة مدير')}</h3>
<button onClick={() => setShowAdd(false)}><X size={17} /></button>
</div>
<div className="aurora-modal-body">
<div className="aurora-form-group">
<label>الاسم</label>
<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="اسم الموظف" />
</div>
{form.role === 'warehouse' && (
<>
<div className="aurora-form-group">
<label>المسمى الوظيفي</label>
<input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} placeholder="مثال: مسؤول تجهيز" />
</div>
<div className="aurora-form-group">
<label>رقم واتساب</label>
<input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} placeholder="07XXXXXXXXX" />
</div>
</>
)}
<div className="aurora-form-group">
<label>رمز الدخول (4 أرقام)</label>
<input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="1234" inputMode="numeric" />
</div>
{form.role !== 'warehouse' && (
<>
<div className="aurora-form-group">
<label>نوع المدير</label>
<div className="aurora-role-toggle">
<button onClick={() => setForm({ ...form, role: 'admin' })} className={`aurora-role-btn ${form.role === 'admin' ? 'active' : ''}`}>
<ShieldCheck size={13} /> مدير عام
</button>
<button onClick={() => setForm({ ...form, role: 'manager' })} className={`aurora-role-btn ${form.role === 'manager' ? 'active' : ''}`}>
<Shield size={13} /> صلاحية محددة
</button>
</div>
</div>
{form.role === 'manager' && (
<div className="aurora-form-group">
<label>الصلاحيات</label>
<div className="aurora-perms-grid">
{PERMISSIONS_LIST.map((perm) => (
<label key={perm.id} className="aurora-perm-check">
<input type="checkbox" checked={form.permissions.includes(perm.id)} onChange={() => togglePermission(perm.id)} />
<span>{perm.label}</span>
</label>
))}
</div>
</div>
)}
</>
)}
{form.role === 'warehouse' && (
<div className="aurora-warehouse-note">
<AlertCircle size={13} color="#F59E0B" />
<span>موظف التجهيز يرى فقط الطلبات المثبتة، ويعلّمها "تم التجهيز" أو "لم يتم" بدون صلاحية تعديل أو حذف.</span>
</div>
)}
{formError && <p className="aurora-error">{formError}</p>}
</div>
<div className="aurora-modal-footer">
<button onClick={() => setShowAdd(false)} className="aurora-btn ghost">إلغاء</button>
<button onClick={saveUser} className="aurora-btn primary" disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</button>
</div>
</div>
</div>
)}
</div>
);
}

function FulfillmentList({ orders, users, onViewConversation, onContactWhatsApp }) {
const [filter, setFilter] = useState('all');
const [timeFilter, setTimeFilter] = useState('all');
const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
const [customYear, setCustomYear] = useState(new Date().getFullYear());
const years = [];
for (let y = new Date().getFullYear(); y >= 2024; y--) years.push(y);
function inTime(dateStr) { return dateInRange(dateStr, timeFilter, customMonth, customYear); }
const shown = orders.filter((o) => (filter === 'all' || o.prepStatus === filter) && inTime(o.prepAt));
if (orders.length === 0) {
return <div className="aurora-empty-state"><CheckCircle2 size={30} /><p>لا توجد طلبات تم التعامل معها بعد</p></div>;
}
return (
<div>
<div className="aurora-chips">
{[['all', 'الكل'], ['done', 'تم التجهيز'], ['rejected', 'لم يتم']].map(([id, label]) => (
<button key={id} onClick={() => setFilter(id)} className={`aurora-chip ${filter === id ? 'active' : ''}`}>{label}</button>
))}
</div>
<div className="aurora-filters" style={{ marginTop: 10 }}>
<div className="aurora-filters-row">
<div className="aurora-filter-select">
<Calendar size={14} />
<select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)}>
{DATE_PRESETS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
</select>
<ChevronDown size={13} />
</div>
{timeFilter === 'custom' && (
<>
<select value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} className="aurora-compact-select">
{AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
</select>
<select value={customYear} onChange={(e) => setCustomYear(e.target.value)} className="aurora-compact-select">
{years.map((y) => <option key={y} value={y}>{y}</option>)}
</select>
</>
)}
</div>
</div>
<div className="aurora-orders-grid" style={{ marginTop: 14 }}>
{shown.map((o) => {
const prepUser = users.find((u) => u.id === o.prepBy);
const isDone = o.prepStatus === 'done';
const prepTime = o.prepAt ? new Date(o.prepAt).toLocaleString('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' }) : null;
return (
<div key={o.id} className={`aurora-order-card ${isDone ? '' : 'rejected'}`}>
{!isDone && (
<div className="aurora-rejected-banner">
<AlertCircle size={14} />
<span>طلب لم يُجهَّز — يحتاج متابعة عاجلة</span>
</div>
)}
<div className="aurora-order-head">
<div className={`aurora-order-avatar ${isDone ? 'done' : 'rej'}`}>
{isDone ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
</div>
<div className="aurora-order-head-info">
<div className="aurora-order-customer">{o.customer} <span>#{o.orderNo}</span></div>
<div className="aurora-order-page">المجهّز: {o.prepByName || prepUser?.name || 'غير معروف'}</div>
</div>
<div className="aurora-stage-badge" style={{ color: isDone ? '#10B981' : '#EF4444', background: isDone ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.16)' }}>
{isDone ? 'تم التجهيز' : 'لم يتم'}
</div>
</div>
{prepTime && (
<div className="aurora-prep-time">
<Calendar size={11} />
<span>{isDone ? 'وقت التجهيز' : 'وقت الرفض'}: {prepTime}</span>
</div>
)}
{!isDone && o.prepReason && (
<div className="aurora-reject-reason">
<span className="aurora-reject-label">سبب عدم التجهيز:</span>
<span>{o.prepReason}</span>
</div>
)}
{o.items && <div className="aurora-order-items">{o.items}</div>}
{!isDone && (
<div className="aurora-order-actions">
{prepUser?.whatsapp && (
<button onClick={() => onContactWhatsApp?.(prepUser.whatsapp)} className="aurora-order-action-btn">
<Phone size={13} /> <span>المجهّز</span>
</button>
)}
{o.conversationId ? (
<button onClick={() => onViewConversation?.(o.conversationId)} className="aurora-order-action-btn">
<MessageSquare size={13} /> <span>الزبون</span>
</button>
) : o.phone ? (
<button onClick={() => onContactWhatsApp?.(o.phone)} className="aurora-order-action-btn">
<Phone size={13} /> <span>الزبون</span>
</button>
) : null}
</div>
)}
</div>
);
})}
</div>
</div>
);
}

// ══════════════════════════════════════════════════════════════
// واجهة موظف التجهيز
// ══════════════════════════════════════════════════════════════
function PrepWorkerView({ currentUser, onLogout }) {
const [orders, setOrders] = useState([]);
const [loading, setLoading] = useState(true);
const [rejectTarget, setRejectTarget] = useState(null);
const [rejectReason, setRejectReason] = useState('');
const [busyId, setBusyId] = useState(null);
const knownIdsRef = React.useRef(new Set());

const loadOrders = useCallback(async () => {
try {
const rows = await sbSelect('alfhd_orders', '&order=created_at.desc&limit=300');
if (!rows) return;
const mapped = rows.map(mapOrderFromDb)
.filter((o) => o.converted !== true && o.stage !== 'delivery' && o.prepStatus !== 'done');
if (knownIdsRef.current.size > 0) {
const isNew = mapped.some((o) => !knownIdsRef.current.has(o.id) && o.prepStatus !== 'rejected');
if (isNew) { try { playNotificationSound(); } catch (_e) {} }
}
knownIdsRef.current = new Set(mapped.map((o) => o.id));
setOrders(mapped);
} catch (e) { console.error('prep load error:', e); }
finally { setLoading(false); }
}, []);

useEffect(() => {
loadOrders();
const interval = setInterval(loadOrders, 12000);
return () => clearInterval(interval);
}, [loadOrders]);

async function markDone(o) {
setBusyId(o.id);
const patch = { prep_status: 'done', prep_by: currentUser.id, prep_by_name: currentUser.name, prep_at: new Date().toISOString() };
try { await sbUpdate('alfhd_orders', o.id, patch); } catch (e) { console.error(e); }
setOrders((prev) => prev.filter((x) => x.id !== o.id));
setBusyId(null);
}

async function confirmReject() {
if (!rejectTarget) return;
const o = rejectTarget;
setBusyId(o.id);
const patch = {
prep_status: 'rejected', prep_by: currentUser.id, prep_by_name: currentUser.name,
prep_at: new Date().toISOString(), prep_reason: rejectReason.trim() || null,
};
try { await sbUpdate('alfhd_orders', o.id, patch); } catch (e) { console.error(e); }
setOrders((prev) => prev.filter((x) => x.id !== o.id));
setRejectTarget(null); setRejectReason(''); setBusyId(null);
}

const pending = orders.filter((o) => o.prepStatus !== 'rejected');

return (
<ErrorBoundary>
<>
<GlobalStyles />
<div className="aurora-app">
<main className="aurora-main full">
<div className="aurora-prep-header">
<div className="aurora-prep-brand">
<div className="aurora-prep-icon"><Package size={17} /></div>
<div>
<div className="aurora-prep-title">التجهيز</div>
<div className="aurora-prep-name">{currentUser.name}</div>
</div>
</div>
<button onClick={onLogout} className="aurora-btn danger small">
<LogOut size={13} /> خروج
</button>
</div>
<div className="aurora-prep-counter">
<span>طلبات بحاجة للتجهيز</span>
<span className={`aurora-prep-count ${pending.length ? 'has' : ''}`}>{pending.length}</span>
</div>
<div className="aurora-prep-content">
{loading && <div className="aurora-empty-state"><Package size={28} /><p>جارٍ التحميل...</p></div>}
{!loading && pending.length === 0 && (
<div className="aurora-empty-state success"><CheckCircle2 size={32} /><p>ما في طلبات بحاجة للتجهيز حالياً 🎉</p></div>
)}
<div className="aurora-orders-grid">
{pending.map((o, i) => (
<div key={o.id} className="aurora-order-card prep" style={{ animationDelay: `${Math.min(i * 0.04, 0.4)}s` }}>
<div className="aurora-order-strip" style={{ background: '#F59E0B' }} />
<div className="aurora-prep-card-body">
<div className="aurora-prep-card-head">
<div className="aurora-prep-card-icon"><Package size={18} /></div>
<div className="aurora-prep-card-info">
<div className="aurora-prep-card-customer">{o.customer || 'زبون'} <span>#{o.orderNo}</span></div>
<div className="aurora-prep-card-loc">{o.governorateName}{o.area ? ' - ' + o.area : ''}</div>
</div>
</div>
{o.items && (
<div className="aurora-prep-items">
<div className="aurora-prep-items-label">المنتجات المطلوبة</div>
<div>{o.items}</div>
</div>
)}
{o.orderType && (
<div className="aurora-prep-type">نوع الطلب: <span>{o.orderType}</span></div>
)}
{o.reprepNote && (
<div className="aurora-prep-note">
<div className="aurora-prep-note-title">⚠️ رسالة من المدير</div>
<div>{o.reprepNote}</div>
</div>
)}
<div className="aurora-prep-actions">
<button onClick={() => markDone(o)} disabled={busyId === o.id} className="aurora-prep-btn done">
<CheckCircle2 size={15} /> تم التجهيز
</button>
<button onClick={() => { setRejectTarget(o); setRejectReason(''); }} disabled={busyId === o.id} className="aurora-prep-btn reject">
<XCircle size={15} /> لم يتم
</button>
</div>
</div>
</div>
))}
</div>
</div>
</main>
</div>
{rejectTarget && (
<div className="aurora-modal-overlay" onClick={() => !busyId && setRejectTarget(null)}>
<div className="aurora-modal small" onClick={(e) => e.stopPropagation()}>
<div className="aurora-modal-header">
<h3>لم يتم التجهيز</h3>
<button onClick={() => setRejectTarget(null)}><X size={17} /></button>
</div>
<div className="aurora-modal-body">
<div className="aurora-modal-sub">طلب #{rejectTarget.orderNo} — {rejectTarget.customer}</div>
<div className="aurora-form-group">
<label>السبب <span className="aurora-hint">(اختياري)</span></label>
<textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
placeholder="مثال: المنتج غير متوفر" rows={3} />
</div>
<div className="aurora-modal-footer">
<button onClick={() => setRejectTarget(null)} disabled={!!busyId} className="aurora-btn ghost">رجوع</button>
<button onClick={confirmReject} disabled={!!busyId} className="aurora-btn danger">
{busyId ? 'جارٍ الإرسال...' : 'تأكيد — لم يتم'}
</button>
</div>
</div>
</div>
</div>
)}
</>
</ErrorBoundary>
);
}

// ══════════════════════════════════════════════════════════════
// ErrorBoundary
// ══════════════════════════════════════════════════════════════
class ErrorBoundary extends React.Component {
constructor(props) { super(props); this.state = { error: null }; }
static getDerivedStateFromError(e) { return { error: e }; }
render() {
if (this.state.error) {
return (
<div className="aurora-error-screen">
<div className="aurora-error-card">
<div className="aurora-error-title">⚠️ خطأ في التطبيق</div>
<div className="aurora-error-msg">{this.state.error?.message}</div>
<div className="aurora-error-stack">{this.state.error?.stack?.slice(0, 500)}</div>
</div>
</div>
);
}
return this.props.children;
}
}

// ══════════════════════════════════════════════════════════════
// WarehouseView (نفس المنطق الأصلي)
// ══════════════════════════════════════════════════════════════
const WH_PRODUCT_TYPES = [
{ id: 'mother_dosah', label: 'أم الدوسة', icon: '🪣', color: '#6366F1' },
{ id: 'rubble_hodi', label: 'ربل حوضي', icon: '📦', color: '#8B5CF6' },
{ id: 'leather', label: 'جلد', icon: '✨', color: '#F59E0B' },
];
const WH_DEBT_TYPES = [
{ id: 'supplier', label: 'موزع جملة', color: '#EF4444' },
{ id: 'rent', label: 'إيجار', color: '#F59E0B' },
{ id: 'salary', label: 'راتب', color: '#8B5CF6' },
{ id: 'expense', label: 'مصاريف', color: '#06B6D4' },
{ id: 'other', label: 'أخرى', color: '#64748B' },
];
const LOW_STOCK = 3;
function whFmt(n) { return `${(Number(n)||0).toLocaleString()} د.ع`; }
function whToday() { return new Date().toISOString().slice(0,10); }
function whDaysUntil(d) { return d ? Math.ceil((new Date(d)-new Date())/86400000) : null; }

function WhModal({ title, onClose, children }) {
return (
<div className="aurora-modal-overlay" onClick={onClose}>
<div className="aurora-modal" onClick={e=>e.stopPropagation()}>
<div className="aurora-modal-header">
<h3>{title}</h3>
<button onClick={onClose}><X size={17}/></button>
</div>
<div className="aurora-modal-body">{children}</div>
</div>
</div>
);
}
function WhField({ label, required, children }) {
return (
<div className="aurora-form-group">
<label>{label}{required && <span className="aurora-required"> *</span>}</label>
{children}
</div>
);
}

function WhDashboard({ products, sales, debts, suppliers }) {
const low = products.filter(p=>p.quantity<=LOW_STOCK);
const stockVal = products.reduce((s,p)=>s+(p.quantity*(p.cost_iqd||0)),0);
const todayRev = sales.filter(s=>s.date===whToday()).reduce((s,x)=>s+x.total_iqd,0);
const monthRev = sales.filter(s=>s.date?.slice(0,7)===whToday().slice(0,7)).reduce((s,x)=>s+x.total_iqd,0);
const totalDebt = debts.filter(d=>d.status==='unpaid').reduce((s,d)=>s+(d.amount_iqd||0),0);
const urgent = debts.filter(d=>d.status==='unpaid'&&whDaysUntil(d.due_date)!==null&&whDaysUntil(d.due_date)<=7);
const stats = [
{l:'مبيعات اليوم', v:whFmt(todayRev), c:'#10B981', I:TrendingUp},
{l:'مبيعات الشهر', v:whFmt(monthRev), c:'#06B6D4', I:BarChart3},
{l:'رصيد المخزن', v:whFmt(stockVal), c:'#8B5CF6', I:Warehouse},
{l:'إجمالي الديون', v:whFmt(totalDebt), c:'#EF4444', I:CreditCard},
{l:'أصناف المنتجات', v:products.length, c:'#F59E0B', I:Package},
{l:'موزعون', v:suppliers.length, c:'#06B6D4', I:Truck},
];
return (
<div>
{(low.length>0||urgent.length>0)&&(
<div className="aurora-alert warn">
<div className="aurora-alert-title"><AlertCircle size={14}/>تنبيهات</div>
{low.length>0&&<div>⚠️ {low.length} منتج أقل من {LOW_STOCK} قطع: {low.slice(0,3).map(p=>p.car_name).join('، ')}</div>}
{urgent.length>0&&<div>🔴 {urgent.length} دين يستحق خلال 7 أيام</div>}
</div>
)}
<div className="aurora-wh-stats-grid">
{stats.map(s=>(
<div key={s.l} className="aurora-wh-stat" style={{ '--accent': s.c }}>
<s.I size={17} />
<div className="aurora-wh-stat-value">{s.v}</div>
<div className="aurora-wh-stat-label">{s.l}</div>
</div>
))}
</div>
{low.length>0&&(
<div className="aurora-wh-section danger">
<div className="aurora-wh-section-title">منتجات تحتاج تزويد</div>
{low.map(p=>(
<div key={p.id} className="aurora-wh-low-item">
<div>
<div className="aurora-wh-low-name">{p.car_name} — {WH_PRODUCT_TYPES.find(t=>t.id===p.type)?.label}</div>
{p.location&&<div className="aurora-wh-low-loc">📍 {p.location}</div>}
</div>
<div className={`aurora-wh-low-qty ${p.quantity===0?'zero':''}`}>{p.quantity}</div>
</div>
))}
</div>
)}
<div className="aurora-wh-section">
<div className="aurora-wh-section-title">آخر المبيعات</div>
{sales.slice(0,5).map(s=>(
<div key={s.id} className="aurora-wh-sale-row">
<div>
<div className="aurora-wh-sale-name">{s.product_name}</div>
<div className="aurora-wh-sale-meta">{s.date} · {s.customer_name||'زبون'}</div>
</div>
<div className="aurora-wh-sale-total">{whFmt(s.total_iqd)}</div>
</div>
))}
{!sales.length&&<div className="aurora-empty-state small">لا توجد مبيعات بعد</div>}
</div>
</div>
);
}

function WhProducts({ products, setProducts, cars, setCars, sbI, sbU, sbD }) {
const [search,setSearch]=useState('');
const [type,setType]=useState('all');
const [modal,setModal]=useState(false);
const [carModal,setCarModal]=useState(false);
const [editing,setEditing]=useState(null);
const [form,setForm]=useState({car_name:'',type:'mother_dosah',quantity:0,cost_iqd:0,price_iqd:0,location:'',notes:''});
const [carForm,setCarForm]=useState({name:''});
const [saving,setSaving]=useState(false);
const filtered = products.filter(p=>(type==='all'||p.type===type)&&(!search||p.car_name?.includes(search)||p.location?.includes(search)));
function openNew(){setEditing(null);setForm({car_name:'',type:'mother_dosah',quantity:0,cost_iqd:0,price_iqd:0,location:'',notes:''});setModal(true);}
function openEdit(p){setEditing(p);setForm({...p});setModal(true);}
async function save(){
if(!form.car_name.trim()){alert('أدخل اسم السيارة');return;}
setSaving(true);
try{
if(editing){await sbU('wh_products',editing.id,form);setProducts(prev=>prev.map(p=>p.id===editing.id?{...p,...form}:p));}
else{const r=await sbI('wh_products',{...form,created_at:new Date().toISOString()});if(r?.[0])setProducts(prev=>[r[0],...prev]);}
setModal(false);
}catch(e){alert('فشل: '+e.message);}
setSaving(false);
}
async function addCar(){
if(!carForm.name.trim()){alert('أدخل اسم السيارة');return;}
setSaving(true);
try{
const prods=await Promise.all(WH_PRODUCT_TYPES.map(t=>sbI('wh_products',{car_name:carForm.name,type:t.id,quantity:0,cost_iqd:0,price_iqd:0,location:'',created_at:new Date().toISOString()})));
const added=prods.flatMap(r=>r||[]);
setProducts(prev=>[...added,...prev]);
setCars(prev=>[...new Set([...prev,carForm.name])]);
setCarModal(false);setCarForm({name:''});
}catch(e){alert('فشل: '+e.message);}
setSaving(false);
}
async function del(id){if(!confirm('حذف هذا المنتج؟'))return;await sbD('wh_products',id);setProducts(prev=>prev.filter(p=>p.id!==id));}
return (
<div>
<div className="aurora-wh-header">
<h3>المنتجات والمخزون</h3>
<div className="aurora-wh-header-actions">
<button onClick={()=>setCarModal(true)} className="aurora-btn ghost small"><Plus size={12}/> إضافة سيارة</button>
<button onClick={openNew} className="aurora-btn primary small"><Plus size={12}/> منتج جديد</button>
</div>
</div>
<div className="aurora-wh-filters">
<div className="aurora-search-box flex">
<Search size={12} />
<input value={search} onChange={e=>setSearch(e.target.value)} placeholder="بحث..." />
</div>
{[{id:'all',label:'الكل'},...WH_PRODUCT_TYPES].map(t=>(
<button key={t.id} onClick={()=>setType(t.id)} className={`aurora-wh-type-chip ${type===t.id?'active':''}`}>
{t.icon||''} {t.label}
</button>
))}
</div>
<div className="aurora-wh-list">
{filtered.length===0?<div className="aurora-empty-state small">لا توجد منتجات</div>:
filtered.map((p,i)=>{
const t=WH_PRODUCT_TYPES.find(x=>x.id===p.type);
const isLow=p.quantity<=LOW_STOCK;
return(
<div key={p.id} className="aurora-wh-product-row">
<div className="aurora-wh-product-icon" style={{ background: `${t?.color||'#6366F1'}20`, color: t?.color }}>{t?.icon}</div>
<div className="aurora-wh-product-info">
<div className="aurora-wh-product-name">{p.car_name}</div>
<div className="aurora-wh-product-tags">
<span className="aurora-wh-product-tag" style={{ color: t?.color, background: `${t?.color||'#6366F1'}15` }}>{t?.label}</span>
{p.location&&<span className="aurora-wh-product-loc">📍 {p.location}</span>}
{p.price_iqd>0&&<span className="aurora-wh-product-price">{whFmt(p.price_iqd)}</span>}
</div>
</div>
<div className="aurora-wh-product-qty-wrap">
<div className={`aurora-wh-product-qty ${isLow?'low':''}`}>{p.quantity}</div>
<div className="aurora-wh-product-qty-label">قطعة</div>
{isLow&&<div className="aurora-wh-product-qty-warn">⚠️</div>}
</div>
<div className="aurora-wh-product-actions">
<button onClick={()=>openEdit(p)} className="aurora-icon-btn"><Edit3 size={12}/></button>
<button onClick={()=>del(p.id)} className="aurora-icon-btn danger"><Trash2 size={12}/></button>
</div>
</div>
);
})}
</div>
{modal&&(
<WhModal title={editing?'تعديل منتج':'إضافة منتج'} onClose={()=>setModal(false)}>
<WhField label="اسم السيارة" required>
<select value={form.car_name} onChange={e=>setForm(f=>({...f,car_name:e.target.value}))}>
<option value="">اختر سيارة...</option>
{cars.map(c=><option key={c} value={c}>{c}</option>)}
<option value="__new__">+ اكتب اسم جديد</option>
</select>
{form.car_name==='__new__'&&<input placeholder="اسم السيارة الجديدة" onChange={e=>setForm(f=>({...f,car_name:e.target.value}))} style={{marginTop:6}}/>}
</WhField>
<WhField label="نوع المنتج" required>
<select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
{WH_PRODUCT_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
</select>
</WhField>
<div className="aurora-grid-2">
<WhField label="الكمية"><input type="number" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:Number(e.target.value)}))} /></WhField>
<WhField label="سعر الشراء (د.ع)"><input type="number" value={form.cost_iqd} onChange={e=>setForm(f=>({...f,cost_iqd:Number(e.target.value)}))} /></WhField>
<WhField label="سعر البيع (د.ع)" required><input type="number" value={form.price_iqd} onChange={e=>setForm(f=>({...f,price_iqd:Number(e.target.value)}))} /></WhField>
<WhField label="موقع المخزن"><input value={form.location} onChange={e=>setForm(f=>({...f,location:e.target.value}))} placeholder="فرع A، رف 350" /></WhField>
</div>
<WhField label="ملاحظات"><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></WhField>
<div className="aurora-modal-footer">
<button onClick={()=>setModal(false)} className="aurora-btn ghost">إلغاء</button>
<button onClick={save} disabled={saving} className="aurora-btn primary">{saving?'جارٍ الحفظ...':'حفظ'}</button>
</div>
</WhModal>
)}
{carModal&&(
<WhModal title="إضافة سيارة جديدة" onClose={()=>setCarModal(false)}>
<div className="aurora-info-box">
سيتم إضافة الأنواع الثلاثة (أم الدوسة، ربل حوضي، جلد) تلقائياً
</div>
<WhField label="اسم السيارة" required>
<input value={carForm.name} onChange={e=>setCarForm({name:e.target.value})} placeholder="مثال: تويوتا كامري 2022" />
</WhField>
<div className="aurora-modal-footer">
<button onClick={()=>setCarModal(false)} className="aurora-btn ghost">إلغاء</button>
<button onClick={addCar} disabled={saving} className="aurora-btn primary">{saving?'جارٍ الإضافة...':'✨ إضافة للأنواع الثلاثة'}</button>
</div>
</WhModal>
)}
</div>
);
}

function WhSales({ sales, setSales, products, sbI }) {
const [period,setPeriod]=useState('month');
const [modal,setModal]=useState(false);
const [form,setForm]=useState({product_id:'',product_name:'',quantity:1,price_iqd:0,total_iqd:0,customer_name:'',date:whToday(),notes:''});
const [saving,setSaving]=useState(false);
const now=new Date();
const filtered=useMemo(()=>sales.filter(s=>{
const d=new Date(s.date);
if(period==='today')return s.date===whToday();
if(period==='week')return(now-d)/86400000<=7;
if(period==='month')return s.date?.slice(0,7)===whToday().slice(0,7);
if(period==='year')return s.date?.slice(0,4)===whToday().slice(0,4);
return true;
}),[sales,period]);
const rev=filtered.reduce((s,x)=>s+x.total_iqd,0);
async function save(){
if(!form.product_name||!form.price_iqd){alert('أدخل المنتج والسعر');return;}
setSaving(true);
try{
const d={...form,total_iqd:form.price_iqd*form.quantity,created_at:new Date().toISOString()};
const r=await sbI('wh_sales',d);
if(r?.[0])setSales(prev=>[r[0],...prev]);
setModal(false);
}catch(e){alert('فشل: '+e.message);}
setSaving(false);
}
return(
<div>
<div className="aurora-wh-header">
<h3>المبيعات</h3>
<button onClick={()=>setModal(true)} className="aurora-btn success small"><Plus size={12}/> تسجيل بيعة</button>
</div>
<div className="aurora-wh-period-chips">
{[['today','اليوم'],['week','الأسبوع'],['month','الشهر'],['year','السنة'],['all','الكل']].map(([v,l])=>(
<button key={v} onClick={()=>setPeriod(v)} className={`aurora-wh-period-chip ${period===v?'active':''}`}>{l}</button>
))}
</div>
<div className="aurora-wh-stats-grid small">
{[{l:'الإيرادات',v:whFmt(rev),c:'#10B981'},{l:'عدد الصفقات',v:filtered.length,c:'#06B6D4'},{l:'قطع مباعة',v:filtered.reduce((s,x)=>s+x.quantity,0),c:'#8B5CF6'}].map(s=>(
<div key={s.l} className="aurora-wh-stat small" style={{ '--accent': s.c }}>
<div className="aurora-wh-stat-value">{s.v}</div>
<div className="aurora-wh-stat-label">{s.l}</div>
</div>
))}
</div>
<div className="aurora-wh-list">
{filtered.length===0?<div className="aurora-empty-state small">لا توجد مبيعات</div>:
filtered.map((s,i)=>(
<div key={s.id} className="aurora-wh-sale-row">
<div>
<div className="aurora-wh-sale-name">{s.product_name}</div>
<div className="aurora-wh-sale-meta">{s.date} · {s.customer_name||'زبون'} · {s.quantity} قطعة</div>
</div>
<div className="aurora-wh-sale-total">{whFmt(s.total_iqd)}</div>
</div>
))}
</div>
{modal&&(
<WhModal title="تسجيل بيعة جديدة" onClose={()=>setModal(false)}>
<WhField label="المنتج" required>
<select value={form.product_id} onChange={e=>{const p=products.find(x=>x.id===e.target.value);setForm(f=>({...f,product_id:e.target.value,product_name:p?`${p.car_name} — ${WH_PRODUCT_TYPES.find(t=>t.id===p.type)?.label}`:'',price_iqd:p?.price_iqd||0}));}}>
<option value="">اختر منتج</option>
{products.map(p=><option key={p.id} value={p.id}>{p.car_name} — {WH_PRODUCT_TYPES.find(t=>t.id===p.type)?.label} ({p.quantity} قطعة)</option>)}
</select>
</WhField>
<div className="aurora-grid-2">
<WhField label="الكمية" required><input type="number" min="1" value={form.quantity} onChange={e=>setForm(f=>({...f,quantity:Number(e.target.value)}))} /></WhField>
<WhField label="السعر (د.ع)" required><input type="number" value={form.price_iqd} onChange={e=>setForm(f=>({...f,price_iqd:Number(e.target.value)}))} /></WhField>
</div>
<div className="aurora-wh-total-preview">{whFmt(form.price_iqd*form.quantity)}</div>
<WhField label="اسم الزبون"><input value={form.customer_name} onChange={e=>setForm(f=>({...f,customer_name:e.target.value}))} placeholder="اختياري" /></WhField>
<WhField label="التاريخ"><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} /></WhField>
<div className="aurora-modal-footer">
<button onClick={()=>setModal(false)} className="aurora-btn ghost">إلغاء</button>
<button onClick={save} disabled={saving} className="aurora-btn success">{saving?'جارٍ الحفظ...':'حفظ البيعة'}</button>
</div>
</WhModal>
)}
</div>
);
}

function WhSuppliers({ suppliers, setSuppliers, sbI, sbU, sbD }) {
const [modal,setModal]=useState(false);
const [editing,setEditing]=useState(null);
const [form,setForm]=useState({name:'',phone:'',address:'',available_products:'',notes:''});
const [saving,setSaving]=useState(false);
function openNew(){setEditing(null);setForm({name:'',phone:'',address:'',available_products:'',notes:''});setModal(true);}
function openEdit(s){setEditing(s);setForm({...s});setModal(true);}
async function save(){
if(!form.name.trim()){alert('أدخل اسم الموزع');return;}
setSaving(true);
try{
if(editing){await sbU('wh_suppliers',editing.id,form);setSuppliers(prev=>prev.map(s=>s.id===editing.id?{...s,...form}:s));}
else{const r=await sbI('wh_suppliers',{...form,created_at:new Date().toISOString()});if(r?.[0])setSuppliers(prev=>[r[0],...prev]);}
setModal(false);
}catch(e){alert('فشل: '+e.message);}
setSaving(false);
}
async function del(id){if(!confirm('حذف هذا الموزع؟'))return;await sbD('wh_suppliers',id);setSuppliers(prev=>prev.filter(s=>s.id!==id));}
return(
<div>
<div className="aurora-wh-header">
<h3>موزعو الجملة</h3>
<button onClick={openNew} className="aurora-btn primary small"><Plus size={12}/> موزع جديد</button>
</div>
<div className="aurora-wh-suppliers-grid">
{suppliers.map(s=>(
<div key={s.id} className="aurora-wh-supplier-card">
<div className="aurora-wh-supplier-top" />
<div className="aurora-wh-supplier-head">
<div>
<div className="aurora-wh-supplier-name">{s.name}</div>
{s.phone&&<div className="aurora-wh-supplier-phone">📞 {s.phone}</div>}
{s.address&&<div className="aurora-wh-supplier-addr">📍 {s.address}</div>}
</div>
<div className="aurora-wh-supplier-actions">
<button onClick={()=>openEdit(s)} className="aurora-icon-btn"><Edit3 size={11}/></button>
<button onClick={()=>del(s.id)} className="aurora-icon-btn danger"><Trash2 size={11}/></button>
</div>
</div>
{s.available_products&&(
<div className="aurora-wh-supplier-products">
<div className="aurora-wh-supplier-products-title">المتوفر عنده:</div>
<div>{s.available_products}</div>
</div>
)}
{s.notes&&<div className="aurora-wh-supplier-notes">📝 {s.notes}</div>}
</div>
))}
{!suppliers.length&&<div className="aurora-empty-state small">لا يوجد موزعون بعد</div>}
</div>
{modal&&(
<WhModal title={editing?'تعديل موزع':'إضافة موزع جديد'} onClose={()=>setModal(false)}>
<WhField label="اسم الموزع" required><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></WhField>
<WhField label="رقم الهاتف"><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="07XXXXXXXXX" /></WhField>
<WhField label="العنوان"><input value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))} /></WhField>
<WhField label="المنتجات المتوفرة عنده"><textarea value={form.available_products} onChange={e=>setForm(f=>({...f,available_products:e.target.value}))} placeholder="كامري 2020 جلد، لاندكروزر ربل..." /></WhField>
<WhField label="ملاحظات"><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></WhField>
<div className="aurora-modal-footer">
<button onClick={()=>setModal(false)} className="aurora-btn ghost">إلغاء</button>
<button onClick={save} disabled={saving} className="aurora-btn primary">{saving?'جارٍ الحفظ...':'حفظ'}</button>
</div>
</WhModal>
)}
</div>
);
}

function WhDebts({ debts, setDebts, sbI, sbU, sbD }) {
const [modal,setModal]=useState(false);
const [filter,setFilter]=useState('unpaid');
const [editing,setEditing]=useState(null);
const [form,setForm]=useState({name:'',type:'supplier',amount_iqd:0,due_date:'',status:'unpaid',notes:''});
const [saving,setSaving]=useState(false);
const filtered=filter==='all'?debts:debts.filter(d=>d.status===filter);
const totalUnpaid=debts.filter(d=>d.status==='unpaid').reduce((s,d)=>s+(d.amount_iqd||0),0);
function openNew(){setEditing(null);setForm({name:'',type:'supplier',amount_iqd:0,due_date:'',status:'unpaid',notes:''});setModal(true);}
function openEdit(d){setEditing(d);setForm({...d});setModal(true);}
async function save(){
if(!form.name.trim()||!form.amount_iqd){alert('أدخل الاسم والمبلغ');return;}
setSaving(true);
try{
if(editing){await sbU('wh_debts',editing.id,form);setDebts(prev=>prev.map(d=>d.id===editing.id?{...d,...form}:d));}
else{const r=await sbI('wh_debts',{...form,created_at:new Date().toISOString()});if(r?.[0])setDebts(prev=>[r[0],...prev]);}
setModal(false);
}catch(e){alert('فشل: '+e.message);}
setSaving(false);
}
async function markPaid(id){await sbU('wh_debts',id,{status:'paid',paid_at:new Date().toISOString()});setDebts(prev=>prev.map(d=>d.id===id?{...d,status:'paid'}:d));}
async function del(id){if(!confirm('حذف هذا الدين؟'))return;await sbD('wh_debts',id);setDebts(prev=>prev.filter(d=>d.id!==id));}
return(
<div>
<div className="aurora-wh-header">
<h3>الديون والمصاريف</h3>
<button onClick={openNew} className="aurora-btn danger small"><Plus size={12}/> إضافة دين</button>
</div>
<div className="aurora-wh-stats-grid small">
<div className="aurora-wh-stat small danger">
<div className="aurora-wh-stat-value">{whFmt(totalUnpaid)}</div>
<div className="aurora-wh-stat-label">إجمالي الديون غير المسددة</div>
</div>
<div className="aurora-wh-stat small warn">
<div className="aurora-wh-stat-value">{debts.filter(d=>d.status==='unpaid'&&whDaysUntil(d.due_date)!==null&&whDaysUntil(d.due_date)<=7).length}</div>
<div className="aurora-wh-stat-label">ديون تستحق خلال 7 أيام</div>
</div>
</div>
<div className="aurora-wh-period-chips">
{[['all','الكل'],['unpaid','غير مسددة'],['paid','مسددة']].map(([v,l])=>(
<button key={v} onClick={()=>setFilter(v)} className={`aurora-wh-period-chip ${filter===v?'active':''}`}>{l}</button>
))}
</div>
<div className="aurora-wh-list">
{filtered.length===0?<div className="aurora-empty-state small">لا توجد ديون</div>:
filtered.map((d,i)=>{
const type=WH_DEBT_TYPES.find(t=>t.id===d.type);
const days=whDaysUntil(d.due_date);
const urgent=d.status==='unpaid'&&days!==null&&days<=7;
return(
<div key={d.id} className={`aurora-wh-debt-row ${urgent?'urgent':''}`}>
<div className="aurora-wh-debt-dot" style={{ background: d.status==='paid'?'#10B981':type?.color||'#EF4444' }} />
<div className="aurora-wh-debt-info">
<div className="aurora-wh-debt-name">{d.name}</div>
<div className="aurora-wh-debt-tags">
<span className="aurora-wh-debt-tag" style={{ color: type?.color, background: `${type?.color||'#EF4444'}15` }}>{type?.label}</span>
{d.due_date&&<span className={`aurora-wh-debt-date ${urgent?'urgent':''}`}>📅 {d.due_date}{days!==null?` (${days>0?`${days} يوم`:'اليوم'})`:''}</span>}
{d.status==='paid'&&<span className="aurora-wh-debt-paid">✓ مسدد</span>}
</div>
</div>
<div className={`aurora-wh-debt-amount ${d.status==='paid'?'paid':''}`}>{whFmt(d.amount_iqd)}</div>
<div className="aurora-wh-debt-actions">
{d.status==='unpaid'&&<button onClick={()=>markPaid(d.id)} title="تسديد" className="aurora-icon-btn success"><CheckCircle2 size={11}/></button>}
<button onClick={()=>openEdit(d)} className="aurora-icon-btn"><Edit3 size={11}/></button>
<button onClick={()=>del(d.id)} className="aurora-icon-btn danger"><Trash2 size={11}/></button>
</div>
</div>
);
})}
</div>
{modal&&(
<WhModal title={editing?'تعديل دين':'إضافة دين/مصروف'} onClose={()=>setModal(false)}>
<WhField label="الاسم / الوصف" required><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="مثال: دين موزع أبو علي" /></WhField>
<WhField label="النوع" required>
<select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
{WH_DEBT_TYPES.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
</select>
</WhField>
<div className="aurora-grid-2">
<WhField label="المبلغ (د.ع)" required><input type="number" value={form.amount_iqd} onChange={e=>setForm(f=>({...f,amount_iqd:Number(e.target.value)}))} /></WhField>
<WhField label="تاريخ الاستحقاق"><input type="date" value={form.due_date} onChange={e=>setForm(f=>({...f,due_date:e.target.value}))} /></WhField>
</div>
<WhField label="الحالة">
<select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
<option value="unpaid">غير مسدد</option>
<option value="paid">مسدد</option>
</select>
</WhField>
<WhField label="ملاحظات"><textarea value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} /></WhField>
<div className="aurora-modal-footer">
<button onClick={()=>setModal(false)} className="aurora-btn ghost">إلغاء</button>
<button onClick={save} disabled={saving} className="aurora-btn danger">{saving?'جارٍ الحفظ...':'حفظ'}</button>
</div>
</WhModal>
)}
</div>
);
}

function WhEmployees({ employees, setEmployees, sbI, sbU, sbD }) {
const [modal,setModal]=useState(false);
const [payModal,setPayModal]=useState(null);
const [editing,setEditing]=useState(null);
const [form,setForm]=useState({name:'',role:'',salary:0,phone:'',start_date:whToday(),notes:''});
const [payForm,setPayForm]=useState({amount:0,date:whToday(),notes:''});
const [saving,setSaving]=useState(false);
function openNew(){setEditing(null);setForm({name:'',role:'',salary:0,phone:'',start_date:whToday(),notes:''});setModal(true);}
function openEdit(e){setEditing(e);setForm({...e});setModal(true);}
async function save(){
if(!form.name.trim()){alert('أدخل اسم الموظف');return;}
setSaving(true);
try{
if(editing){await sbU('wh_employees',editing.id,form);setEmployees(prev=>prev.map(e=>e.id===editing.id?{...e,...form}:e));}
else{const r=await sbI('wh_employees',{...form,created_at:new Date().toISOString()});if(r?.[0])setEmployees(prev=>[...prev,r[0]]);}
setModal(false);
}catch(e){alert('فشل: '+e.message);}
setSaving(false);
}
async function payEmployee(){
if(!payForm.amount){alert('أدخل المبلغ');return;}
setSaving(true);
try{
await sbI('wh_salary_payments',{employee_id:payModal.id,employee_name:payModal.name,...payForm,created_at:new Date().toISOString()});
setPayModal(null);
alert(`✅ تم تسجيل صرف ${whFmt(payForm.amount)} لـ ${payModal.name}`);
}catch(e){alert('فشل: '+e.message);}
setSaving(false);
}
async function del(id){if(!confirm('حذف هذا الموظف؟'))return;await sbD('wh_employees',id);setEmployees(prev=>prev.filter(e=>e.id!==id));}
return(
<div>
<div className="aurora-wh-header">
<h3>الموظفون والرواتب</h3>
<button onClick={openNew} className="aurora-btn primary small"><Plus size={12}/> موظف جديد</button>
</div>
<div className="aurora-wh-employees-grid">
{employees.map(e=>(
<div key={e.id} className="aurora-wh-employee-card">
<div className="aurora-wh-employee-head">
<div className="aurora-wh-employee-avatar">{e.name?.[0]}</div>
<div className="aurora-wh-employee-info">
<div className="aurora-wh-employee-name">{e.name}</div>
<div className="aurora-wh-employee-role">{e.role||'موظف'}</div>
</div>
<div className="aurora-wh-employee-actions">
<button onClick={()=>openEdit(e)} className="aurora-icon-btn"><Edit3 size={11}/></button>
<button onClick={()=>del(e.id)} className="aurora-icon-btn danger"><Trash2 size={11}/></button>
</div>
</div>
<div className="aurora-wh-employee-salary">
<div className="aurora-wh-employee-salary-label">الراتب الشهري</div>
<div className="aurora-wh-employee-salary-value">{whFmt(e.salary)}</div>
</div>
{e.phone&&<div className="aurora-wh-employee-phone">📞 {e.phone}</div>}
<button onClick={()=>{setPayModal(e);setPayForm({amount:e.salary,date:whToday(),notes:''}); }}
className="aurora-wh-employee-pay-btn">
<DollarSign size={12}/> صرف راتب
</button>
</div>
))}
{!employees.length&&<div className="aurora-empty-state small">لا يوجد موظفون</div>}
</div>
{modal&&(
<WhModal title={editing?'تعديل موظف':'إضافة موظف'} onClose={()=>setModal(false)}>
<div className="aurora-grid-2">
<WhField label="الاسم" required><input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} /></WhField>
<WhField label="المسمى الوظيفي"><input value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))} placeholder="موظف، محاسب..." /></WhField>
<WhField label="الراتب (د.ع)" required><input type="number" value={form.salary} onChange={e=>setForm(f=>({...f,salary:Number(e.target.value)}))} /></WhField>
<WhField label="رقم الهاتف"><input value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} /></WhField>
</div>
<div className="aurora-modal-footer">
<button onClick={()=>setModal(false)} className="aurora-btn ghost">إلغاء</button>
<button onClick={save} disabled={saving} className="aurora-btn primary">{saving?'جارٍ الحفظ...':'حفظ'}</button>
</div>
</WhModal>
)}
{payModal&&(
<WhModal title={`صرف راتب — ${payModal.name}`} onClose={()=>setPayModal(null)}>
<WhField label="المبلغ (د.ع)" required><input type="number" value={payForm.amount} onChange={e=>setPayForm(f=>({...f,amount:Number(e.target.value)}))} /></WhField>
<WhField label="التاريخ"><input type="date" value={payForm.date} onChange={e=>setPayForm(f=>({...f,date:e.target.value}))} /></WhField>
<WhField label="ملاحظات"><input value={payForm.notes} onChange={e=>setPayForm(f=>({...f,notes:e.target.value}))} placeholder="راتب شهر..." /></WhField>
<div className="aurora-modal-footer">
<button onClick={()=>setPayModal(null)} className="aurora-btn ghost">إلغاء</button>
<button onClick={payEmployee} disabled={saving} className="aurora-btn success">{saving?'جارٍ الحفظ...':'صرف الراتب'}</button>
</div>
</WhModal>
)}
</div>
);
}

function WhReports({ sales, products, debts }) {
const [period,setPeriod]=useState('month');
const now=new Date();
const filtered=useMemo(()=>sales.filter(s=>{
const d=new Date(s.date);
if(period==='today')return s.date===whToday();
if(period==='week')return(now-d)/86400000<=7;
if(period==='month')return s.date?.slice(0,7)===whToday().slice(0,7);
if(period==='year')return s.date?.slice(0,4)===whToday().slice(0,4);
return true;
}),[sales,period]);
const rev=filtered.reduce((s,x)=>s+x.total_iqd,0);
const totalDebt=debts.filter(d=>d.status==='unpaid').reduce((s,d)=>s+(d.amount_iqd||0),0);
const stockCost=products.reduce((s,p)=>s+(p.quantity*(p.cost_iqd||0)),0);
const stockSale=products.reduce((s,p)=>s+(p.quantity*(p.price_iqd||0)),0);
const byType=WH_PRODUCT_TYPES.map(t=>({
...t,
total:filtered.filter(s=>products.find(p=>p.id===s.product_id)?.type===t.id).reduce((sum,s)=>sum+s.total_iqd,0),
count:filtered.filter(s=>products.find(p=>p.id===s.product_id)?.type===t.id).length,
}));
const counted={};
filtered.forEach(s=>{counted[s.product_name]=(counted[s.product_name]||0)+s.quantity;});
const top=Object.entries(counted).sort((a,b)=>b[1]-a[1]).slice(0,5);
return(
<div>
<h3 className="aurora-wh-section-title">التقارير المالية</h3>
<div className="aurora-wh-period-chips">
{[['today','اليوم'],['week','الأسبوع'],['month','الشهر'],['year','السنة'],['all','الكل']].map(([v,l])=>(
<button key={v} onClick={()=>setPeriod(v)} className={`aurora-wh-period-chip ${period===v?'active':''}`}>{l}</button>
))}
</div>
<div className="aurora-wh-stats-grid">
{[
{l:'الإيرادات',v:whFmt(rev),c:'#10B981',I:TrendingUp},
{l:'إجمالي الديون',v:whFmt(totalDebt),c:'#EF4444',I:CreditCard},
{l:'تكلفة المخزن',v:whFmt(stockCost),c:'#F59E0B',I:Package},
{l:'قيمة البيع المتوقعة',v:whFmt(stockSale),c:'#8B5CF6',I:BarChart3},
{l:'الربح المتوقع',v:whFmt(stockSale-stockCost),c:stockSale>stockCost?'#10B981':'#EF4444',I:Percent},
].map(s=>(
<div key={s.l} className="aurora-wh-stat" style={{ '--accent': s.c }}>
<s.I size={15} />
<div className="aurora-wh-stat-value">{s.v}</div>
<div className="aurora-wh-stat-label">{s.l}</div>
</div>
))}
</div>
<div className="aurora-wh-reports-grid">
<div className="aurora-wh-section">
<div className="aurora-wh-section-title">مبيعات حسب النوع</div>
{byType.map(t=>(
<div key={t.id} className="aurora-wh-report-row">
<div className="aurora-wh-report-info">
<span className="aurora-wh-report-icon">{t.icon}</span>
<div>
<div className="aurora-wh-report-name">{t.label}</div>
<div className="aurora-wh-report-count">{t.count} صفقة</div>
</div>
</div>
<div className="aurora-wh-report-total" style={{ color: t.color }}>{whFmt(t.total)}</div>
</div>
))}
</div>
<div className="aurora-wh-section">
<div className="aurora-wh-section-title">الأكثر مبيعاً</div>
{top.map(([name,qty])=>(
<div key={name} className="aurora-wh-report-row">
<span className="aurora-wh-report-name">{name}</span>
<span className="aurora-wh-report-qty">{qty} قطعة</span>
</div>
))}
{!top.length&&<div className="aurora-empty-state small">لا توجد بيانات</div>}
</div>
</div>
</div>
);
}

const WH_NAV = [
{id:'dashboard', label:'لوحة التحكم', icon:Home},
{id:'products', label:'المنتجات', icon:Package},
{id:'sales', label:'المبيعات', icon:ShoppingCart},
{id:'suppliers', label:'الموزعون', icon:Truck},
{id:'debts', label:'الديون', icon:CreditCard},
{id:'employees', label:'الموظفون', icon:Users},
{id:'reports', label:'التقارير', icon:BarChart3},
];

function WarehouseView() {
const [whView, setWhView] = useState('dashboard');
const [loading, setLoading] = useState(true);
const [whProducts, setWhProducts] = useState([]);
const [whSales, setWhSales] = useState([]);
const [whSuppliers, setWhSuppliers] = useState([]);
const [whDebts, setWhDebts] = useState([]);
const [whEmployees, setWhEmployees] = useState([]);
const [whCars, setWhCars] = useState([]);

const sbI = (t,d) => sbInsert(t,d);
const sbU = (t,id,d) => sbUpdate(t,id,d);
const sbD = async (t,id) => { const url=`${SUPABASE_URL}/rest/v1/${t}?id=eq.${id}`; await fetch(url,{method:'DELETE',headers:{'apikey':SUPABASE_KEY,'Authorization':`Bearer ${SUPABASE_KEY}`}}); };

useEffect(()=>{
async function load(){
setLoading(true);
try{
const [p,s,sup,d,e]=await Promise.all([
sbSelect('wh_products','&order=car_name.asc'),
sbSelect('wh_sales','&order=date.desc&limit=300'),
sbSelect('wh_suppliers','&order=name.asc'),
sbSelect('wh_debts','&order=due_date.asc'),
sbSelect('wh_employees','&order=name.asc'),
]);
setWhProducts(p||[]);
setWhSales(s||[]);
setWhSuppliers(sup||[]);
setWhDebts(d||[]);
setWhEmployees(e||[]);
setWhCars([...new Set((p||[]).map(x=>x.car_name).filter(Boolean))]);
}catch(err){console.error('WH load error:',err);}
setLoading(false);
}
load();
},[]);

const lowCount = whProducts.filter(p=>p.quantity<=LOW_STOCK).length;
const urgentDbt = whDebts.filter(d=>d.status==='unpaid'&&whDaysUntil(d.due_date)!==null&&whDaysUntil(d.due_date)<=7).length;

function renderWhView(){
if(loading) return <div className="aurora-loading"><RefreshCw size={22} className="aurora-spin" /><span>جارٍ تحميل المخزن...</span></div>;
switch(whView){
case 'dashboard': return <WhDashboard products={whProducts} sales={whSales} debts={whDebts} suppliers={whSuppliers}/>;
case 'products': return <WhProducts products={whProducts} setProducts={setWhProducts} cars={whCars} setCars={setWhCars} sbI={sbI} sbU={sbU} sbD={sbD}/>;
case 'sales': return <WhSales sales={whSales} setSales={setWhSales} products={whProducts} sbI={sbI}/>;
case 'suppliers': return <WhSuppliers suppliers={whSuppliers} setSuppliers={setWhSuppliers} sbI={sbI} sbU={sbU} sbD={sbD}/>;
case 'debts': return <WhDebts debts={whDebts} setDebts={setWhDebts} sbI={sbI} sbU={sbU} sbD={sbD}/>;
case 'employees': return <WhEmployees employees={whEmployees} setEmployees={setWhEmployees} sbI={sbI} sbU={sbU} sbD={sbD}/>;
case 'reports': return <WhReports sales={whSales} products={whProducts} debts={whDebts}/>;
default: return null;
}
}

const isMobile = useIsMobile();

return (
<div className={`aurora-wh-layout ${isMobile?'mobile':''}`}>
{isMobile ? (
<div className="aurora-wh-mobile-tabs">
{WH_NAV.map(item=>{
const Icon=item.icon;
const active=whView===item.id;
return(
<button key={item.id} onClick={()=>setWhView(item.id)} className={`aurora-wh-mobile-tab ${active?'active':''}`}>
<Icon size={17} strokeWidth={active?2.5:1.8}/>
{item.label}
</button>
);
})}
</div>
) : (
<div className="aurora-wh-sidebar">
<div className="aurora-wh-sidebar-title">🏪 إدارة المخزن</div>
{(lowCount>0||urgentDbt>0)&&(
<div className="aurora-wh-sidebar-alerts">
{lowCount>0&&<div>⚠️ {lowCount} منتج منخفض</div>}
{urgentDbt>0&&<div>🔴 {urgentDbt} دين عاجل</div>}
</div>
)}
{WH_NAV.map(item=>{
const Icon=item.icon;
const active=whView===item.id;
return(
<button key={item.id} onClick={()=>setWhView(item.id)} className={`aurora-wh-nav-item ${active?'active':''}`}>
<Icon size={15} strokeWidth={active?2.5:1.8}/>
{item.label}
</button>
);
})}
</div>
)}
<div className="aurora-wh-content">{renderWhView()}</div>
</div>
);
}

// ══════════════════════════════════════════════════════════════
// التطبيق الرئيسي
// ══════════════════════════════════════════════════════════════
export default function AlFhdApp() {
const [activeView, setActiveView] = useState('conversations');
const [pendingOpenConvId, setPendingOpenConvId] = useState(null);
const [pendingNewOrderFromConv, setPendingNewOrderFromConv] = useState(null);
const [pendingOpenOrderId, setPendingOpenOrderId] = useState(null);
const goToConversation = useCallback((convId) => { setPendingOpenConvId(convId); setActiveView('conversations'); }, []);
const goToNewOrderFromConversation = useCallback((conv) => { setPendingNewOrderFromConv(conv); setActiveView('orders'); }, []);
const goToOrderDetails = useCallback((order) => { setPendingOpenOrderId(order.id); setActiveView('orders'); }, []);

const [pages, setPages] = useState([]);
const [conversations, setConversations] = useState([]);
const [orders, setOrders] = useState([]);
const [notifications, setNotifications] = useState([]);
const [showNotifications, setShowNotifications] = useState(false);
const ordersRef = React.useRef([]);
useEffect(() => { ordersRef.current = orders; }, [orders]);

const [warehouseProducts, setWarehouseProducts] = useState([]);
const warehouseProductsRef = React.useRef([]);
useEffect(() => { warehouseProductsRef.current = warehouseProducts; }, [warehouseProducts]);

async function recordWarehouseSale(order) {
try {
const match = matchOrderToWarehouseProduct(order, warehouseProductsRef.current);
if (!match) { console.warn('⚠️ لم يُعثر على منتج مطابق'); return; }
const { product, confidence } = match;
await sbInsert('wh_sales', {
product_id: product.id,
product_name: `${product.car_name} — ${PRODUCT_TYPE_LABELS[product.type]}`,
quantity: 1, price_iqd: Number(order.total) || 0, total_iqd: Number(order.total) || 0,
customer_name: order.customer || '', date: new Date().toISOString().slice(0, 10),
notes: `طلب #${order.orderNo} — مطابقة ${confidence === 'high' ? 'عالية' : confidence === 'medium' ? 'متوسطة' : 'منخفضة'}`,
created_at: new Date().toISOString(),
});
const newQty = Math.max(0, (product.quantity || 0) - 1);
await sbUpdate('wh_products', product.id, { quantity: newQty });
setWarehouseProducts(prev => prev.map(p => p.id === product.id ? { ...p, quantity: newQty } : p));
} catch (e) { console.error('warehouse sale error:', e); }
}

async function returnToWarehouse(order) {
try {
const match = matchOrderToWarehouseProduct(order, warehouseProductsRef.current);
if (!match) return;
const { product } = match;
const newQty = (product.quantity || 0) + 1;
await sbUpdate('wh_products', product.id, { quantity: newQty });
setWarehouseProducts(prev => prev.map(p => p.id === product.id ? { ...p, quantity: newQty } : p));
} catch (e) { console.error('warehouse return error:', e); }
}

const [users, setUsers] = useState([]);
const [storageReady, setStorageReady] = useState(false);

useEffect(() => {
async function loadWarehouseProducts() {
try {
const res = await sbSelect('wh_products', '&order=car_name.asc');
if (res) setWarehouseProducts(res);
} catch (e) { console.warn('warehouse load error:', e); }
}
if (storageReady) loadWarehouseProducts();
}, [storageReady]);

const [authedUser, setAuthedUser] = useState(() => {
try {
const saved = JSON.parse(localStorage.getItem('alfhd_session') || sessionStorage.getItem('alfhd_session') || 'null');
if (saved?.userId && saved?.userData) return saved.userData;
} catch (_) {}
return null;
});
const [appLoading, setAppLoading] = useState(!(localStorage.getItem('alfhd_session') || sessionStorage.getItem('alfhd_session')));

const convSignatureRef = React.useRef('');
const HANDOFF_TRIGGERS_GLOBAL = [
'رح نحولك', 'سنحولك', 'سأحولك', 'سأقوم بتحويلك',
'transferred this chat', 'transfer this chat', 'Your AI agent transferred',
'تحويل للموظف', 'تحويل إلى موظف', 'تحويل لأحد موظفينا',
'نحولك للموظف', 'تحويل المحادثة', 'handoff', 'hand off',
];

const refreshConversations = useCallback(async () => {
try {
const dbConversations = await sbSelect('alfhd_conversations', '&order=last_message_time.desc');
if (dbConversations) {
const sig = dbConversations.map((c) => `${c.id}:${c.last_message_time}:${c.last_message}:${c.unread_count}:${c.tab}:${c.order_id}:${c.avatar_url || ''}`).join('|');
if (sig !== convSignatureRef.current) {
convSignatureRef.current = sig;
const mapped = dbConversations.map(mapConversationFromDb);
setConversations(mapped);
const toHandoff = mapped.filter((c) => {
if (c.tab === 'handoff') return false;
const msg = (c.lastMsg || '').toLowerCase();
return HANDOFF_TRIGGERS_GLOBAL.some((t) => msg.includes(t.toLowerCase()));
});
if (toHandoff.length > 0) {
setConversations((prev) => prev.map((c) => (toHandoff.find((h) => h.id === c.id) ? { ...c, tab: 'handoff' } : c)));
toHandoff.forEach(async (c) => {
try { await sbUpdate('alfhd_conversations', c.id, { tab: 'handoff' }); } catch (_e) {}
});
}
}
}
} catch (e) { console.error('Supabase conversations load error:', e); }
}, []);

const knownOrderIdsRef = React.useRef(null);
const orderSignatureRef = React.useRef('');
const rejectedIdsRef = React.useRef(null);

const pushNotif = useCallback((notif) => {
const entry = {
id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
time: new Date().toISOString(), read: false, ...notif,
};
setNotifications((prev) => [entry, ...prev].slice(0, 50));
try { notif.type === 'returned' ? playAlarmSound() : playNotificationSound(); } catch (_e) {}
try {
if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
new Notification(notif.title, { body: notif.body });
}
} catch (_e) {}
}, []);

const refreshOrders = useCallback(async () => {
try {
const dbOrders = await sbSelect('alfhd_orders', '&order=created_at.desc');
if (!dbOrders) return;
const mapped = dbOrders.map(mapOrderFromDb);
if (knownOrderIdsRef.current) {
const newChatOrder = mapped.find((o) => o.source === 'chat' && !knownOrderIdsRef.current.has(o.id));
if (newChatOrder) playNotificationSound();
}
knownOrderIdsRef.current = new Set(mapped.map((o) => o.id));
const rejectedNow = new Set(mapped.filter((o) => o.prepStatus === 'rejected').map((o) => o.id));
if (rejectedIdsRef.current) {
const newlyRejectedOrders = mapped.filter((o) => o.prepStatus === 'rejected' && !rejectedIdsRef.current.has(o.id));
if (newlyRejectedOrders.length > 0) {
playAlarmSound();
for (const ro of newlyRejectedOrders) {
pushNotif({
type: 'returned', title: '⚠️ طلب لم يُجهَّز',
body: `طلب #${ro.orderNo} — ${ro.customer || ''} — المجهّز: ${ro.prepByName || 'غير معروف'}${ro.prepReason ? ' — السبب: ' + ro.prepReason : ''}`,
orderNo: ro.orderNo,
});
}
}
}
rejectedIdsRef.current = rejectedNow;
const sig = dbOrders.map((o) => `${o.id}:${o.status}:${o.stage}:${o.prep_status}:${o.converted}:${o.printed}:${o.jenni_sent}:${o.jenni_shipment_id}:${o.jenni_tracking}:${o.delivery_status}:${o.delivery_step}:${o.delivery_step_ar}:${o.delivery_note}:${o.delivery_updated_at}`).join('|');
if (sig !== orderSignatureRef.current) {
orderSignatureRef.current = sig;
const prevOrders = ordersRef.current;
for (const newOrder of mapped) {
const prev = prevOrders.find(o => o.id === newOrder.id);
if (!prev) continue;
const prevStatus = prev.deliveryStatus;
const newStatus = newOrder.deliveryStatus;
if (newStatus === 'DELIVERED' && prevStatus !== 'DELIVERED') {
recordWarehouseSale(newOrder);
pushNotif({
type: 'delivered', title: 'تم تسليم طلب 🎉',
body: `طلب #${newOrder.orderNo} — ${newOrder.customer || ''} (${Number(newOrder.total).toLocaleString()} د.ع)`,
orderNo: newOrder.orderNo,
});
}
if ((newStatus === 'RETURNED_TO_MERCHANT' || newStatus === 'returned') &&
prevStatus !== 'RETURNED_TO_MERCHANT' && prevStatus !== 'returned') {
returnToWarehouse(newOrder);
pushNotif({
type: 'returned', title: '⚠️ طلب راجع — انتبه',
body: `طلب #${newOrder.orderNo} — ${newOrder.customer || ''}${newOrder.deliveryNote ? ' — ' + newOrder.deliveryNote : ''}`,
orderNo: newOrder.orderNo,
});
}
}
setOrders(mapped);
}
} catch (e) { console.error('orders refresh error:', e); }
}, [pushNotif]);

useEffect(() => {
try {
if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
Notification.requestPermission().catch(() => {});
}
} catch (_e) {}
}, []);

useEffect(() => {
if (!storageReady) return undefined;
let interval = null;
const start = () => {
if (interval) return;
interval = setInterval(() => { if (!document.hidden) refreshOrders(); }, 12000);
};
const stop = () => { if (interval) { clearInterval(interval); interval = null; } };
start();
const onVis = () => { if (document.hidden) stop(); else { refreshOrders(); start(); } };
document.addEventListener('visibilitychange', onVis);
return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
}, [storageReady, refreshOrders]);

useEffect(() => {
if (!storageReady) return undefined;
const syncJenni = async () => {
if (document.hidden) return;
try {
await fetch(JENNI_SYNC_FUNCTION_URL, {
method: 'POST',
headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
body: '{}',
});
await refreshOrders();
} catch (_e) {}
};
syncJenni();
let interval = setInterval(syncJenni, 60000);
const onVis = () => { if (!document.hidden) syncJenni(); };
document.addEventListener('visibilitychange', onVis);
return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVis); };
}, [storageReady, refreshOrders]);

useEffect(() => {
(async () => {
try {
const [dbPages, dbOrders, dbUsers] = await Promise.all([
sbSelectColumns('alfhd_pages', 'id,name,avatar,source,fb_page_id,connected,created_at', '&order=created_at.asc'),
sbSelect('alfhd_orders', '&order=created_at.desc'),
sbSelect('alfhd_users', '&order=created_at.asc'),
]);
if (dbPages?.length) setPages(dbPages.map(mapPageFromDb));
if (dbOrders?.length) setOrders(dbOrders.map(mapOrderFromDb));
if (dbUsers?.length) setUsers(dbUsers.map(mapUserFromDb));
await refreshConversations();
} catch (e) { console.error('Supabase init load error:', e); }
finally { setStorageReady(true); }
})();
}, [refreshConversations]);

const pollFacebookNow = useCallback(async () => {
try {
await fetch(FB_POLL_FUNCTION_URL, { method: 'GET', headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY } });
} catch (e) { console.error('active poll error:', e); }
finally { refreshConversations(); }
}, [refreshConversations]);

useEffect(() => {
if (!storageReady) return undefined;
pollFacebookNow();
let interval = null;
const start = () => {
if (interval) return;
interval = setInterval(() => { if (!document.hidden) pollFacebookNow(); }, 8000);
};
const stop = () => { if (interval) { clearInterval(interval); interval = null; } };
start();
const onVis = () => { if (document.hidden) stop(); else { pollFacebookNow(); start(); } };
document.addEventListener('visibilitychange', onVis);
return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
}, [storageReady, pollFacebookNow]);

useEffect(() => {
if (!storageReady) return;
setAppLoading(false);
try {
const saved = JSON.parse(localStorage.getItem('alfhd_session') || sessionStorage.getItem('alfhd_session') || 'null');
if (saved?.userId) {
const found = users.find((u) => u.id === saved.userId && u.active);
if (found) {
setAuthedUser(found);
const store = localStorage.getItem('alfhd_session') ? localStorage : sessionStorage;
store.setItem('alfhd_session', JSON.stringify({ userId: found.id, userData: found }));
} else if (authedUser) {
setAuthedUser(null);
localStorage.removeItem('alfhd_session');
sessionStorage.removeItem('alfhd_session');
}
}
} catch (e) {}
}, [storageReady]);

const handleLogin = (user, rememberMe = true) => {
ensureAudioReady();
setAuthedUser(user); setAppLoading(false);
try {
const payload = JSON.stringify({ userId: user.id, userData: user });
localStorage.removeItem('alfhd_session');
sessionStorage.removeItem('alfhd_session');
(rememberMe ? localStorage : sessionStorage).setItem('alfhd_session', payload);
} catch (e) {}
};
const handleLogout = () => {
setAuthedUser(null);
try {
localStorage.removeItem('alfhd_session');
sessionStorage.removeItem('alfhd_session');
} catch (e) {}
};
const hasPermission = (permId) => {
if (!authedUser) return false;
if (authedUser.role === 'admin') return true;
return authedUser.permissions?.includes(permId);
};
const contactWhatsApp = useCallback((rawPhone) => {
if (!rawPhone) { alert('لا يوجد رقم متاح'); return; }
let digits = String(rawPhone).replace(/[^0-9]/g, '');
if (digits.startsWith('00')) digits = digits.slice(2);
else if (digits.startsWith('0')) digits = '964' + digits.slice(1);
else if (!digits.startsWith('964')) digits = '964' + digits;
window.open(`https://wa.me/${digits}`, '_blank');
}, []);

if (appLoading && !authedUser) {
return (
<>
<GlobalStyles />
<div className="aurora-loading-screen">
<FahdLogo size={48} />
<RefreshCw size={19} className="aurora-spin" />
</div>
</>
);
}

if (!authedUser) {
return (
<>
<GlobalStyles />
<LoginScreen users={users} onLogin={handleLogin} />
</>
);
}

if (authedUser.role === 'warehouse') {
return <PrepWorkerView currentUser={authedUser} onLogout={handleLogout} />;
}

return (
<ErrorBoundary>
<>
<GlobalStyles />
<div className="aurora-notif-bell-wrap">
<button onClick={() => {
setShowNotifications((v) => !v);
if (!showNotifications) setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
}} className={`aurora-notif-bell ${notifications.some((n) => !n.read) ? 'active' : ''}`} title="الإشعارات">
<Bell size={18} />
{notifications.some((n) => !n.read) && (
<span className="aurora-notif-count">{notifications.filter((n) => !n.read).length}</span>
)}
</button>
{showNotifications && (
<div className="aurora-notif-panel">
<div className="aurora-notif-header">
<span>الإشعارات</span>
{notifications.length > 0 && (
<button onClick={() => setNotifications([])}>مسح الكل</button>
)}
</div>
{notifications.length === 0 && <div className="aurora-notif-empty">لا إشعارات</div>}
{notifications.map((n) => (
<div key={n.id} className={`aurora-notif-item ${n.type}`}>
<div className="aurora-notif-title">{n.title}</div>
<div className="aurora-notif-body">{n.body}</div>
<div className="aurora-notif-time">{new Date(n.time).toLocaleString('ar')}</div>
</div>
))}
</div>
)}
</div>

<div className="aurora-app">
<Sidebar activeView={activeView} setActiveView={setActiveView}
onLogout={handleLogout} currentUser={authedUser} pages={pages} />
<main className={`aurora-main ${activeView === 'conversations' ? 'conv' : ''}`}>
{activeView === 'conversations' && (
<ConversationsView conversations={conversations} pages={pages} orders={orders}
setConversations={setConversations} pendingOpenConvId={pendingOpenConvId}
clearPendingOpenConvId={() => setPendingOpenConvId(null)}
onCreateOrderFromConv={goToNewOrderFromConversation}
onOpenOrderDetails={goToOrderDetails} />
)}
{activeView === 'orders' && (
<OrdersView orders={orders} pages={pages} setOrders={setOrders}
conversations={conversations} setConversations={setConversations}
pendingOpenOrderId={pendingOpenOrderId}
clearPendingOpenOrderId={() => setPendingOpenOrderId(null)}
onViewConversation={goToConversation}
pendingNewOrderFromConv={pendingNewOrderFromConv}
clearPendingNewOrderFromConv={() => setPendingNewOrderFromConv(null)}
currentUser={authedUser} warehouseProducts={warehouseProducts} />
)}
{activeView === 'stats' && (
<StatsView orders={orders} pages={pages} conversations={conversations} setOrders={setOrders} />
)}
{activeView === 'users' && (authedUser.role === 'admin' || (authedUser.permissions || []).includes('users_manage')) && (
<AdminView users={users} setUsers={setUsers} orders={orders} conversations={conversations}
onViewConversation={goToConversation} onContactWhatsApp={contactWhatsApp} />
)}
{activeView === 'pages' && <PagesView pages={pages} setPages={setPages} />}
{activeView === 'warehouse' && (authedUser.role === 'admin' || authedUser.role === 'manager') && <WarehouseView />}
</main>
</div>
</>
</ErrorBoundary>
);
}

// ══════════════════════════════════════════════════════════════
// GlobalStyles - تصميم Aurora الكامل
// ══════════════════════════════════════════════════════════════
function GlobalStyles() {
return (
<style>{`
@import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&family=Inter:wght@400;500;600;700;800&display=swap');

*, *::before, *::after {
box-sizing: border-box;
font-family: 'Cairo', 'Inter', sans-serif;
-webkit-tap-highlight-color: transparent;
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
}

:root {
/* Aurora Color System */
--aurora-bg: #0A0E1A;
--aurora-bg-elev: #111626;
--aurora-surface: #161B2E;
--aurora-surface-2: #1C2238;
--aurora-border: rgba(255, 255, 255, 0.08);
--aurora-border-strong: rgba(255, 255, 255, 0.14);

/* Primary Gradient - Indigo to Violet */
--aurora-primary: #6366F1;
--aurora-primary-2: #8B5CF6;
--aurora-primary-grad: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);

/* Accent - Cyan */
--aurora-accent: #06B6D4;
--aurora-accent-grad: linear-gradient(135deg, #06B6D4 0%, #0891B2 100%);

/* Semantic */
--aurora-success: #10B981;
--aurora-success-grad: linear-gradient(135deg, #10B981 0%, #059669 100%);
--aurora-danger: #EF4444;
--aurora-danger-grad: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
--aurora-warn: #F59E0B;
--aurora-warn-grad: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
--aurora-pink: #EC4899;

/* Text */
--aurora-text: #F8FAFC;
--aurora-text-2: #E2E8F0;
--aurora-text-muted: #94A3B8;
--aurora-text-dim: #64748B;

/* Effects */
--aurora-glow-primary: 0 0 40px rgba(99, 102, 241, 0.25);
--aurora-glow-accent: 0 0 40px rgba(6, 182, 212, 0.25);
--aurora-shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.3);
--aurora-shadow-md: 0 8px 24px rgba(0, 0, 0, 0.4);
--aurora-shadow-lg: 0 20px 60px rgba(0, 0, 0, 0.5);

/* Radius */
--aurora-r-sm: 8px;
--aurora-r-md: 12px;
--aurora-r-lg: 16px;
--aurora-r-xl: 20px;
--aurora-r-full: 999px;

/* Easing */
--aurora-ease: cubic-bezier(0.4, 0.0, 0.2, 1);
--aurora-ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
--aurora-ease-bounce: cubic-bezier(0.22, 1, 0.36, 1);
}

html { scroll-behavior: smooth; }
body {
margin: 0;
background: var(--aurora-bg);
color: var(--aurora-text);
overscroll-behavior: none;
-webkit-overflow-scrolling: touch;
}

input::placeholder, textarea::placeholder { color: var(--aurora-text-dim); }
input:focus, select:focus, textarea:focus { outline: none; }
input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible {
outline: 2px solid rgba(99, 102, 241, 0.5); outline-offset: 1px;
}

/* Scrollbar */
::-webkit-scrollbar { width: 6px; height: 6px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb {
background: rgba(99, 102, 241, 0.25);
border-radius: 10px;
transition: background 0.2s ease;
}
::-webkit-scrollbar-thumb:hover { background: rgba(99, 102, 241, 0.45); }
select, input, textarea { color-scheme: dark; }

/* ═══ Aurora Background ═══ */
.aurora-login-wrap {
min-height: 100vh;
display: flex;
flex-direction: column;
align-items: center;
justify-content: center;
background: var(--aurora-bg);
position: relative;
overflow: hidden;
direction: rtl;
padding: 20px;
}

.aurora-bg-orb {
position: absolute;
border-radius: 50%;
filter: blur(80px);
pointer-events: none;
opacity: 0.5;
}
.aurora-orb-1 {
width: 500px; height: 500px;
background: radial-gradient(circle, rgba(99, 102, 241, 0.35), transparent 70%);
top: -150px; right: -100px;
animation: auroraFloat 20s ease-in-out infinite;
}
.aurora-orb-2 {
width: 450px; height: 450px;
background: radial-gradient(circle, rgba(139, 92, 246, 0.3), transparent 70%);
bottom: -150px; left: -100px;
animation: auroraFloat 25s ease-in-out infinite reverse;
}
.aurora-orb-3 {
width: 350px; height: 350px;
background: radial-gradient(circle, rgba(6, 182, 212, 0.25), transparent 70%);
top: 40%; left: 50%;
transform: translateX(-50%);
animation: auroraFloat 30s ease-in-out infinite;
}

.aurora-grid-bg {
position: absolute;
inset: 0;
background-image:
linear-gradient(rgba(99, 102, 241, 0.04) 1px, transparent 1px),
linear-gradient(90deg, rgba(99, 102, 241, 0.04) 1px, transparent 1px);
background-size: 50px 50px;
mask-image: radial-gradient(ellipse at center, black 30%, transparent 70%);
pointer-events: none;
}

@keyframes auroraFloat {
0%, 100% { transform: translate(0, 0); }
33% { transform: translate(30px, -30px); }
66% { transform: translate(-20px, 20px); }
}

.aurora-login-top-badge {
position: absolute;
top: 20px;
z-index: 2;
display: flex;
align-items: center;
gap: 7px;
color: var(--aurora-text-muted);
font-size: 10px;
font-weight: 700;
letter-spacing: 0.18em;
background: rgba(22, 27, 46, 0.7);
backdrop-filter: blur(20px);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-full);
padding: 7px 14px;
}

.aurora-login-card {
position: relative;
z-index: 1;
background: rgba(22, 27, 46, 0.8);
backdrop-filter: blur(30px) saturate(1.4);
-webkit-backdrop-filter: blur(30px) saturate(1.4);
border: 1px solid var(--aurora-border-strong);
border-radius: var(--aurora-r-xl);
padding: 38px 32px 28px;
width: 100%;
max-width: 400px;
display: flex;
flex-direction: column;
align-items: center;
box-shadow: var(--aurora-shadow-lg), var(--aurora-glow-primary);
animation: auroraCardFloat 6s ease-in-out infinite;
}

.aurora-card-glow {
position: absolute;
inset: -1px;
border-radius: var(--aurora-r-xl);
background: linear-gradient(135deg, rgba(99, 102, 241, 0.3), rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.3));
filter: blur(20px);
opacity: 0.5;
z-index: -1;
}

.aurora-card-border {
position: absolute;
inset: 0;
border-radius: var(--aurora-r-xl);
padding: 1px;
background: linear-gradient(135deg, rgba(99, 102, 241, 0.5), rgba(139, 92, 246, 0.3), rgba(6, 182, 212, 0.5));
-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
-webkit-mask-composite: xor;
mask-composite: exclude;
pointer-events: none;
}

@keyframes auroraCardFloat {
0%, 100% { transform: translateY(0); }
50% { transform: translateY(-6px); }
}

.aurora-logo-wrap {
position: relative;
margin-bottom: 8px;
}
.aurora-logo-halo {
position: absolute;
inset: -25px;
border-radius: 50%;
background: radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%);
filter: blur(15px);
animation: auroraPulse 3s ease-in-out infinite;
}
@keyframes auroraPulse {
0%, 100% { opacity: 0.6; transform: scale(1); }
50% { opacity: 1; transform: scale(1.05); }
}

.aurora-login-title {
font-size: 32px;
font-weight: 900;
color: var(--aurora-text);
margin: 12px 0 2px;
letter-spacing: -0.02em;
background: linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%);
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
}

.aurora-login-subtitle {
font-size: 13px;
color: var(--aurora-text-muted);
margin: 0;
font-weight: 500;
}

.aurora-login-chip {
margin-top: 10px;
color: var(--aurora-primary);
font-size: 11px;
font-weight: 700;
background: rgba(99, 102, 241, 0.12);
border: 1px solid rgba(99, 102, 241, 0.25);
border-radius: var(--aurora-r-full);
padding: 5px 13px;
}

.aurora-form-section {
width: 100%;
margin-top: 28px;
}

.aurora-label {
display: block;
font-size: 11px;
color: var(--aurora-text-muted);
margin-bottom: 12px;
font-weight: 700;
text-align: center;
letter-spacing: 0.05em;
text-transform: uppercase;
}

.aurora-pin-row {
position: relative;
display: flex;
gap: 10px;
justify-content: center;
cursor: text;
}

.aurora-pin-box {
width: 54px;
height: 60px;
border-radius: var(--aurora-r-md);
background: var(--aurora-surface);
border: 1.5px solid var(--aurora-border);
display: flex;
align-items: center;
justify-content: center;
font-size: 22px;
color: var(--aurora-primary);
font-weight: 900;
transition: all 0.2s var(--aurora-ease);
}
.aurora-pin-box.active {
border-color: var(--aurora-primary);
transform: translateY(-2px);
box-shadow: 0 8px 20px rgba(99, 102, 241, 0.3);
}
.aurora-pin-box.filled {
border-color: rgba(99, 102, 241, 0.5);
background: rgba(99, 102, 241, 0.08);
}
.aurora-pin-box.err {
border-color: var(--aurora-danger);
animation: auroraShake 0.5s;
}
.aurora-pin-dot {
width: 10px;
height: 10px;
border-radius: 50%;
background: var(--aurora-primary-grad);
box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
}

.aurora-pin-hidden {
position: absolute;
inset: 0;
opacity: 0;
width: 100%;
height: 100%;
border: none;
padding: 0;
margin: 0;
cursor: text;
}

@keyframes auroraShake {
0%, 100% { transform: translateX(0); }
25% { transform: translateX(-6px); }
75% { transform: translateX(6px); }
}
.aurora-shake { animation: auroraShake 0.5s !important; }

.aurora-error {
color: var(--aurora-danger);
font-size: 12px;
margin-top: 10px;
text-align: center;
font-weight: 600;
}

.aurora-remember {
margin-top: 14px;
display: flex;
align-items: center;
justify-content: center;
gap: 7px;
color: var(--aurora-text-muted);
font-size: 12px;
font-weight: 600;
cursor: pointer;
}
.aurora-checkbox {
width: 15px;
height: 15px;
accent-color: var(--aurora-primary);
cursor: pointer;
}

.aurora-keypad {
margin-top: 20px;
display: grid;
grid-template-columns: repeat(3, 54px);
gap: 10px;
justify-content: center;
}
.aurora-key-btn {
width: 54px;
height: 54px;
border-radius: var(--aurora-r-md);
border: 1px solid var(--aurora-border);
background: var(--aurora-surface);
color: var(--aurora-text);
font-size: 17px;
font-weight: 700;
transition: all 0.15s var(--aurora-ease);
}
.aurora-key-btn:hover {
background: var(--aurora-surface-2);
border-color: rgba(99, 102, 241, 0.3);
}
.aurora-key-btn:active {
transform: scale(0.94);
}
.aurora-key-ghost {
width: 54px;
height: 54px;
border-radius: var(--aurora-r-md);
border: 1px solid var(--aurora-border);
background: transparent;
color: var(--aurora-text-muted);
font-size: 12px;
font-weight: 700;
}

.aurora-login-footer {
margin-top: 22px;
font-size: 10px;
color: var(--aurora-text-dim);
position: relative;
z-index: 1;
letter-spacing: 0.04em;
}

/* ═══ App Layout ═══ */
.aurora-app {
display: flex;
min-height: 100vh;
background: var(--aurora-bg);
direction: rtl;
color: var(--aurora-text);
position: relative;
}
.aurora-app::before {
content: '';
position: fixed;
inset: 0;
background:
radial-gradient(1200px 600px at 70% -10%, rgba(99, 102, 241, 0.08), transparent 60%),
radial-gradient(900px 500px at 10% 110%, rgba(6, 182, 212, 0.06), transparent 55%);
pointer-events: none;
z-index: 0;
}

.aurora-sidebar {
width: 260px;
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border-left: 1px solid var(--aurora-border);
display: flex;
flex-direction: column;
padding: 16px 12px;
flex-shrink: 0;
position: relative;
z-index: 1;
}

.aurora-sidebar-header {
display: flex;
align-items: center;
gap: 11px;
padding: 4px 8px 16px;
border-bottom: 1px solid var(--aurora-border);
margin-bottom: 12px;
}
.aurora-brand-name {
font-size: 17px;
font-weight: 900;
color: var(--aurora-text);
background: linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%);
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
letter-spacing: -0.02em;
}
.aurora-brand-sub {
font-size: 9px;
color: var(--aurora-text-dim);
letter-spacing: 0.1em;
text-transform: uppercase;
font-weight: 700;
}

.aurora-sidebar-nav {
display: flex;
flex-direction: column;
gap: 3px;
flex: 1;
}

.aurora-nav-item {
display: flex;
align-items: center;
gap: 11px;
padding: 10px 12px;
border-radius: var(--aurora-r-md);
border: 1px solid transparent;
background: transparent;
color: var(--aurora-text-muted);
font-size: 13.5px;
font-weight: 600;
text-align: right;
position: relative;
transition: all 0.2s var(--aurora-ease);
cursor: pointer;
}
.aurora-nav-item:hover {
background: rgba(255, 255, 255, 0.04);
color: var(--aurora-text-2);
}
.aurora-nav-item.active {
background: linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.1));
border-color: rgba(99, 102, 241, 0.25);
color: var(--aurora-text);
font-weight: 700;
box-shadow: 0 4px 12px rgba(99, 102, 241, 0.15);
}

.aurora-nav-icon-wrap {
width: 32px;
height: 32px;
border-radius: 10px;
background: rgba(255, 255, 255, 0.04);
display: flex;
align-items: center;
justify-content: center;
transition: all 0.2s var(--aurora-ease);
}
.aurora-nav-icon-wrap.active {
background: var(--aurora-primary-grad);
color: white;
box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
}

.aurora-nav-indicator {
position: absolute;
right: -12px;
top: 50%;
transform: translateY(-50%);
width: 3px;
height: 18px;
border-radius: 4px;
background: var(--aurora-primary-grad);
box-shadow: 0 0 10px rgba(99, 102, 241, 0.6);
}

.aurora-sidebar-footer {
padding-top: 12px;
border-top: 1px solid var(--aurora-border);
}
.aurora-user-badge {
display: flex;
align-items: center;
gap: 10px;
padding: 8px;
margin-bottom: 8px;
border-radius: var(--aurora-r-md);
background: rgba(255, 255, 255, 0.03);
}
.aurora-user-avatar {
width: 36px;
height: 36px;
border-radius: 50%;
background: var(--aurora-primary-grad);
color: white;
display: flex;
align-items: center;
justify-content: center;
font-weight: 800;
font-size: 14px;
flex-shrink: 0;
box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
.aurora-user-info { flex: 1; min-width: 0; }
.aurora-user-name {
font-size: 13px;
font-weight: 700;
color: var(--aurora-text);
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}
.aurora-user-role { font-size: 10px; color: var(--aurora-text-dim); }

.aurora-logout-btn {
display: flex;
align-items: center;
gap: 8px;
width: 100%;
padding: 10px 12px;
background: rgba(239, 68, 68, 0.08);
border: 1px solid rgba(239, 68, 68, 0.2);
border-radius: var(--aurora-r-md);
color: var(--aurora-danger);
font-size: 12.5px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
}
.aurora-logout-btn:hover {
background: rgba(239, 68, 68, 0.15);
border-color: rgba(239, 68, 68, 0.4);
}

/* ═══ Mobile ═══ */
.aurora-mobile-header {
position: fixed;
top: 0; right: 0; left: 0;
height: 54px;
z-index: 100;
display: flex;
align-items: center;
justify-content: space-between;
background: rgba(22, 27, 46, 0.85);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border-bottom: 1px solid var(--aurora-border);
padding: 0 14px;
direction: rtl;
padding-top: env(safe-area-inset-top, 0px);
}
.aurora-mobile-brand {
display: flex;
align-items: center;
gap: 9px;
font-size: 16px;
font-weight: 900;
color: var(--aurora-text);
}
.aurora-mobile-logout {
width: 34px; height: 34px;
border-radius: 10px;
background: rgba(239, 68, 68, 0.1);
border: none;
color: var(--aurora-danger);
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
}

.aurora-bottom-nav {
position: fixed;
bottom: 0; right: 0; left: 0;
z-index: 100;
display: flex;
justify-content: space-around;
align-items: center;
background: rgba(22, 27, 46, 0.9);
backdrop-filter: blur(20px);
-webkit-backdrop-filter: blur(20px);
border-top: 1px solid var(--aurora-border);
padding: 7px 4px;
padding-bottom: max(8px, env(safe-area-inset-bottom, 8px));
direction: rtl;
}
.aurora-bottom-item {
display: flex;
flex-direction: column;
align-items: center;
gap: 3px;
background: transparent;
border: none;
color: var(--aurora-text-dim);
padding: 6px 8px;
flex: 1;
min-width: 0;
position: relative;
font-size: 10px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
}
.aurora-bottom-item.active {
color: var(--aurora-primary);
}
.aurora-bottom-item.active::before {
content: '';
position: absolute;
top: -7px;
left: 50%;
transform: translateX(-50%);
width: 24px;
height: 3px;
border-radius: 0 0 4px 4px;
background: var(--aurora-primary-grad);
box-shadow: 0 2px 8px rgba(99, 102, 241, 0.5);
}

/* ═══ Main Area ═══ */
.aurora-main {
flex: 1;
overflow: auto;
padding: 0;
position: relative;
background: var(--aurora-bg);
z-index: 1;
}
.aurora-main.conv {
overflow: hidden;
display: flex;
flex-direction: column;
}
.aurora-main.full {
margin-right: 0;
width: 100%;
}

.aurora-view {
animation: auroraFadeUp 0.3s var(--aurora-ease-bounce) both;
max-width: 1480px;
margin: 0 auto;
padding: 20px 22px;
}
@keyframes auroraFadeUp {
from { opacity: 0; transform: translateY(10px); }
to { opacity: 1; transform: translateY(0); }
}

.aurora-view-header {
display: flex;
justify-content: space-between;
align-items: flex-end;
margin-bottom: 18px;
flex-wrap: wrap;
gap: 12px;
}
.aurora-view-title {
font-size: 22px;
font-weight: 900;
color: var(--aurora-text);
margin: 0;
letter-spacing: -0.02em;
background: linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%);
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
}
.aurora-view-subtitle {
font-size: 12.5px;
color: var(--aurora-text-dim);
margin: 4px 0 0;
font-weight: 500;
}
.aurora-view-actions {
display: flex;
gap: 8px;
flex-wrap: wrap;
align-items: center;
justify-content: flex-end;
}

/* ═══ Buttons ═══ */
button {
font-family: 'Cairo', sans-serif;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
will-change: transform;
}
button:active:not(:disabled) {
transform: scale(0.96);
transition-duration: 0.08s;
}
button:disabled {
opacity: 0.42;
cursor: default;
}

.aurora-btn {
display: inline-flex;
align-items: center;
justify-content: center;
gap: 6px;
padding: 10px 16px;
border-radius: var(--aurora-r-md);
font-size: 13px;
font-weight: 700;
border: none;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
white-space: nowrap;
}
.aurora-btn.primary {
background: var(--aurora-primary-grad);
color: white;
box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}
.aurora-btn.primary:hover {
box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
transform: translateY(-1px);
}
.aurora-btn.ghost {
background: rgba(255, 255, 255, 0.05);
border: 1px solid var(--aurora-border);
color: var(--aurora-text-2);
}
.aurora-btn.ghost:hover {
background: rgba(255, 255, 255, 0.08);
border-color: var(--aurora-border-strong);
}
.aurora-btn.danger {
background: var(--aurora-danger-grad);
color: white;
box-shadow: 0 4px 14px rgba(239, 68, 68, 0.3);
}
.aurora-btn.success {
background: var(--aurora-success-grad);
color: white;
box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
}
.aurora-btn.warn {
background: var(--aurora-warn-grad);
color: white;
box-shadow: 0 4px 14px rgba(245, 158, 11, 0.3);
}
.aurora-btn.fb {
background: linear-gradient(135deg, #1877F2, #0D5FBF);
color: white;
box-shadow: 0 4px 14px rgba(24, 119, 242, 0.4);
}
.aurora-btn.wa {
background: linear-gradient(135deg, #25D366, #128C7E);
color: white;
box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
}
.aurora-btn.small {
padding: 7px 12px;
font-size: 12px;
}
.aurora-btn.full { width: 100%; }

.aurora-action-btn {
display: inline-flex;
align-items: center;
gap: 6px;
padding: 9px 14px;
border-radius: var(--aurora-r-md);
font-size: 12.5px;
font-weight: 700;
border: none;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
white-space: nowrap;
}
.aurora-action-btn.primary {
background: var(--aurora-primary-grad);
color: white;
box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}
.aurora-action-btn.primary:hover {
box-shadow: 0 6px 20px rgba(99, 102, 241, 0.5);
transform: translateY(-1px);
}
.aurora-action-btn.secondary {
background: rgba(99, 102, 241, 0.12);
border: 1px solid rgba(99, 102, 241, 0.25);
color: var(--aurora-primary);
}
.aurora-action-btn.success {
background: var(--aurora-success-grad);
color: white;
box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
}
.aurora-action-btn.ghost {
background: rgba(255, 255, 255, 0.05);
border: 1px solid var(--aurora-border);
color: var(--aurora-text-2);
}
.aurora-action-btn.fb {
background: linear-gradient(135deg, #1877F2, #0D5FBF);
color: white;
box-shadow: 0 4px 14px rgba(24, 119, 242, 0.4);
}

.aurora-icon-btn {
width: 30px; height: 30px;
border-radius: 9px;
background: rgba(99, 102, 241, 0.1);
border: 1px solid rgba(99, 102, 241, 0.2);
color: var(--aurora-primary);
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
}
.aurora-icon-btn:hover {
background: rgba(99, 102, 241, 0.2);
transform: translateY(-1px);
}
.aurora-icon-btn.danger {
background: rgba(239, 68, 68, 0.1);
border-color: rgba(239, 68, 68, 0.2);
color: var(--aurora-danger);
}
.aurora-icon-btn.danger:hover {
background: rgba(239, 68, 68, 0.2);
}
.aurora-icon-btn.success {
background: rgba(16, 185, 129, 0.1);
border-color: rgba(16, 185, 129, 0.2);
color: var(--aurora-success);
}

/* ═══ Stats Cards ═══ */
.aurora-stats-row {
display: grid;
grid-template-columns: repeat(4, 1fr);
gap: 12px;
margin-bottom: 18px;
}
.aurora-stat-card {
display: flex;
align-items: center;
gap: 12px;
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-lg);
padding: 16px 18px;
box-shadow: var(--aurora-shadow-sm);
transition: all 0.25s var(--aurora-ease);
position: relative;
overflow: hidden;
}
.aurora-stat-card::before {
content: '';
position: absolute;
top: 0; right: 0;
width: 100%; height: 2px;
background: linear-gradient(90deg, transparent, var(--accent, var(--aurora-primary)), transparent);
opacity: 0.6;
}
.aurora-stat-card.clickable { cursor: pointer; }
.aurora-stat-card.clickable:hover {
transform: translateY(-2px);
border-color: color-mix(in srgb, var(--accent, var(--aurora-primary)) 40%, transparent);
box-shadow: var(--aurora-shadow-md), 0 0 20px color-mix(in srgb, var(--accent, var(--aurora-primary)) 20%, transparent);
}
.aurora-stat-card.active {
border-color: color-mix(in srgb, var(--accent, var(--aurora-primary)) 50%, transparent);
background: linear-gradient(180deg, color-mix(in srgb, var(--accent, var(--aurora-primary)) 12%, transparent), rgba(22, 27, 46, 0.6));
}
.aurora-stat-icon {
width: 42px; height: 42px;
border-radius: 12px;
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;
background: color-mix(in srgb, var(--accent, var(--aurora-primary)) 15%, transparent);
color: var(--accent, var(--aurora-primary));
box-shadow: 0 4px 12px color-mix(in srgb, var(--accent, var(--aurora-primary)) 30%, transparent);
}
.aurora-stat-info { flex: 1; min-width: 0; }
.aurora-stat-value {
font-size: 22px;
font-weight: 900;
color: var(--aurora-text);
line-height: 1.1;
letter-spacing: -0.02em;
}
.aurora-stat-label {
font-size: 11px;
color: var(--aurora-text-muted);
margin-top: 3px;
font-weight: 600;
}

/* ═══ Section Tabs ═══ */
.aurora-section-tabs {
display: flex;
gap: 6px;
margin-bottom: 14px;
padding: 4px;
background: rgba(22, 27, 46, 0.4);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-lg);
width: fit-content;
}
.aurora-section-tab {
display: flex;
align-items: center;
gap: 7px;
padding: 8px 14px;
background: transparent;
border: none;
border-radius: var(--aurora-r-md);
color: var(--aurora-text-muted);
font-size: 12.5px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
}
.aurora-section-tab:hover {
background: rgba(255, 255, 255, 0.04);
color: var(--aurora-text-2);
}
.aurora-section-tab.active {
background: var(--aurora-primary-grad);
color: white;
font-weight: 700;
box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
.aurora-tab-count {
background: rgba(255, 255, 255, 0.15);
border-radius: var(--aurora-r-full);
padding: 1px 7px;
font-size: 10px;
font-weight: 800;
}
.aurora-section-tab.active .aurora-tab-count {
background: rgba(255, 255, 255, 0.25);
}

/* ═══ Filters ═══ */
.aurora-filters {
display: flex;
flex-direction: column;
gap: 8px;
margin-bottom: 14px;
background: rgba(22, 27, 46, 0.4);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-md);
padding: 10px;
}
.aurora-filters-row {
display: flex;
gap: 8px;
flex-wrap: wrap;
align-items: center;
}
.aurora-filter-select {
display: flex;
align-items: center;
gap: 7px;
background: var(--aurora-surface);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-md);
padding: 7px 12px;
transition: all 0.2s var(--aurora-ease);
}
.aurora-filter-select:hover {
border-color: var(--aurora-border-strong);
}
.aurora-filter-select select {
background: transparent;
border: none;
color: var(--aurora-text);
font-size: 12.5px;
font-weight: 600;
appearance: none;
cursor: pointer;
font-family: 'Cairo', sans-serif;
padding-left: 4px;
}
.aurora-compact-select {
background: var(--aurora-surface);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-md);
padding: 7px 11px;
color: var(--aurora-text);
font-size: 12px;
font-family: 'Cairo', sans-serif;
min-width: 110px;
}
.aurora-search-box {
display: flex;
align-items: center;
gap: 8px;
background: var(--aurora-surface);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-md);
padding: 8px 12px;
flex: 1;
min-width: 180px;
transition: all 0.2s var(--aurora-ease);
}
.aurora-search-box.flex { flex: 1; min-width: 160px; }
.aurora-search-box:focus-within {
border-color: var(--aurora-primary);
box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
.aurora-search-box input {
background: transparent;
border: none;
color: var(--aurora-text);
font-size: 12.5px;
width: 100%;
font-family: 'Cairo', sans-serif;
}

/* ═══ Chips ═══ */
.aurora-chips {
display: flex;
gap: 6px;
margin-bottom: 14px;
flex-wrap: wrap;
}
.aurora-chip {
padding: 7px 14px;
background: var(--aurora-surface);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-full);
color: var(--aurora-text-muted);
font-size: 12px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
}
.aurora-chip:hover {
background: var(--aurora-surface-2);
color: var(--aurora-text-2);
}
.aurora-chip.active {
background: var(--aurora-primary-grad);
border-color: transparent;
color: white;
font-weight: 700;
box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}

/* ═══ Orders Grid ═══ */
.aurora-orders-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
gap: 12px;
}
.aurora-order-card {
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-lg);
padding: 0;
display: flex;
flex-direction: column;
overflow: hidden;
box-shadow: var(--aurora-shadow-sm);
transition: all 0.25s var(--aurora-ease);
position: relative;
animation: auroraCardEnter 0.3s var(--aurora-ease-bounce) both;
}
@keyframes auroraCardEnter {
from { opacity: 0; transform: translateY(12px) scale(0.98); }
to { opacity: 1; transform: translateY(0) scale(1); }
}
.aurora-order-card:hover {
transform: translateY(-3px);
border-color: rgba(99, 102, 241, 0.3);
box-shadow: var(--aurora-shadow-md), 0 0 20px rgba(99, 102, 241, 0.15);
}
.aurora-order-card.rejected {
border-color: rgba(239, 68, 68, 0.4);
box-shadow: 0 0 0 1px rgba(239, 68, 68, 0.1), 0 4px 14px -6px rgba(239, 68, 68, 0.3);
}
.aurora-order-card.prep {
border-color: rgba(245, 158, 11, 0.3);
}

.aurora-order-strip {
height: 3px;
width: 100%;
}

.aurora-rejected-banner {
display: flex;
align-items: center;
gap: 7px;
justify-content: center;
background: linear-gradient(90deg, rgba(239, 68, 68, 0.9), rgba(220, 38, 38, 0.9));
color: white;
font-size: 12px;
font-weight: 800;
padding: 9px 12px;
}

.aurora-order-head {
display: flex;
align-items: center;
gap: 11px;
padding: 14px 14px 10px;
}
.aurora-order-avatar {
width: 40px; height: 40px;
border-radius: 12px;
flex-shrink: 0;
background: rgba(99, 102, 241, 0.15);
color: var(--aurora-primary);
display: flex;
align-items: center;
justify-content: center;
font-weight: 800;
font-size: 16px;
border: 1px solid rgba(99, 102, 241, 0.25);
}
.aurora-order-avatar.done {
background: rgba(16, 185, 129, 0.15);
color: var(--aurora-success);
border-color: rgba(16, 185, 129, 0.3);
}
.aurora-order-avatar.rej {
background: rgba(239, 68, 68, 0.15);
color: var(--aurora-danger);
border-color: rgba(239, 68, 68, 0.3);
}
.aurora-order-head-info { flex: 1; min-width: 0; }
.aurora-order-customer {
font-size: 14px;
font-weight: 800;
color: var(--aurora-text);
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}
.aurora-order-customer span {
font-size: 12px;
color: var(--aurora-text-dim);
font-weight: 600;
margin-right: 4px;
}
.aurora-order-page {
font-size: 11px;
color: var(--aurora-text-muted);
margin-top: 2px;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}

.aurora-stage-badge {
font-size: 11px;
font-weight: 700;
border-radius: var(--aurora-r-full);
padding: 4px 10px;
flex-shrink: 0;
white-space: nowrap;
}

.aurora-reject-reason {
margin: 0 14px 10px;
padding: 9px 11px;
background: rgba(239, 68, 68, 0.08);
border: 1px solid rgba(239, 68, 68, 0.2);
border-radius: var(--aurora-r-md);
font-size: 12px;
color: var(--aurora-text);
display: flex;
flex-direction: column;
gap: 3px;
}
.aurora-reject-label {
font-size: 11px;
color: var(--aurora-danger);
font-weight: 700;
}

.aurora-reprep-note {
display: flex;
align-items: flex-start;
gap: 7px;
margin: 0 14px 10px;
background: rgba(245, 158, 11, 0.08);
border: 1px solid rgba(245, 158, 11, 0.25);
color: #FCD34D;
border-radius: var(--aurora-r-md);
padding: 9px 11px;
font-size: 12px;
line-height: 1.6;
}

.aurora-order-body {
padding: 0 14px 10px;
display: flex;
flex-direction: column;
gap: 6px;
}
.aurora-order-row {
display: flex;
align-items: center;
gap: 7px;
font-size: 12px;
color: var(--aurora-text-muted);
}
.aurora-order-items {
font-size: 12px;
color: var(--aurora-text-2);
background: var(--aurora-surface);
border-radius: var(--aurora-r-sm);
padding: 9px 11px;
margin-top: 3px;
line-height: 1.6;
border: 1px solid var(--aurora-border);
white-space: pre-wrap;
}

.aurora-warehouse-warn {
font-size: 11.5px;
color: var(--aurora-warn);
background: rgba(245, 158, 11, 0.08);
border: 1px solid rgba(245, 158, 11, 0.2);
border-radius: var(--aurora-r-sm);
padding: 7px 10px;
margin-top: 5px;
}
.aurora-warehouse-match {
border-radius: var(--aurora-r-md);
padding: 9px 11px;
margin-top: 6px;
border: 1px solid;
}
.aurora-warehouse-match.high {
background: rgba(16, 185, 129, 0.08);
border-color: rgba(16, 185, 129, 0.25);
}
.aurora-warehouse-match.medium, .aurora-warehouse-match.low {
background: rgba(99, 102, 241, 0.08);
border-color: rgba(99, 102, 241, 0.25);
}
.aurora-warehouse-match-title {
font-size: 11.5px;
font-weight: 800;
margin-bottom: 4px;
}
.aurora-warehouse-match.high .aurora-warehouse-match-title { color: var(--aurora-success); }
.aurora-warehouse-match.medium .aurora-warehouse-match-title,
.aurora-warehouse-match.low .aurora-warehouse-match-title { color: var(--aurora-primary); }
.aurora-warehouse-match-name {
font-size: 13px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-warehouse-match-loc {
font-size: 11.5px;
color: var(--aurora-primary);
margin-top: 3px;
font-weight: 700;
}
.aurora-warehouse-match-qty {
font-size: 11px;
color: var(--aurora-text-muted);
margin-top: 2px;
}

.aurora-jenni-info {
margin-top: 9px;
padding: 9px 11px;
background: rgba(99, 102, 241, 0.05);
border: 1px solid rgba(99, 102, 241, 0.15);
border-radius: var(--aurora-r-md);
}
.aurora-jenni-head {
display: flex;
align-items: center;
gap: 6px;
margin-bottom: 5px;
font-size: 11.5px;
font-weight: 700;
color: var(--aurora-primary);
}
.aurora-jenni-status {
font-size: 10.5px;
font-weight: 700;
padding: 2px 8px;
border-radius: var(--aurora-r-full);
margin-right: auto;
}
.aurora-jenni-note {
font-size: 11px;
color: var(--aurora-text-muted);
margin-bottom: 2px;
}
.aurora-jenni-track {
font-size: 10px;
color: var(--aurora-text-dim);
font-family: monospace;
}
.aurora-jenni-updated {
font-size: 10px;
color: var(--aurora-text-dim);
margin-top: 2px;
}
.aurora-jenni-actions {
margin-top: 10px;
display: flex;
flex-direction: column;
gap: 6px;
}
.aurora-jenni-label {
font-size: 11px;
color: var(--aurora-text-dim);
font-weight: 600;
margin-bottom: 2px;
}

.aurora-jenni-error {
margin: 0 14px 8px;
border-radius: var(--aurora-r-md);
overflow: hidden;
border: 1px solid rgba(239, 68, 68, 0.3);
}
.aurora-jenni-error-body {
background: rgba(239, 68, 68, 0.1);
padding: 8px 11px;
font-size: 11.5px;
color: var(--aurora-danger);
display: flex;
align-items: flex-start;
gap: 6px;
}
.aurora-jenni-error-fix {
width: 100%;
display: flex;
align-items: center;
justify-content: center;
gap: 6px;
padding: 8px;
background: rgba(239, 68, 68, 0.08);
border: none;
border-top: 1px solid rgba(239, 68, 68, 0.2);
color: var(--aurora-danger);
font-size: 12px;
font-weight: 700;
cursor: pointer;
}

.aurora-order-actions {
display: flex;
gap: 6px;
padding: 10px 14px;
border-top: 1px solid var(--aurora-border);
background: rgba(0, 0, 0, 0.15);
}
.aurora-order-action-btn {
flex: 1;
display: flex;
align-items: center;
justify-content: center;
gap: 5px;
height: 32px;
border-radius: var(--aurora-r-sm);
background: var(--aurora-surface);
border: 1px solid var(--aurora-border);
color: var(--aurora-text-muted);
font-size: 12px;
font-weight: 700;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
}
.aurora-order-action-btn:hover {
background: var(--aurora-surface-2);
color: var(--aurora-text);
border-color: var(--aurora-border-strong);
}
.aurora-order-action-btn.primary {
background: var(--aurora-primary-grad);
border-color: transparent;
color: white;
flex: 1.6;
box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}

.aurora-order-status-readonly {
flex: 1.4;
display: flex;
align-items: center;
gap: 5px;
justify-content: center;
border-radius: var(--aurora-r-sm);
padding: 6px 9px;
font-size: 12px;
font-weight: 700;
cursor: default;
}
.aurora-order-status-select {
flex: 1.4;
border: 1px solid;
border-radius: var(--aurora-r-sm);
padding: 6px 9px;
font-size: 12px;
font-weight: 700;
appearance: none;
cursor: pointer;
font-family: 'Cairo', sans-serif;
}

/* ═══ Batches ═══ */
.aurora-batches {
display: flex;
flex-direction: column;
gap: 22px;
}
.aurora-batch {
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-lg);
padding: 16px;
box-shadow: var(--aurora-shadow-sm);
}
.aurora-batch-header {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 14px;
flex-wrap: wrap;
gap: 9px;
}
.aurora-batch-info {
display: flex;
align-items: center;
gap: 8px;
font-size: 13px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-batch-time {
font-size: 11px;
color: var(--aurora-text-dim);
font-weight: 500;
}

/* ═══ Global Search ═══ */
.aurora-global-search {
position: relative;
display: flex;
align-items: center;
gap: 7px;
width: 220px;
min-height: 36px;
background: var(--aurora-surface);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-md);
padding: 0 11px;
transition: all 0.2s var(--aurora-ease);
}
.aurora-global-search:focus-within {
border-color: var(--aurora-primary);
box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}
.aurora-global-search input {
width: 100%;
background: transparent;
border: none;
outline: none;
color: var(--aurora-text);
font-size: 12.5px;
font-family: 'Cairo', sans-serif;
}
.aurora-global-results {
position: absolute;
top: calc(100% + 6px);
left: 0; right: 0;
z-index: 50;
background: rgba(22, 27, 46, 0.95);
backdrop-filter: blur(20px);
border: 1px solid var(--aurora-border-strong);
border-radius: var(--aurora-r-md);
box-shadow: var(--aurora-shadow-lg);
overflow: hidden;
}
.aurora-global-result {
width: 100%;
display: flex;
align-items: center;
gap: 8px;
padding: 9px 11px;
border: none;
background: transparent;
border-radius: 0;
text-align: right;
color: var(--aurora-text);
cursor: pointer;
transition: background 0.15s;
}
.aurora-global-result:hover {
background: rgba(99, 102, 241, 0.1);
}
.aurora-global-result-info { min-width: 0; flex: 1; }
.aurora-global-result-title {
font-size: 12.5px;
font-weight: 700;
color: var(--aurora-text);
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
}
.aurora-global-result-title span {
color: var(--aurora-text-dim);
font-weight: 600;
margin-right: 4px;
}
.aurora-global-result-meta {
font-size: 10.5px;
color: var(--aurora-text-muted);
margin-top: 2px;
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
}
.aurora-global-empty {
padding: 12px;
color: var(--aurora-text-dim);
font-size: 12px;
text-align: center;
}

/* ═══ Status Pills ═══ */
.aurora-status-pill, .aurora-stage-pill {
display: inline-flex;
align-items: center;
gap: 5px;
padding: 4px 11px;
border-radius: var(--aurora-r-full);
font-size: 11.5px;
font-weight: 700;
border: 1px solid;
white-space: nowrap;
}

/* ═══ Modals ═══ */
.aurora-modal-overlay {
position: fixed;
inset: 0;
background: rgba(0, 0, 0, 0.7);
backdrop-filter: blur(8px);
-webkit-backdrop-filter: blur(8px);
display: flex;
align-items: center;
justify-content: center;
z-index: 1000;
padding: 20px;
animation: auroraFadeIn 0.2s var(--aurora-ease);
}
@keyframes auroraFadeIn {
from { opacity: 0; }
to { opacity: 1; }
}

.aurora-modal {
background: rgba(22, 27, 46, 0.95);
backdrop-filter: blur(30px) saturate(1.4);
-webkit-backdrop-filter: blur(30px) saturate(1.4);
border: 1px solid var(--aurora-border-strong);
border-radius: var(--aurora-r-xl);
width: 100%;
max-width: 480px;
max-height: 88vh;
overflow-y: auto;
box-shadow: var(--aurora-shadow-lg), var(--aurora-glow-primary);
position: relative;
z-index: 1;
animation: auroraModalIn 0.3s var(--aurora-ease-bounce) both;
}
.aurora-modal.small { max-width: 420px; }
.aurora-modal.tall { max-height: 85vh; }

@keyframes auroraModalIn {
from { opacity: 0; transform: translateY(20px) scale(0.97); }
to { opacity: 1; transform: translateY(0) scale(1); }
}

.aurora-modal-header {
display: flex;
justify-content: space-between;
align-items: center;
padding: 16px 20px;
border-bottom: 1px solid var(--aurora-border);
}
.aurora-modal-header h3 {
font-size: 16px;
font-weight: 800;
color: var(--aurora-text);
margin: 0;
}
.aurora-modal-header button {
background: transparent;
border: none;
color: var(--aurora-text-muted);
display: flex;
cursor: pointer;
padding: 4px;
border-radius: 8px;
transition: all 0.15s;
}
.aurora-modal-header button:hover {
background: rgba(255, 255, 255, 0.08);
color: var(--aurora-text);
}

.aurora-modal-body {
padding: 18px 20px;
display: flex;
flex-direction: column;
gap: 14px;
}
.aurora-modal-sub {
font-size: 12.5px;
color: var(--aurora-text-muted);
margin-bottom: 4px;
}
.aurora-modal-section {
display: flex;
flex-direction: column;
gap: 6px;
}
.aurora-modal-section label {
font-size: 12px;
color: var(--aurora-text-2);
font-weight: 700;
}
.aurora-modal-footer {
display: flex;
gap: 9px;
padding: 14px 20px;
border-top: 1px solid var(--aurora-border);
}
.aurora-modal-footer.wrap { flex-wrap: wrap; }

/* ═══ Forms ═══ */
.aurora-form-group {
display: flex;
flex-direction: column;
gap: 6px;
}
.aurora-form-group label {
font-size: 12px;
font-weight: 700;
color: var(--aurora-text-2);
display: flex;
align-items: center;
gap: 4px;
}
.aurora-form-group input,
.aurora-form-group select,
.aurora-form-group textarea {
background: var(--aurora-surface);
border: 1.5px solid var(--aurora-border);
border-radius: var(--aurora-r-md);
padding: 10px 13px;
color: var(--aurora-text);
font-size: 13px;
font-family: 'Cairo', sans-serif;
transition: all 0.2s var(--aurora-ease);
}
.aurora-form-group input:focus,
.aurora-form-group select:focus,
.aurora-form-group textarea:focus {
border-color: var(--aurora-primary);
box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
background: var(--aurora-surface-2);
}
.aurora-form-group input.invalid,
.aurora-form-group select.invalid {
border-color: rgba(239, 68, 68, 0.5);
}
.aurora-form-group input.valid,
.aurora-form-group select.valid {
border-color: rgba(16, 185, 129, 0.5);
}
.aurora-form-group textarea {
min-height: 75px;
resize: vertical;
line-height: 1.6;
}

.aurora-required { color: var(--aurora-danger); font-weight: 800; font-size: 14px; }
.aurora-hint { color: var(--aurora-text-dim); font-size: 10.5px; font-weight: 500; }
.aurora-field-hint {
font-size: 10px;
color: var(--aurora-text-dim);
font-weight: 500;
margin-right: auto;
}
.aurora-field-error {
font-size: 11px;
color: var(--aurora-danger);
margin-top: 2px;
font-weight: 600;
}
.aurora-field-success {
font-size: 11px;
color: var(--aurora-success);
margin-top: 2px;
font-weight: 600;
}

.aurora-grid-2 {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 12px;
}

.aurora-role-toggle {
display: flex;
gap: 7px;
}
.aurora-role-btn {
flex: 1;
display: flex;
align-items: center;
justify-content: center;
gap: 6px;
padding: 10px;
background: var(--aurora-surface);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-md);
color: var(--aurora-text-muted);
font-size: 12px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
}
.aurora-role-btn.active {
background: rgba(99, 102, 241, 0.15);
border-color: rgba(99, 102, 241, 0.4);
color: var(--aurora-primary);
font-weight: 700;
}

.aurora-perms-grid {
display: flex;
flex-direction: column;
gap: 5px;
}
.aurora-perm-check {
display: flex;
align-items: center;
gap: 9px;
font-size: 12.5px;
color: var(--aurora-text-2);
padding: 6px 0;
cursor: pointer;
}
.aurora-perm-check input {
width: 15px; height: 15px;
accent-color: var(--aurora-primary);
cursor: pointer;
}

.aurora-warehouse-note {
display: flex;
gap: 9px;
align-items: flex-start;
background: rgba(245, 158, 11, 0.06);
border: 1px solid rgba(245, 158, 11, 0.2);
border-radius: var(--aurora-r-md);
padding: 11px 13px;
font-size: 12px;
color: var(--aurora-text-muted);
line-height: 1.6;
}

.aurora-jenni-banner {
margin: 0 20px 4px;
padding: 9px 12px;
background: rgba(99, 102, 241, 0.08);
border: 1px solid rgba(99, 102, 241, 0.22);
border-radius: var(--aurora-r-md);
font-size: 11.5px;
color: var(--aurora-primary);
display: flex;
align-items: center;
gap: 7px;
font-weight: 600;
}

.aurora-jenni-status {
padding: 11px 14px;
border-radius: var(--aurora-r-md);
display: flex;
align-items: center;
gap: 9px;
font-size: 12.5px;
font-weight: 700;
}
.aurora-jenni-status.ready {
background: rgba(16, 185, 129, 0.1);
border: 1px solid rgba(16, 185, 129, 0.3);
color: var(--aurora-success);
}
.aurora-jenni-status.error {
background: rgba(239, 68, 68, 0.1);
border: 1px solid rgba(239, 68, 68, 0.3);
color: var(--aurora-danger);
}

.aurora-auto-extract {
display: flex;
align-items: center;
gap: 6px;
margin-bottom: 7px;
padding: 7px 11px;
background: rgba(99, 102, 241, 0.1);
border: 1px solid rgba(99, 102, 241, 0.25);
border-radius: var(--aurora-r-sm);
color: var(--aurora-primary);
font-size: 11.5px;
font-weight: 700;
cursor: pointer;
width: 100%;
justify-content: center;
transition: all 0.2s var(--aurora-ease);
}
.aurora-auto-extract:hover {
background: rgba(99, 102, 241, 0.18);
}

.aurora-date-options {
display: flex;
gap: 7px;
}
.aurora-date-option {
flex: 1;
padding: 9px 5px;
border-radius: var(--aurora-r-sm);
font-size: 12px;
font-weight: 700;
cursor: pointer;
background: rgba(255, 255, 255, 0.04);
border: 1.5px solid var(--aurora-border);
color: var(--aurora-text-muted);
transition: all 0.2s var(--aurora-ease);
}
.aurora-date-option.active {
background: rgba(99, 102, 241, 0.18);
border-color: var(--aurora-primary);
color: var(--aurora-primary);
}

/* ═══ Detail Modal ═══ */
.aurora-detail-row {
display: flex;
justify-content: space-between;
align-items: center;
gap: 12px;
padding-bottom: 11px;
border-bottom: 1px solid var(--aurora-border);
}
.aurora-detail-row:last-child { border-bottom: none; }
.aurora-detail-row.column {
flex-direction: column;
align-items: flex-start;
gap: 7px;
}
.aurora-detail-row > span:first-child {
font-size: 12px;
color: var(--aurora-text-muted);
flex-shrink: 0;
font-weight: 600;
}
.aurora-detail-row > span:last-child, .aurora-detail-row .aurora-pre {
font-size: 13px;
color: var(--aurora-text);
font-weight: 600;
text-align: left;
overflow-wrap: anywhere;
}
.aurora-detail-row .aurora-pre {
white-space: pre-wrap;
}
.aurora-accent {
color: var(--aurora-primary) !important;
font-weight: 700 !important;
}
.aurora-mono { font-family: monospace; }

.aurora-amount-lg {
font-size: 19px;
font-weight: 900;
}
.aurora-amount-glow {
background: linear-gradient(135deg, #FCD34D, #F59E0B);
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
font-weight: 900;
}
.aurora-amount-lg span:last-child {
font-size: 12px;
color: var(--aurora-text-muted);
font-weight: 600;
margin-right: 3px;
}

.aurora-prep-done {
display: flex;
align-items: center;
gap: 8px;
padding: 10px 13px;
background: rgba(16, 185, 129, 0.1);
border: 1px solid rgba(16, 185, 129, 0.25);
border-radius: var(--aurora-r-md);
margin-bottom: 6px;
color: var(--aurora-text);
font-size: 13px;
}
.aurora-prep-done svg { color: var(--aurora-success); }

.aurora-detail-timeline {
padding-top: 12px;
display: flex;
flex-direction: column;
gap: 0;
}
.aurora-timeline-title {
font-size: 12px;
color: var(--aurora-text-muted);
font-weight: 700;
margin-bottom: 12px;
}
.aurora-timeline {
position: relative;
padding-right: 5px;
}
.aurora-timeline-item {
display: flex;
gap: 11px;
position: relative;
padding-bottom: 16px;
}
.aurora-timeline-item:last-child { padding-bottom: 0; }
.aurora-timeline-dot-wrap {
display: flex;
flex-direction: column;
align-items: center;
flex-shrink: 0;
}
.aurora-timeline-dot {
width: 12px; height: 12px;
border-radius: 50%;
background: var(--aurora-primary);
margin-top: 3px;
box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}
.aurora-timeline-dot.last {
background: var(--aurora-success);
box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.25);
}
.aurora-timeline-line {
width: 2px;
flex: 1;
background: rgba(99, 102, 241, 0.3);
margin-top: 3px;
}
.aurora-timeline-content { flex: 1; min-width: 0; }
.aurora-timeline-step {
font-size: 13px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-timeline-step.last { color: var(--aurora-success); }
.aurora-timeline-branch {
font-size: 11px;
color: var(--aurora-text-muted);
margin-top: 2px;
}
.aurora-timeline-date {
font-size: 10.5px;
color: var(--aurora-text-dim);
margin-top: 2px;
font-family: monospace;
}
.aurora-timeline-note {
font-size: 11px;
color: var(--aurora-warn);
margin-top: 3px;
}

.aurora-detail-action-btn, .aurora-btn.ghost {
flex: 1;
min-width: 88px;
}

/* ═══ Conversations ═══ */
.aurora-conv-fullscreen {
display: flex;
overflow: hidden;
direction: rtl;
background: var(--aurora-bg);
width: 100%;
height: 100%;
flex: 1;
}

.aurora-conv-list {
width: 340px;
min-width: 280px;
max-width: 360px;
display: flex;
flex-direction: column;
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border-left: 1px solid var(--aurora-border);
height: 100%;
overflow: hidden;
flex-shrink: 0;
}

.aurora-conv-list-header {
display: flex;
align-items: center;
gap: 10px;
padding: 14px 15px 12px;
border-bottom: 1px solid var(--aurora-border);
flex-shrink: 0;
}
.aurora-conv-brand {
font-size: 16px;
font-weight: 900;
color: var(--aurora-text);
letter-spacing: -0.01em;
flex-shrink: 0;
background: linear-gradient(135deg, #F8FAFC 0%, #94A3B8 100%);
-webkit-background-clip: text;
background-clip: text;
-webkit-text-fill-color: transparent;
}
.aurora-page-filter {
flex: 1;
display: flex;
justify-content: center;
}
.aurora-page-filter > div,
.aurora-page-filter {
display: flex;
align-items: center;
gap: 6px;
background: var(--aurora-surface);
border-radius: var(--aurora-r-full);
padding: 7px 13px;
border: 1px solid var(--aurora-border);
}
.aurora-page-filter select {
background: transparent;
border: none;
color: var(--aurora-text);
font-size: 12px;
font-weight: 600;
appearance: none;
cursor: pointer;
font-family: 'Cairo', sans-serif;
}

.aurora-search-wrap {
padding: 9px 11px 5px;
flex-shrink: 0;
}

.aurora-conv-tabs {
display: flex;
flex-shrink: 0;
border-bottom: 1px solid var(--aurora-border);
padding: 7px 9px 0;
gap: 4px;
}
.aurora-conv-tab {
flex: 1;
display: flex;
flex-direction: column;
align-items: center;
gap: 4px;
padding: 8px 4px 10px;
background: transparent;
border: none;
border-bottom: 2px solid transparent;
color: var(--aurora-text-dim);
font-size: 10px;
font-weight: 700;
transition: all 0.2s var(--aurora-ease);
position: relative;
cursor: pointer;
}
.aurora-conv-tab:hover {
color: var(--aurora-text-muted);
}
.aurora-conv-tab.active {
color: var(--aurora-primary);
border-bottom-color: var(--aurora-primary);
}
.aurora-tab-icon-wrap {
position: relative;
display: flex;
align-items: center;
justify-content: center;
}
.aurora-tab-badge {
position: absolute;
top: -7px;
right: -11px;
min-width: 17px;
height: 17px;
padding: 0 4px;
border-radius: var(--aurora-r-full);
background: var(--aurora-danger);
color: white;
font-size: 9px;
font-weight: 800;
display: flex;
align-items: center;
justify-content: center;
border: 2px solid var(--aurora-surface);
line-height: 1;
box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
}

.aurora-conv-scroll {
flex: 1;
overflow-y: auto;
overflow-x: hidden;
}
.aurora-mark-all-btn {
display: flex;
align-items: center;
justify-content: center;
gap: 7px;
width: 100%;
padding: 8px;
background: rgba(99, 102, 241, 0.08);
border: none;
color: var(--aurora-primary);
font-size: 12px;
font-weight: 600;
cursor: pointer;
transition: background 0.15s;
}
.aurora-mark-all-btn:hover {
background: rgba(99, 102, 241, 0.15);
}

.aurora-conv-item {
display: flex;
gap: 12px;
padding: 12px 15px;
width: 100%;
background: transparent;
border: none;
border-right: 3px solid transparent;
border-radius: 0;
text-align: right;
align-items: center;
transition: all 0.15s var(--aurora-ease);
min-height: 76px;
cursor: pointer;
position: relative;
}
.aurora-conv-item:hover {
background: rgba(255, 255, 255, 0.03);
}
.aurora-conv-item.active {
background: rgba(99, 102, 241, 0.12);
border-right-color: var(--aurora-primary);
}

.aurora-conv-content {
flex: 1;
min-width: 0;
text-align: right;
}
.aurora-conv-top {
display: flex;
justify-content: space-between;
align-items: center;
margin-bottom: 4px;
}
.aurora-conv-name {
font-size: 14px;
font-weight: 700;
color: var(--aurora-text);
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
max-width: calc(100% - 60px);
}
.aurora-conv-name.unread { font-weight: 800; }
.aurora-conv-time {
font-size: 11px;
color: var(--aurora-text-dim);
flex-shrink: 0;
font-weight: 500;
}
.aurora-conv-time.unread {
color: var(--aurora-primary);
font-weight: 700;
}
.aurora-conv-bottom {
display: flex;
justify-content: space-between;
gap: 7px;
align-items: center;
}
.aurora-conv-last {
font-size: 12.5px;
color: var(--aurora-text-muted);
overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
flex: 1;
font-weight: 500;
}
.aurora-conv-last.unread {
color: var(--aurora-text-2);
font-weight: 600;
}
.aurora-unread-badge {
background: var(--aurora-danger);
color: white;
border-radius: var(--aurora-r-full);
font-size: 11px;
font-weight: 800;
padding: 2px 8px;
min-width: 21px;
height: 21px;
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;
box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
}
.aurora-pinned-tag {
margin-top: 4px;
display: inline-flex;
align-items: center;
gap: 3px;
font-size: 10px;
color: var(--aurora-primary);
font-weight: 600;
background: rgba(99, 102, 241, 0.12);
border-radius: var(--aurora-r-full);
padding: 2px 7px;
}

/* ═══ Avatar ═══ */
.aurora-avatar {
position: relative;
flex-shrink: 0;
}
.aurora-avatar.lg { width: 46px; height: 46px; }
.aurora-avatar:not(.lg) { width: 42px; height: 42px; }
.aurora-avatar-letter {
width: 100%;
height: 100%;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
font-weight: 700;
font-size: 16px;
}
.aurora-avatar-img {
width: 100%;
height: 100%;
border-radius: 50%;
object-fit: cover;
}
.aurora-platform-badge {
position: absolute;
bottom: 0;
left: 0;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
border: 2.5px solid var(--aurora-bg-elev);
box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
}
.aurora-platform-badge.wa { background: #25D366; }
.aurora-platform-badge.fb { background: #0A8CFF; }

/* ═══ Chat Detail ═══ */
.aurora-conv-detail {
flex: 1;
display: flex;
flex-direction: column;
background: var(--aurora-bg);
height: 100%;
overflow: hidden;
min-width: 0;
}
.aurora-conv-detail.empty {
display: flex;
align-items: center;
justify-content: center;
}

.aurora-chat-header {
display: flex;
align-items: center;
gap: 12px;
padding: 13px 17px;
border-bottom: 1px solid var(--aurora-border);
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
flex-shrink: 0;
}
.aurora-back-btn {
display: none;
width: 34px; height: 34px;
border-radius: 10px;
background: var(--aurora-surface);
border: none;
color: var(--aurora-text-muted);
align-items: center;
justify-content: center;
flex-shrink: 0;
cursor: pointer;
}
.aurora-chat-header-info {
flex: 1;
min-width: 0;
}
.aurora-chat-name {
font-size: 15px;
font-weight: 800;
color: var(--aurora-text);
}
.aurora-chat-page {
font-size: 11px;
color: var(--aurora-text-muted);
font-weight: 500;
}
.aurora-pin-btn {
display: flex;
align-items: center;
gap: 6px;
padding: 7px 13px;
background: rgba(99, 102, 241, 0.12);
border: 1px solid rgba(99, 102, 241, 0.25);
border-radius: var(--aurora-r-full);
color: var(--aurora-primary);
font-size: 12px;
font-weight: 700;
flex-shrink: 0;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
}
.aurora-pin-btn:hover {
background: rgba(99, 102, 241, 0.2);
}

.aurora-linked-order {
background: rgba(99, 102, 241, 0.06);
border-bottom: 1px solid rgba(99, 102, 241, 0.18);
padding: 11px 17px;
flex-shrink: 0;
}
.aurora-linked-header {
display: flex;
align-items: center;
gap: 7px;
font-size: 11.5px;
font-weight: 700;
color: var(--aurora-primary);
margin-bottom: 9px;
}
.aurora-linked-body {
display: flex;
flex-direction: column;
gap: 7px;
}
.aurora-linked-row {
display: flex;
justify-content: space-between;
align-items: center;
}
.aurora-linked-row > span:first-child {
font-size: 11.5px;
color: var(--aurora-text-muted);
}
.aurora-linked-row > span:last-child {
font-size: 12.5px;
color: var(--aurora-text);
font-weight: 600;
}
.aurora-amount {
color: var(--aurora-primary) !important;
font-weight: 700 !important;
}
.aurora-linked-detail-btn {
display: flex;
align-items: center;
justify-content: center;
gap: 7px;
width: 100%;
margin-top: 10px;
padding: 8px;
background: rgba(99, 102, 241, 0.12);
border: none;
border-radius: var(--aurora-r-sm);
color: var(--aurora-primary);
font-size: 12px;
font-weight: 700;
cursor: pointer;
transition: background 0.15s;
}
.aurora-linked-detail-btn:hover {
background: rgba(99, 102, 241, 0.2);
}

.aurora-chat-scroll {
flex: 1;
overflow-y: auto;
overflow-x: hidden;
display: flex;
flex-direction: column;
padding: 15px 17px;
background: var(--aurora-bg);
}

.aurora-day-divider {
align-self: center;
margin: 5px 0 11px;
padding: 4px 13px;
border-radius: var(--aurora-r-full);
background: rgba(22, 27, 46, 0.9);
backdrop-filter: blur(10px);
color: var(--aurora-text-muted);
font-size: 11px;
font-weight: 700;
}

.aurora-msg-row {
display: flex;
width: 100%;
min-width: 0;
animation: auroraMsgIn 0.25s var(--aurora-ease-bounce) both;
}
@keyframes auroraMsgIn {
from { opacity: 0; transform: translateY(6px) scale(0.98); }
to { opacity: 1; transform: translateY(0) scale(1); }
}
.aurora-msg-row.outgoing { justify-content: flex-end; }
.aurora-msg-row.incoming { justify-content: flex-start; }

.aurora-msg-bubble {
max-width: 74%;
padding: 9px 13px;
font-size: 13.5px;
line-height: 1.6;
display: flex;
flex-direction: column;
gap: 4px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
overflow-wrap: anywhere;
word-break: break-word;
min-width: 0;
}
.aurora-msg-bubble.incoming {
background: var(--aurora-surface-2);
border-radius: 16px 16px 16px 4px;
color: var(--aurora-text);
border: 1px solid var(--aurora-border);
}
.aurora-msg-bubble.outgoing {
background: linear-gradient(135deg, #6366F1, #8B5CF6);
border-radius: 16px 16px 4px 16px;
color: white;
}
.aurora-msg-text {
white-space: pre-wrap;
}
.aurora-msg-image {
width: 100%;
max-width: 270px;
border-radius: var(--aurora-r-md);
display: block;
}
.aurora-msg-audio {
width: 245px;
max-width: 100%;
height: 36px;
}
.aurora-msg-time {
font-size: 10px;
opacity: 0.6;
align-self: flex-end;
font-weight: 500;
}

.aurora-composer {
display: flex;
align-items: center;
gap: 7px;
background: rgba(22, 27, 46, 0.8);
backdrop-filter: blur(10px);
border-top: 1px solid var(--aurora-border);
padding: 11px 15px;
flex-shrink: 0;
}
.aurora-composer-icon {
width: 36px; height: 36px;
border-radius: 10px;
background: transparent;
border: none;
color: var(--aurora-text-muted);
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
transition: all 0.15s;
}
.aurora-composer-icon:hover {
background: rgba(255, 255, 255, 0.06);
color: var(--aurora-primary);
}
.aurora-composer-input {
flex: 1;
background: transparent;
border: none;
color: var(--aurora-text);
font-size: 13.5px;
padding: 6px 5px;
font-family: 'Cairo', sans-serif;
}
.aurora-composer-send {
width: 38px; height: 38px;
border-radius: 50%;
background: var(--aurora-surface);
border: none;
color: var(--aurora-text-dim);
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
}
.aurora-composer-send.active {
background: var(--aurora-primary-grad);
color: white;
box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}
.aurora-composer-send.active:hover {
transform: scale(1.05);
}

.aurora-recording-bar {
display: flex;
align-items: center;
gap: 12px;
width: 100%;
padding: 4px 6px;
}
.aurora-rec-cancel {
width: 38px; height: 38px;
border-radius: 10px;
background: rgba(239, 68, 68, 0.1);
border: none;
color: var(--aurora-danger);
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
}
.aurora-rec-info {
flex: 1;
display: flex;
align-items: center;
gap: 9px;
justify-content: center;
}
.aurora-rec-dot {
width: 10px; height: 10px;
border-radius: 50%;
background: var(--aurora-danger);
animation: auroraRecPulse 1s ease-in-out infinite;
}
@keyframes auroraRecPulse {
0%, 100% { opacity: 1; transform: scale(1); }
50% { opacity: 0.4; transform: scale(0.8); }
}
.aurora-rec-time {
font-size: 15px;
font-weight: 800;
color: var(--aurora-text);
font-family: monospace;
}
.aurora-rec-label {
font-size: 12px;
color: var(--aurora-text-muted);
}
.aurora-rec-send {
width: 40px; height: 40px;
border-radius: 50%;
background: var(--aurora-primary-grad);
border: none;
color: white;
display: flex;
align-items: center;
justify-content: center;
cursor: pointer;
box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
}

/* ═══ Empty States ═══ */
.aurora-empty-state {
display: flex;
flex-direction: column;
align-items: center;
gap: 12px;
padding: 50px 20px;
color: var(--aurora-text-dim);
font-size: 13.5px;
font-weight: 500;
text-align: center;
}
.aurora-empty-state.large { flex: 1; justify-content: center; }
.aurora-empty-state.small { padding: 30px 20px; }
.aurora-empty-state.success svg { color: var(--aurora-success); }
.aurora-empty-state svg { color: var(--aurora-text-dim); }
.aurora-empty-icon {
width: 70px; height: 70px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
margin-bottom: 4px;
}
.aurora-empty-icon.fb {
background: rgba(24, 119, 242, 0.12);
color: #1877F2;
}
.aurora-empty-title {
font-size: 16px;
font-weight: 700;
color: var(--aurora-text-muted);
margin-bottom: 5px;
}
.aurora-empty-sub {
font-size: 12.5px;
color: var(--aurora-text-dim);
}

.aurora-loading {
display: flex;
align-items: center;
justify-content: center;
flex: 1;
gap: 10px;
color: var(--aurora-text-dim);
font-size: 13px;
}
.aurora-spin { animation: auroraSpin 1s linear infinite; }
@keyframes auroraSpin { to { transform: rotate(360deg); } }

/* ═══ Charts ═══ */
.aurora-chart-card {
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-lg);
padding: 18px;
margin-bottom: 14px;
box-shadow: var(--aurora-shadow-sm);
}
.aurora-chart-title {
font-size: 14px;
font-weight: 800;
color: var(--aurora-text);
margin: 0 0 14px;
}

.aurora-bar-chart {
display: flex;
flex-direction: column;
gap: 13px;
}
.aurora-bar-row {
display: grid;
grid-template-columns: 170px 1fr 110px;
gap: 12px;
align-items: center;
}
.aurora-bar-label {
display: flex;
align-items: center;
gap: 8px;
font-size: 12.5px;
color: var(--aurora-text-muted);
overflow: hidden;
white-space: nowrap;
text-overflow: ellipsis;
}
.aurora-bar-track {
height: 6px;
background: var(--aurora-surface);
border-radius: var(--aurora-r-full);
overflow: hidden;
}
.aurora-bar-fill {
height: 100%;
background: var(--aurora-primary-grad);
border-radius: var(--aurora-r-full);
transition: width 0.5s var(--aurora-ease);
box-shadow: 0 0 10px rgba(99, 102, 241, 0.4);
}
.aurora-bar-value {
font-size: 12px;
font-weight: 700;
color: var(--aurora-primary);
text-align: left;
}

.aurora-stats-grid-2 {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 14px;
margin-bottom: 14px;
}

.aurora-donut-wrap {
display: flex;
justify-content: center;
padding: 10px 0;
}
.aurora-donut {
display: flex;
align-items: center;
gap: 26px;
}
.aurora-donut-legend {
display: flex;
flex-direction: column;
gap: 11px;
}
.aurora-donut-legend-item {
display: flex;
align-items: center;
gap: 9px;
font-size: 12px;
color: var(--aurora-text-muted);
}
.aurora-donut-legend-dot {
width: 11px; height: 11px;
border-radius: 3px;
}
.aurora-donut-legend-value {
font-size: 12px;
font-weight: 700;
color: var(--aurora-text);
margin-right: auto;
}

.aurora-page-stats {
display: flex;
flex-direction: column;
gap: 14px;
margin-top: 9px;
}
.aurora-page-stat-row {
display: flex;
justify-content: space-between;
align-items: center;
}
.aurora-page-stat-info {
display: flex;
align-items: center;
gap: 10px;
}
.aurora-page-stat-avatar {
font-size: 22px;
}
.aurora-page-stat-name {
font-size: 13px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-page-stat-count {
font-size: 11px;
color: var(--aurora-text-dim);
}
.aurora-page-stat-badge {
background: var(--aurora-surface);
padding: 5px 10px;
border-radius: var(--aurora-r-full);
font-size: 11px;
font-weight: 700;
color: var(--aurora-text-muted);
border: 1px solid var(--aurora-border);
}

.aurora-top-areas {
display: flex;
flex-direction: column;
gap: 11px;
margin-top: 9px;
}
.aurora-top-area-row {
display: flex;
align-items: center;
justify-content: space-between;
gap: 9px;
}
.aurora-top-area-info {
display: flex;
align-items: center;
gap: 11px;
min-width: 0;
}
.aurora-top-area-rank {
width: 24px; height: 24px;
border-radius: 7px;
flex-shrink: 0;
background: rgba(255, 255, 255, 0.05);
color: var(--aurora-text-muted);
font-size: 11px;
font-weight: 800;
display: flex;
align-items: center;
justify-content: center;
}
.aurora-top-area-rank.top {
background: var(--aurora-primary-grad);
color: white;
box-shadow: 0 2px 8px rgba(99, 102, 241, 0.3);
}
.aurora-top-area-name {
font-size: 12.5px;
color: var(--aurora-text);
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}
.aurora-top-area-count {
font-size: 12px;
font-weight: 700;
color: var(--aurora-primary);
flex-shrink: 0;
}

.aurora-stats-bottom-btns {
display: flex;
gap: 9px;
margin-top: 14px;
}
.aurora-stats-btn {
display: flex;
align-items: center;
justify-content: center;
gap: 7px;
padding: 11px;
border-radius: var(--aurora-r-md);
font-size: 13px;
font-weight: 700;
border: none;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
}
.aurora-stats-btn.ghost {
flex: 1;
background: var(--aurora-surface);
border: 1px solid var(--aurora-border);
color: var(--aurora-text-muted);
}
.aurora-stats-btn.ghost:hover {
background: var(--aurora-surface-2);
color: var(--aurora-text);
}
.aurora-stats-btn.primary {
flex: 1.4;
background: var(--aurora-primary-grad);
color: white;
box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
}

.aurora-summary-row {
display: flex;
justify-content: space-between;
align-items: center;
gap: 12px;
padding: 11px 13px;
border-radius: var(--aurora-r-md);
background: var(--aurora-surface);
border: 1px solid var(--aurora-border);
margin-bottom: 7px;
transition: all 0.15s;
}
.aurora-summary-row.clickable { cursor: pointer; }
.aurora-summary-row.clickable:hover {
background: var(--aurora-surface-2);
border-color: var(--aurora-border-strong);
}
.aurora-summary-row.sub {
background: transparent;
border: none;
padding: 5px 16px;
margin-bottom: 2px;
}
.aurora-summary-label {
font-size: 13px;
font-weight: 600;
display: flex;
align-items: center;
gap: 5px;
}
.aurora-summary-row:not(.sub) .aurora-summary-label { color: var(--aurora-text); }
.aurora-summary-row.sub .aurora-summary-label { color: var(--aurora-text-muted); }
.aurora-summary-value {
font-size: 17px;
font-weight: 800;
}
.aurora-summary-hint {
font-size: 11px;
color: var(--aurora-text-dim);
text-align: center;
margin-top: 10px;
}

.aurora-best-seller-row {
display: flex;
align-items: center;
gap: 11px;
margin-bottom: 12px;
}
.aurora-best-seller-rank {
width: 26px; height: 26px;
border-radius: 8px;
background: rgba(99, 102, 241, 0.12);
color: var(--aurora-primary);
display: flex;
align-items: center;
justify-content: center;
font-size: 12px;
font-weight: 800;
flex-shrink: 0;
}
.aurora-best-seller-info { flex: 1; min-width: 0; }
.aurora-best-seller-type {
font-size: 13px;
font-weight: 700;
color: var(--aurora-text);
margin-bottom: 5px;
overflow-wrap: anywhere;
}
.aurora-best-seller-track {
height: 5px;
background: var(--aurora-surface);
border-radius: var(--aurora-r-full);
overflow: hidden;
}
.aurora-best-seller-fill {
height: 100%;
background: var(--aurora-primary-grad);
border-radius: var(--aurora-r-full);
box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
}
.aurora-best-seller-count {
font-size: 14px;
font-weight: 800;
color: var(--aurora-primary);
min-width: 25px;
text-align: center;
flex-shrink: 0;
}

.aurora-converted-row {
display: flex;
align-items: center;
gap: 11px;
padding: 11px 0;
border-bottom: 1px solid var(--aurora-border);
}
.aurora-converted-info { flex: 1; min-width: 0; }
.aurora-converted-customer {
font-size: 13px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-converted-customer span {
font-size: 11px;
color: var(--aurora-text-dim);
font-weight: 600;
margin-right: 4px;
}
.aurora-converted-sub {
font-size: 11px;
color: var(--aurora-primary);
margin-top: 2px;
}
.aurora-converted-meta {
font-size: 10.5px;
color: var(--aurora-text-muted);
margin-top: 2px;
}
.aurora-converted-total {
font-size: 13px;
font-weight: 800;
color: var(--aurora-primary);
flex-shrink: 0;
}

.aurora-neglected-row {
display: flex;
align-items: center;
gap: 11px;
padding: 11px;
margin-bottom: 6px;
border-radius: var(--aurora-r-md);
background: var(--aurora-surface);
border: 1px solid var(--aurora-border);
cursor: pointer;
transition: all 0.15s;
}
.aurora-neglected-row:hover {
background: var(--aurora-surface-2);
}
.aurora-neglected-row.selected {
background: rgba(99, 102, 241, 0.12);
border-color: rgba(99, 102, 241, 0.35);
}
.aurora-neglected-check {
width: 22px; height: 22px;
border-radius: 7px;
border: 1.5px solid var(--aurora-border);
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;
color: white;
transition: all 0.15s;
}
.aurora-neglected-check.on {
background: var(--aurora-primary-grad);
border-color: var(--aurora-primary);
}
.aurora-neglected-info { flex: 1; min-width: 0; }

/* ═══ Pages ═══ */
.aurora-alert {
display: flex;
align-items: flex-start;
gap: 10px;
margin-bottom: 16px;
padding: 13px 15px;
border-radius: var(--aurora-r-md);
font-size: 13px;
line-height: 1.6;
}
.aurora-alert.error {
background: rgba(239, 68, 68, 0.08);
border: 1px solid rgba(239, 68, 68, 0.25);
color: var(--aurora-danger);
}
.aurora-alert.error svg { flex-shrink: 0; margin-top: 2px; }
.aurora-alert.info {
background: rgba(99, 102, 241, 0.08);
border: 1px solid rgba(99, 102, 241, 0.22);
color: var(--aurora-primary);
}
.aurora-alert.warn {
background: rgba(239, 68, 68, 0.06);
border: 1px solid rgba(239, 68, 68, 0.22);
border-radius: var(--aurora-r-md);
padding: 14px;
margin-bottom: 16px;
color: var(--aurora-text);
font-size: 12px;
}
.aurora-alert-title {
color: var(--aurora-danger);
font-weight: 800;
margin-bottom: 8px;
display: flex;
align-items: center;
gap: 6px;
}

.aurora-candidates {
margin-bottom: 22px;
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border: 1px solid rgba(99, 102, 241, 0.25);
border-radius: var(--aurora-r-lg);
padding: 17px;
}
.aurora-candidates-title {
font-size: 13px;
font-weight: 800;
color: var(--aurora-text);
margin-bottom: 13px;
display: flex;
align-items: center;
gap: 8px;
}
.aurora-candidates-title svg { color: var(--aurora-primary); }
.aurora-candidate-row {
display: flex;
align-items: center;
gap: 13px;
padding: 11px 0;
border-bottom: 1px solid var(--aurora-border);
}
.aurora-candidate-row:last-child { border-bottom: none; }
.aurora-candidate-avatar {
width: 46px; height: 46px;
border-radius: 50%;
object-fit: cover;
flex-shrink: 0;
}
.aurora-candidate-avatar.fb {
background: linear-gradient(135deg, #1877F2, #0D5FBF);
display: flex;
align-items: center;
justify-content: center;
color: white;
}
.aurora-candidate-info { flex: 1; min-width: 0; }
.aurora-candidate-name {
font-size: 14px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-candidate-id {
font-size: 10.5px;
color: var(--aurora-text-dim);
margin-top: 2px;
font-family: monospace;
}

.aurora-pages-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
gap: 16px;
}
.aurora-page-card {
position: relative;
overflow: hidden;
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-lg);
box-shadow: var(--aurora-shadow-sm);
transition: all 0.25s var(--aurora-ease);
}
.aurora-page-card:hover {
transform: translateY(-3px);
border-color: rgba(99, 102, 241, 0.3);
box-shadow: var(--aurora-shadow-md);
}
.aurora-page-card.connected {
border-color: rgba(16, 185, 129, 0.25);
}
.aurora-page-card-top {
position: absolute;
top: 0; right: 0; left: 0;
height: 3px;
background: linear-gradient(90deg, transparent, var(--aurora-primary), transparent);
opacity: 0.7;
}
.aurora-page-card.connected .aurora-page-card-top {
background: linear-gradient(90deg, transparent, var(--aurora-success), transparent);
}
.aurora-page-card-header {
padding: 19px 17px 15px;
display: flex;
align-items: center;
gap: 14px;
}
.aurora-page-avatar-wrap {
position: relative;
flex-shrink: 0;
}
.aurora-page-avatar {
width: 58px; height: 58px;
border-radius: 16px;
background: linear-gradient(135deg, #1877F2, #0D5FBF);
display: flex;
align-items: center;
justify-content: center;
font-size: 26px;
color: white;
border: 2px solid rgba(24, 119, 242, 0.3);
box-shadow: 0 4px 14px rgba(24, 119, 242, 0.3);
}
.aurora-page-status-dot {
position: absolute;
bottom: -2px; left: -2px;
width: 17px; height: 17px;
border-radius: 50%;
background: var(--aurora-text-dim);
border: 2.5px solid var(--aurora-bg-elev);
}
.aurora-page-status-dot.on {
background: var(--aurora-success);
animation: auroraStatusPulse 2s var(--aurora-ease) infinite;
}
@keyframes auroraStatusPulse {
0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
}
.aurora-page-info { flex: 1; min-width: 0; }
.aurora-page-name {
font-size: 15px;
font-weight: 800;
color: var(--aurora-text);
margin-bottom: 3px;
white-space: nowrap;
overflow: hidden;
text-overflow: ellipsis;
}
.aurora-page-id {
display: flex;
align-items: center;
gap: 5px;
font-size: 10.5px;
color: var(--aurora-text-dim);
font-family: monospace;
}
.aurora-page-status-pill {
display: inline-flex;
align-items: center;
gap: 5px;
margin-top: 6px;
padding: 3px 10px;
border-radius: var(--aurora-r-full);
font-size: 10.5px;
font-weight: 700;
background: rgba(100, 116, 139, 0.15);
color: var(--aurora-text-muted);
}
.aurora-page-status-pill.on {
background: rgba(16, 185, 129, 0.12);
color: var(--aurora-success);
}
.aurora-page-status-dot-small {
width: 6px; height: 6px;
border-radius: 50%;
background: currentColor;
flex-shrink: 0;
}
.aurora-page-card-divider {
height: 1px;
background: var(--aurora-border);
margin: 0 17px;
}
.aurora-page-card-actions {
padding: 13px 17px;
display: flex;
flex-direction: column;
gap: 9px;
}
.aurora-page-action-btn {
width: 100%;
display: flex;
align-items: center;
justify-content: center;
gap: 8px;
padding: 10px;
border-radius: var(--aurora-r-md);
font-size: 12.5px;
font-weight: 700;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
border: 1px solid;
background: transparent;
}
.aurora-page-action-btn.primary {
background: rgba(99, 102, 241, 0.1);
border-color: rgba(99, 102, 241, 0.25);
color: var(--aurora-primary);
}
.aurora-page-action-btn.primary:hover {
background: rgba(99, 102, 241, 0.18);
}
.aurora-page-action-btn.success {
background: rgba(16, 185, 129, 0.1);
border-color: rgba(16, 185, 129, 0.25);
color: var(--aurora-success);
}
.aurora-page-action-btn.wa {
background: rgba(255, 255, 255, 0.04);
border-color: var(--aurora-border);
color: var(--aurora-text-muted);
}
.aurora-page-action-btn.wa.on {
background: rgba(37, 211, 102, 0.1);
border-color: rgba(37, 211, 102, 0.3);
color: #25D366;
}

.aurora-wa-dot {
color: #25D366;
margin-left: 7px;
}
.aurora-wa-help {
background: rgba(37, 211, 102, 0.08);
border: 1px solid rgba(37, 211, 102, 0.22);
border-radius: var(--aurora-r-md);
padding: 11px 14px;
margin-bottom: 14px;
font-size: 12px;
color: #25D366;
line-height: 1.7;
}
.aurora-wa-help-title {
font-weight: 700;
margin-bottom: 4px;
}
.aurora-webhook-row {
display: flex;
gap: 8px;
align-items: center;
}
.aurora-webhook-row input {
flex: 1;
font-size: 10px;
}

/* ═══ Users ═══ */
.aurora-users-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
gap: 12px;
}
.aurora-user-card {
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-lg);
padding: 15px;
box-shadow: var(--aurora-shadow-sm);
transition: all 0.25s var(--aurora-ease);
}
.aurora-user-card:hover {
transform: translateY(-2px);
border-color: rgba(99, 102, 241, 0.3);
box-shadow: var(--aurora-shadow-md);
}
.aurora-user-card.inactive { opacity: 0.55; }
.aurora-user-card-top {
display: flex;
align-items: center;
gap: 11px;
margin-bottom: 11px;
}
.aurora-user-card-avatar {
width: 42px; height: 42px;
border-radius: 50%;
display: flex;
align-items: center;
justify-content: center;
font-weight: 800;
font-size: 15px;
flex-shrink: 0;
background: var(--aurora-surface);
color: var(--aurora-primary);
}
.aurora-user-card-avatar.admin {
background: var(--aurora-primary-grad);
color: white;
box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
}
.aurora-user-card-info { flex: 1; min-width: 0; }
.aurora-user-card-name {
font-size: 13.5px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-user-card-role {
display: flex;
align-items: center;
gap: 5px;
font-size: 10.5px;
color: var(--aurora-text-muted);
margin-top: 2px;
}
.aurora-active-dot {
width: 8px; height: 8px;
border-radius: 50%;
flex-shrink: 0;
background: var(--aurora-text-dim);
}
.aurora-active-dot.on {
background: var(--aurora-success);
box-shadow: 0 0 8px rgba(16, 185, 129, 0.6);
}
.aurora-user-card-meta {
display: flex;
gap: 7px;
flex-wrap: wrap;
margin-bottom: 11px;
}
.aurora-code-tag {
font-size: 10.5px;
color: var(--aurora-text-muted);
background: var(--aurora-surface);
border: 1px solid var(--aurora-border);
border-radius: 7px;
padding: 3px 9px;
font-family: monospace;
}
.aurora-user-perms {
display: flex;
flex-wrap: wrap;
gap: 5px;
margin-bottom: 11px;
padding-bottom: 11px;
border-bottom: 1px solid var(--aurora-border);
}
.aurora-perm-tag {
background: rgba(99, 102, 241, 0.1);
color: var(--aurora-primary);
font-size: 10px;
font-weight: 600;
padding: 3px 8px;
border-radius: 6px;
border: 1px solid rgba(99, 102, 241, 0.2);
}
.aurora-user-card-actions {
display: flex;
gap: 6px;
}
.aurora-user-action-btn {
flex: 1;
display: flex;
align-items: center;
justify-content: center;
gap: 5px;
padding: 8px;
background: var(--aurora-surface);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-sm);
color: var(--aurora-text-muted);
font-size: 11px;
font-weight: 600;
cursor: pointer;
transition: all 0.15s;
}
.aurora-user-action-btn:hover {
background: var(--aurora-surface-2);
color: var(--aurora-text);
}
.aurora-user-action-btn.danger {
color: var(--aurora-danger);
}
.aurora-user-action-btn.danger:hover {
background: rgba(239, 68, 68, 0.1);
}

.aurora-prep-time {
display: flex;
align-items: center;
gap: 6px;
font-size: 11.5px;
color: var(--aurora-text-dim);
margin: 0 14px 9px;
padding-top: 2px;
}

/* ═══ Notifications ═══ */
.aurora-notif-bell-wrap {
position: fixed;
top: 13px; left: 13px;
z-index: 9999;
}
.aurora-notif-bell {
position: relative;
width: 44px; height: 44px;
border-radius: 50%;
background: rgba(22, 27, 46, 0.95);
backdrop-filter: blur(10px);
border: 1px solid rgba(99, 102, 241, 0.3);
color: var(--aurora-text);
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
box-shadow: var(--aurora-shadow-md);
transition: all 0.2s var(--aurora-ease);
}
.aurora-notif-bell:hover {
transform: translateY(-2px);
box-shadow: var(--aurora-shadow-lg);
}
.aurora-notif-bell.active {
animation: auroraBellGlow 1.6s var(--aurora-ease) infinite;
}
@keyframes auroraBellGlow {
0%, 100% { box-shadow: 0 4px 14px rgba(0, 0, 0, 0.4); }
50% { box-shadow: 0 4px 22px rgba(239, 68, 68, 0.5); }
}
.aurora-notif-count {
position: absolute;
top: 6px; right: 6px;
min-width: 17px; height: 17px;
padding: 0 4px;
border-radius: 9px;
background: var(--aurora-danger);
color: white;
font-size: 10px;
font-weight: 800;
display: flex;
align-items: center;
justify-content: center;
box-shadow: 0 2px 6px rgba(239, 68, 68, 0.4);
}
.aurora-notif-panel {
position: absolute;
top: 52px; left: 0;
width: 330px;
max-height: 430px;
overflow-y: auto;
background: rgba(22, 27, 46, 0.98);
backdrop-filter: blur(20px);
border: 1px solid var(--aurora-border-strong);
border-radius: var(--aurora-r-lg);
box-shadow: var(--aurora-shadow-lg);
padding: 9px;
animation: auroraFadeUp 0.2s var(--aurora-ease-bounce);
}
.aurora-notif-header {
display: flex;
justify-content: space-between;
align-items: center;
padding: 7px 9px 11px;
}
.aurora-notif-header span {
font-size: 14px;
font-weight: 800;
color: var(--aurora-text);
}
.aurora-notif-header button {
font-size: 11px;
color: var(--aurora-text-dim);
background: none;
border: none;
cursor: pointer;
}
.aurora-notif-header button:hover { color: var(--aurora-text); }
.aurora-notif-empty {
padding: 26px 13px;
text-align: center;
color: var(--aurora-text-dim);
font-size: 12.5px;
}
.aurora-notif-item {
padding: 11px 13px;
margin-bottom: 6px;
border-radius: var(--aurora-r-md);
border: 1px solid;
}
.aurora-notif-item.delivered {
background: rgba(16, 185, 129, 0.07);
border-color: rgba(16, 185, 129, 0.2);
}
.aurora-notif-item.returned {
background: rgba(239, 68, 68, 0.08);
border-color: rgba(239, 68, 68, 0.25);
}
.aurora-notif-title {
font-size: 13px;
font-weight: 700;
margin-bottom: 3px;
}
.aurora-notif-item.delivered .aurora-notif-title { color: var(--aurora-success); }
.aurora-notif-item.returned .aurora-notif-title { color: var(--aurora-danger); }
.aurora-notif-body {
font-size: 11.5px;
color: var(--aurora-text-muted);
line-height: 1.5;
}
.aurora-notif-time {
font-size: 10px;
color: var(--aurora-text-dim);
margin-top: 4px;
}

/* ═══ Prep Worker ═══ */
.aurora-prep-header {
display: flex;
align-items: center;
justify-content: space-between;
padding: 14px 17px;
border-bottom: 1px solid var(--aurora-border);
background: rgba(22, 27, 46, 0.7);
backdrop-filter: blur(10px);
}
.aurora-prep-brand {
display: flex;
align-items: center;
gap: 10px;
}
.aurora-prep-icon {
width: 38px; height: 38px;
border-radius: 11px;
background: rgba(245, 158, 11, 0.15);
color: var(--aurora-warn);
display: flex;
align-items: center;
justify-content: center;
}
.aurora-prep-title {
font-size: 15px;
font-weight: 800;
color: var(--aurora-text);
}
.aurora-prep-name {
font-size: 11px;
color: var(--aurora-text-muted);
}
.aurora-prep-counter {
padding: 13px 17px 5px;
display: flex;
align-items: center;
gap: 9px;
}
.aurora-prep-counter > span:first-child {
font-size: 13px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-prep-count {
min-width: 24px; height: 24px;
padding: 0 8px;
border-radius: var(--aurora-r-full);
background: rgba(255, 255, 255, 0.05);
color: var(--aurora-text-dim);
font-size: 12px;
font-weight: 800;
display: flex;
align-items: center;
justify-content: center;
}
.aurora-prep-count.has {
background: rgba(245, 158, 11, 0.18);
color: var(--aurora-warn);
}
.aurora-prep-content {
padding: 9px 17px 26px;
overflow-y: auto;
flex: 1;
}

.aurora-prep-card-body { padding: 15px; }
.aurora-prep-card-head {
display: flex;
align-items: center;
gap: 11px;
margin-bottom: 13px;
}
.aurora-prep-card-icon {
width: 42px; height: 42px;
border-radius: 12px;
background: rgba(99, 102, 241, 0.12);
color: var(--aurora-primary);
display: flex;
align-items: center;
justify-content: center;
flex-shrink: 0;
}
.aurora-prep-card-info { flex: 1; min-width: 0; }
.aurora-prep-card-customer {
font-size: 14px;
font-weight: 800;
color: var(--aurora-text);
}
.aurora-prep-card-customer span {
font-size: 11.5px;
color: var(--aurora-text-dim);
font-weight: 600;
margin-right: 4px;
}
.aurora-prep-card-loc {
font-size: 11.5px;
color: var(--aurora-text-muted);
}
.aurora-prep-items {
background: rgba(255, 255, 255, 0.03);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-md);
padding: 11px 13px;
margin-bottom: 13px;
}
.aurora-prep-items-label {
font-size: 10.5px;
color: var(--aurora-text-dim);
font-weight: 700;
margin-bottom: 5px;
}
.aurora-prep-items > div:last-child {
font-size: 13px;
color: var(--aurora-text);
line-height: 1.6;
white-space: pre-wrap;
}
.aurora-prep-type {
font-size: 12px;
color: var(--aurora-text-muted);
margin-bottom: 13px;
}
.aurora-prep-type span {
color: var(--aurora-text);
font-weight: 600;
}
.aurora-prep-note {
background: rgba(245, 158, 11, 0.1);
border: 1px solid rgba(245, 158, 11, 0.28);
border-radius: var(--aurora-r-md);
padding: 10px 13px;
margin-bottom: 13px;
}
.aurora-prep-note-title {
font-size: 11px;
color: var(--aurora-warn);
font-weight: 700;
margin-bottom: 3px;
}
.aurora-prep-note > div:last-child {
font-size: 12.5px;
color: var(--aurora-text);
}
.aurora-prep-actions {
display: flex;
gap: 9px;
}
.aurora-prep-btn {
flex: 1;
padding: 13px;
border-radius: var(--aurora-r-md);
font-size: 13.5px;
font-weight: 800;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
gap: 7px;
border: 1.5px solid;
transition: all 0.2s var(--aurora-ease);
}
.aurora-prep-btn.done {
background: rgba(16, 185, 129, 0.14);
border-color: rgba(16, 185, 129, 0.4);
color: var(--aurora-success);
}
.aurora-prep-btn.done:hover {
background: rgba(16, 185, 129, 0.22);
transform: translateY(-1px);
}
.aurora-prep-btn.reject {
background: rgba(239, 68, 68, 0.1);
border-color: rgba(239, 68, 68, 0.35);
color: var(--aurora-danger);
}
.aurora-prep-btn.reject:hover {
background: rgba(239, 68, 68, 0.18);
transform: translateY(-1px);
}

/* ═══ Warehouse ═══ */
.aurora-wh-layout {
display: flex;
flex-direction: row;
height: 100%;
direction: rtl;
}
.aurora-wh-layout.mobile { flex-direction: column; }
.aurora-wh-sidebar {
width: 210px;
flex-shrink: 0;
background: linear-gradient(180deg, rgba(22, 27, 46, 0.8), rgba(17, 22, 38, 0.8));
backdrop-filter: blur(10px);
border-left: 1px solid var(--aurora-border);
display: flex;
flex-direction: column;
padding: 15px 11px;
gap: 4px;
overflow-y: auto;
}
.aurora-wh-sidebar-title {
font-size: 13px;
font-weight: 800;
color: var(--aurora-text-muted);
padding: 0 7px 11px;
border-bottom: 1px solid var(--aurora-border);
margin-bottom: 7px;
}
.aurora-wh-sidebar-alerts {
background: rgba(239, 68, 68, 0.08);
border: 1px solid rgba(239, 68, 68, 0.2);
border-radius: var(--aurora-r-sm);
padding: 8px 11px;
margin-bottom: 9px;
font-size: 11px;
}
.aurora-wh-sidebar-alerts > div:first-child {
color: var(--aurora-warn);
margin-bottom: 3px;
}
.aurora-wh-sidebar-alerts > div:last-child {
color: var(--aurora-danger);
}
.aurora-wh-nav-item {
display: flex;
align-items: center;
gap: 9px;
width: 100%;
padding: 10px 11px;
border-radius: var(--aurora-r-md);
background: transparent;
border: 1px solid transparent;
color: var(--aurora-text-muted);
font-size: 12.5px;
font-weight: 600;
cursor: pointer;
transition: all 0.2s var(--aurora-ease);
text-align: right;
}
.aurora-wh-nav-item:hover {
background: rgba(255, 255, 255, 0.04);
color: var(--aurora-text);
}
.aurora-wh-nav-item.active {
background: rgba(99, 102, 241, 0.15);
border-color: rgba(99, 102, 241, 0.3);
color: var(--aurora-primary);
font-weight: 700;
}

.aurora-wh-mobile-tabs {
display: flex;
overflow-x: auto;
background: rgba(22, 27, 46, 0.8);
backdrop-filter: blur(10px);
border-bottom: 1px solid var(--aurora-border);
padding: 9px 11px;
gap: 7px;
flex-shrink: 0;
-webkit-overflow-scrolling: touch;
}
.aurora-wh-mobile-tab {
display: flex;
flex-direction: column;
align-items: center;
gap: 4px;
padding: 8px 13px;
border-radius: var(--aurora-r-md);
background: rgba(255, 255, 255, 0.04);
border: 1px solid transparent;
color: var(--aurora-text-muted);
font-size: 10px;
font-weight: 600;
cursor: pointer;
flex-shrink: 0;
min-width: 60px;
transition: all 0.15s;
}
.aurora-wh-mobile-tab.active {
background: rgba(99, 102, 241, 0.18);
border-color: rgba(99, 102, 241, 0.4);
color: var(--aurora-primary);
font-weight: 800;
}

.aurora-wh-content {
flex: 1;
overflow-y: auto;
padding: 20px;
}
.aurora-wh-layout.mobile .aurora-wh-content {
padding: 15px 13px;
}

.aurora-wh-header {
display: flex;
justify-content: space-between;
align-items: flex-start;
margin-bottom: 16px;
flex-wrap: wrap;
gap: 9px;
}
.aurora-wh-header h3 {
margin: 0;
font-size: 18px;
font-weight: 800;
color: var(--aurora-text);
}
.aurora-wh-header-actions {
display: flex;
gap: 8px;
}

.aurora-wh-stats-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
gap: 12px;
margin-bottom: 19px;
}
.aurora-wh-stats-grid.small {
grid-template-columns: 1fr 1fr 1fr;
}
.aurora-wh-stat {
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-md);
padding: 14px 16px;
box-shadow: var(--aurora-shadow-sm);
position: relative;
overflow: hidden;
}
.aurora-wh-stat::before {
content: '';
position: absolute;
top: 0; right: 0;
width: 100%; height: 2px;
background: linear-gradient(90deg, transparent, var(--accent, var(--aurora-primary)), transparent);
opacity: 0.5;
}
.aurora-wh-stat > svg {
color: var(--accent, var(--aurora-primary));
margin-bottom: 9px;
}
.aurora-wh-stat-value {
font-size: 18px;
font-weight: 800;
color: var(--accent, var(--aurora-primary));
}
.aurora-wh-stat-label {
font-size: 11px;
color: var(--aurora-text-dim);
margin-top: 3px;
}
.aurora-wh-stat.small {
padding: 13px 15px;
text-align: center;
}
.aurora-wh-stat.danger { --accent: var(--aurora-danger); }
.aurora-wh-stat.warn { --accent: var(--aurora-warn); }

.aurora-wh-section {
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-md);
padding: 15px;
margin-bottom: 15px;
}
.aurora-wh-section.danger {
border-color: rgba(239, 68, 68, 0.25);
}
.aurora-wh-section-title {
font-size: 14px;
font-weight: 800;
color: var(--aurora-text);
margin: 0 0 12px;
}
.aurora-wh-section.danger .aurora-wh-section-title {
color: var(--aurora-danger);
}

.aurora-wh-low-item {
display: flex;
justify-content: space-between;
align-items: center;
padding: 9px 11px;
background: rgba(239, 68, 68, 0.06);
border-radius: var(--aurora-r-sm);
margin-bottom: 7px;
border: 1px solid rgba(239, 68, 68, 0.18);
}
.aurora-wh-low-name {
font-size: 12.5px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-wh-low-loc {
font-size: 11px;
color: var(--aurora-text-dim);
margin-top: 2px;
}
.aurora-wh-low-qty {
font-size: 22px;
font-weight: 800;
color: var(--aurora-warn);
}
.aurora-wh-low-qty.zero {
color: var(--aurora-danger);
}

.aurora-wh-sale-row {
display: flex;
justify-content: space-between;
padding: 9px 0;
border-bottom: 1px solid var(--aurora-border);
}
.aurora-wh-sale-row:last-child { border-bottom: none; }
.aurora-wh-sale-name {
font-size: 12.5px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-wh-sale-meta {
font-size: 11px;
color: var(--aurora-text-dim);
margin-top: 2px;
}
.aurora-wh-sale-total {
font-size: 13px;
font-weight: 800;
color: var(--aurora-success);
}

.aurora-wh-filters {
display: flex;
gap: 8px;
margin-bottom: 13px;
flex-wrap: wrap;
}
.aurora-wh-type-chip {
padding: 7px 12px;
border-radius: var(--aurora-r-full);
border: 1px solid var(--aurora-border);
background: transparent;
color: var(--aurora-text-muted);
font-size: 11.5px;
font-weight: 700;
cursor: pointer;
transition: all 0.15s;
}
.aurora-wh-type-chip:hover {
background: rgba(255, 255, 255, 0.04);
}
.aurora-wh-type-chip.active {
background: rgba(99, 102, 241, 0.15);
border-color: var(--aurora-primary);
color: var(--aurora-primary);
}

.aurora-wh-list {
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-md);
overflow: hidden;
}
.aurora-wh-product-row {
display: flex;
align-items: center;
gap: 12px;
padding: 12px 15px;
border-bottom: 1px solid var(--aurora-border);
transition: background 0.15s;
}
.aurora-wh-product-row:last-child { border-bottom: none; }
.aurora-wh-product-row:hover {
background: rgba(255, 255, 255, 0.02);
}
.aurora-wh-product-icon {
width: 44px; height: 44px;
border-radius: 11px;
display: flex;
align-items: center;
justify-content: center;
font-size: 19px;
flex-shrink: 0;
}
.aurora-wh-product-info { flex: 1; min-width: 0; }
.aurora-wh-product-name {
font-size: 13px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-wh-product-tags {
display: flex;
gap: 7px;
margin-top: 4px;
flex-wrap: wrap;
}
.aurora-wh-product-tag {
font-size: 11px;
padding: 2px 8px;
border-radius: var(--aurora-r-full);
font-weight: 600;
}
.aurora-wh-product-loc, .aurora-wh-product-price {
font-size: 11px;
color: var(--aurora-text-dim);
}
.aurora-wh-product-qty-wrap {
text-align: center;
min-width: 48px;
}
.aurora-wh-product-qty {
font-size: 21px;
font-weight: 800;
color: var(--aurora-success);
}
.aurora-wh-product-qty.low { color: var(--aurora-danger); }
.aurora-wh-product-qty-label {
font-size: 10px;
color: var(--aurora-text-dim);
}
.aurora-wh-product-qty-warn {
font-size: 10px;
color: var(--aurora-danger);
font-weight: 700;
}
.aurora-wh-product-actions {
display: flex;
gap: 6px;
}

.aurora-info-box {
background: rgba(99, 102, 241, 0.08);
border: 1px solid rgba(99, 102, 241, 0.2);
border-radius: var(--aurora-r-sm);
padding: 12px 14px;
margin-bottom: 14px;
font-size: 12px;
color: var(--aurora-primary);
}

.aurora-wh-total-preview {
background: rgba(16, 185, 129, 0.08);
border: 1px solid rgba(16, 185, 129, 0.25);
border-radius: var(--aurora-r-sm);
padding: 11px 14px;
margin-bottom: 13px;
font-size: 17px;
font-weight: 800;
color: var(--aurora-success);
text-align: center;
}

.aurora-wh-period-chips {
display: flex;
gap: 7px;
margin-bottom: 15px;
flex-wrap: wrap;
}
.aurora-wh-period-chip {
padding: 7px 13px;
border-radius: var(--aurora-r-full);
border: 1px solid var(--aurora-border);
background: transparent;
color: var(--aurora-text-muted);
font-size: 12px;
font-weight: 700;
cursor: pointer;
transition: all 0.15s;
}
.aurora-wh-period-chip:hover {
background: rgba(255, 255, 255, 0.04);
}
.aurora-wh-period-chip.active {
background: rgba(16, 185, 129, 0.14);
border-color: var(--aurora-success);
color: var(--aurora-success);
}

.aurora-wh-suppliers-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
gap: 14px;
}
.aurora-wh-supplier-card {
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-lg);
padding: 16px;
position: relative;
overflow: hidden;
transition: all 0.25s var(--aurora-ease);
}
.aurora-wh-supplier-card:hover {
transform: translateY(-2px);
border-color: rgba(99, 102, 241, 0.3);
}
.aurora-wh-supplier-top {
position: absolute;
top: 0; right: 0; left: 0;
height: 3px;
background: linear-gradient(90deg, transparent, var(--aurora-primary), transparent);
opacity: 0.7;
}
.aurora-wh-supplier-head {
display: flex;
justify-content: space-between;
align-items: flex-start;
margin-bottom: 11px;
}
.aurora-wh-supplier-name {
font-size: 14px;
font-weight: 800;
color: var(--aurora-text);
}
.aurora-wh-supplier-phone {
font-size: 12px;
color: var(--aurora-primary);
margin-top: 3px;
}
.aurora-wh-supplier-addr {
font-size: 12px;
color: var(--aurora-text-dim);
margin-top: 2px;
}
.aurora-wh-supplier-actions {
display: flex;
gap: 6px;
}
.aurora-wh-supplier-products {
background: rgba(99, 102, 241, 0.06);
border: 1px solid rgba(99, 102, 241, 0.15);
border-radius: var(--aurora-r-sm);
padding: 9px 11px;
}
.aurora-wh-supplier-products-title {
font-size: 10.5px;
color: var(--aurora-primary);
font-weight: 700;
margin-bottom: 3px;
}
.aurora-wh-supplier-products > div:last-child {
font-size: 12px;
color: var(--aurora-text-muted);
line-height: 1.5;
}
.aurora-wh-supplier-notes {
font-size: 11.5px;
color: var(--aurora-text-dim);
margin-top: 9px;
}

.aurora-wh-debt-row {
display: flex;
align-items: center;
gap: 12px;
padding: 12px 15px;
border-bottom: 1px solid var(--aurora-border);
transition: background 0.15s;
}
.aurora-wh-debt-row:last-child { border-bottom: none; }
.aurora-wh-debt-row:hover { background: rgba(255, 255, 255, 0.02); }
.aurora-wh-debt-row.urgent {
background: rgba(239, 68, 68, 0.04);
}
.aurora-wh-debt-dot {
width: 9px; height: 9px;
border-radius: 50%;
flex-shrink: 0;
}
.aurora-wh-debt-info { flex: 1; min-width: 0; }
.aurora-wh-debt-name {
font-size: 13px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-wh-debt-tags {
display: flex;
gap: 7px;
margin-top: 4px;
flex-wrap: wrap;
}
.aurora-wh-debt-tag {
font-size: 11px;
padding: 2px 8px;
border-radius: var(--aurora-r-full);
font-weight: 600;
}
.aurora-wh-debt-date {
font-size: 11px;
color: var(--aurora-text-dim);
}
.aurora-wh-debt-date.urgent {
color: var(--aurora-danger);
font-weight: 700;
}
.aurora-wh-debt-paid {
font-size: 11px;
color: var(--aurora-success);
font-weight: 700;
}
.aurora-wh-debt-amount {
font-size: 14px;
font-weight: 800;
color: var(--aurora-danger);
}
.aurora-wh-debt-amount.paid { color: var(--aurora-text-dim); }
.aurora-wh-debt-actions {
display: flex;
gap: 6px;
}

.aurora-wh-employees-grid {
display: grid;
grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
gap: 14px;
}
.aurora-wh-employee-card {
background: rgba(22, 27, 46, 0.6);
backdrop-filter: blur(10px);
border: 1px solid var(--aurora-border);
border-radius: var(--aurora-r-lg);
padding: 16px;
transition: all 0.25s var(--aurora-ease);
}
.aurora-wh-employee-card:hover {
transform: translateY(-2px);
border-color: rgba(139, 92, 246, 0.3);
}
.aurora-wh-employee-head {
display: flex;
justify-content: space-between;
align-items: flex-start;
margin-bottom: 12px;
}
.aurora-wh-employee-avatar {
width: 44px; height: 44px;
border-radius: 50%;
background: linear-gradient(135deg, #8B5CF6, #7C3AED);
display: flex;
align-items: center;
justify-content: center;
font-size: 18px;
font-weight: 800;
color: white;
box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
}
.aurora-wh-employee-info {
display: flex;
gap: 11px;
align-items: center;
flex: 1;
}
.aurora-wh-employee-name {
font-size: 14px;
font-weight: 800;
color: var(--aurora-text);
}
.aurora-wh-employee-role {
font-size: 11.5px;
color: var(--aurora-text-dim);
}
.aurora-wh-employee-actions {
display: flex;
gap: 6px;
}
.aurora-wh-employee-salary {
background: rgba(139, 92, 246, 0.08);
border: 1px solid rgba(139, 92, 246, 0.18);
border-radius: var(--aurora-r-sm);
padding: 10px 13px;
margin-bottom: 11px;
}
.aurora-wh-employee-salary-label {
font-size: 11px;
color: #A78BFA;
margin-bottom: 2px;
}
.aurora-wh-employee-salary-value {
font-size: 18px;
font-weight: 800;
color: #A78BFA;
}
.aurora-wh-employee-phone {
font-size: 12px;
color: var(--aurora-primary);
margin-bottom: 9px;
}
.aurora-wh-employee-pay-btn {
width: 100%;
padding: 9px;
background: rgba(16, 185, 129, 0.1);
border: 1px solid rgba(16, 185, 129, 0.25);
border-radius: var(--aurora-r-sm);
color: var(--aurora-success);
font-size: 12px;
font-weight: 700;
cursor: pointer;
display: flex;
align-items: center;
justify-content: center;
gap: 7px;
transition: all 0.2s var(--aurora-ease);
}
.aurora-wh-employee-pay-btn:hover {
background: rgba(16, 185, 129, 0.18);
}

.aurora-wh-reports-grid {
display: grid;
grid-template-columns: 1fr 1fr;
gap: 14px;
}
.aurora-wh-report-row {
display: flex;
justify-content: space-between;
align-items: center;
padding: 10px 0;
border-bottom: 1px solid var(--aurora-border);
}
.aurora-wh-report-row:last-child { border-bottom: none; }
.aurora-wh-report-info {
display: flex;
align-items: center;
gap: 8px;
}
.aurora-wh-report-icon { font-size: 17px; }
.aurora-wh-report-name {
font-size: 12.5px;
font-weight: 700;
color: var(--aurora-text);
}
.aurora-wh-report-count {
font-size: 11px;
color: var(--aurora-text-dim);
}
.aurora-wh-report-total {
font-size: 13px;
font-weight: 800;
}
.aurora-wh-report-qty {
font-size: 12.5px;
font-weight: 700;
color: var(--aurora-success);
}

/* ═══ City Picker ═══ */
.aurora-city-picker {
position: relative;
}
.aurora-city-dropdown {
position: absolute;
top: 100%;
left: 0; right: 0;
z-index: 50;
background: rgba(22, 27, 46, 0.98);
backdrop-filter: blur(20px);
border: 1px solid rgba(99, 102, 241, 0.3);
border-radius: var(--aurora-r-md);
max-height: 230px;
overflow-y: auto;
margin-top: 3px;
box-shadow: var(--aurora-shadow-lg);
}
.aurora-city-loading {
padding: 11px;
color: var(--aurora-text-dim);
font-size: 12px;
}
.aurora-city-item {
padding: 10px 13px;
font-size: 13px;
color: var(--aurora-text);
cursor: pointer;
border-bottom: 1px solid rgba(255, 255, 255, 0.04);
transition: background 0.12s;
}
.aurora-city-item:hover {
background: rgba(99, 102, 241, 0.12);
}

/* ═══ Loading Screen ═══ */
.aurora-loading-screen {
min-height: 100vh;
display: flex;
align-items: center;
justify-content: center;
background: var(--aurora-bg);
flex-direction: column;
gap: 17px;
color: var(--aurora-primary);
}

.aurora-error-screen {
padding: 30px;
background: var(--aurora-bg);
color: var(--aurora-text);
min-height: 100vh;
font-family: 'Cairo', sans-serif;
direction: rtl;
display: flex;
align-items: center;
justify-content: center;
}
.aurora-error-card {
background: rgba(239, 68, 68, 0.1);
border: 1px solid rgba(239, 68, 68, 0.3);
border-radius: var(--aurora-r-lg);
padding: 22px;
max-width: 600px;
}
.aurora-error-title {
font-size: 18px;
font-weight: 800;
color: var(--aurora-danger);
margin-bottom: 13px;
}
.aurora-error-msg {
font-size: 13px;
color: var(--aurora-warn);
margin-bottom: 9px;
font-family: monospace;
direction: ltr;
}
.aurora-error-stack {
font-size: 11px;
color: var(--aurora-text-dim);
font-family: monospace;
direction: ltr;
white-space: pre-wrap;
}

/* ═══ Print ═══ */
@media print {
body * { visibility: hidden; }
.aurora-print-area, .aurora-print-area * { visibility: visible; }
.aurora-print-area {
position: absolute;
top: 0; right: 0; left: 0;
width: 100%;
display: grid !important;
grid-template-columns: repeat(2, 1fr) !important;
}
.aurora-orders-grid {
display: grid !important;
grid-template-columns: repeat(2, 1fr) !important;
}
}

/* ═══ Responsive ═══ */
@media (max-width: 860px) {
.aurora-app { flex-direction: column !important; }
.aurora-main {
padding: 54px 0 68px !important;
width: 100% !important;
min-height: 100vh !important;
}
.aurora-main.conv {
padding: 54px 0 68px !important;
height: 100vh !important;
min-height: 0 !important;
overflow: hidden !important;
display: flex !important;
flex-direction: column !important;
}
.aurora-conv-fullscreen {
position: static !important;
width: 100% !important;
height: 100% !important;
flex: 1 !important;
overflow: hidden !important;
}
.aurora-conv-list {
max-height: none !important;
height: 100% !important;
width: 100% !important;
max-width: 100% !important;
min-width: 0 !important;
border-left: none !important;
}
.aurora-conv-list.hidden-mobile { display: none !important; }
.aurora-conv-detail.empty { display: none !important; }
.aurora-conv-detail.active-mobile {
position: fixed !important;
top: 0 !important; right: 0 !important;
left: 0 !important; bottom: 0 !important;
z-index: 300 !important;
width: 100% !important;
height: 100dvh !important;
display: flex !important;
flex-direction: column !important;
background: var(--aurora-bg) !important;
animation: auroraSlideIn 0.2s ease !important;
}
@keyframes auroraSlideIn {
from { opacity: 0; transform: translateX(100%); }
to { opacity: 1; transform: translateX(0); }
}
.aurora-back-btn { display: flex !important; }
.aurora-stats-row { grid-template-columns: repeat(2, 1fr) !important; }
.aurora-stats-grid-2 { grid-template-columns: 1fr !important; }
.aurora-view-header { flex-direction: column !important; align-items: flex-start !important; }
.aurora-pages-grid, .aurora-users-grid { grid-template-columns: 1fr !important; }
.aurora-bar-row { grid-template-columns: 1fr !important; gap: 5px !important; }
.aurora-modal { max-width: 96vw !important; }
.aurora-login-card { max-width: 92vw !important; padding: 32px 22px !important; }
.aurora-orders-grid { grid-template-columns: 1fr !important; }
.aurora-wh-reports-grid { grid-template-columns: 1fr !important; }
.aurora-grid-2 { grid-template-columns: 1fr !important; }
.aurora-notif-panel { width: calc(100vw - 26px); }
}

@media (prefers-reduced-motion: reduce) {
*, *::before, *::after {
animation-duration: 0.01ms !important;
animation-iteration-count: 1 !important;
transition-duration: 0.01ms !important;
}
}
`}</style>
);
}
