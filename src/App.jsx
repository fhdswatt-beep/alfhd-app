import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquare, Package, Users, Settings, LogOut, Search,
  Plus, Filter, BarChart3, CheckCircle2, Clock, XCircle,
  Truck, Printer, ChevronDown, X, Shield, ShieldCheck, ShieldOff,
  Eye, EyeOff, Trash2, Edit3, UserPlus, Bell, Facebook,
  ArrowUpRight, ArrowDownRight, Sparkles, Bot, UserCheck,
  Pin, MoreVertical, Phone, MapPin, Calendar, RefreshCw,
  Mic, Send, Image, ArrowRight, StopCircle, Square,
  Image as ImageIcon, FileText, AlertCircle, ChevronUp,
  Download
} from 'lucide-react';

// ──────────────────────────────────────────────
// اتصال Supabase (عبر REST API مباشرة)
// ──────────────────────────────────────────────
const SUPABASE_URL = 'https://wqfuovvebgipiowaarbo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZnVvdnZlYmdpcGlvd2FhcmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTM2ODEsImV4cCI6MjA5NzQ4OTY4MX0.xeQ80kco6TOpbyMnYonzSCBDI3Hn_EKiavKKfC7kLl8';

// ──────────────────────────────────────────────
// إعدادات ربط فيسبوك الحقيقي (OAuth)
// ──────────────────────────────────────────────
const FB_APP_ID = '1011276044687764';
const FB_REDIRECT_URI = 'https://alfhd-app.vercel.app/';
const FB_OAUTH_SCOPE = 'pages_show_list,pages_messaging,pages_manage_metadata,public_profile,business_management';
const FB_EXCHANGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/dynamic-processor`;
const FB_SUBSCRIBE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fb-subscribe-page`;
const FB_SEND_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fb-send-message`;
const ORDER_EXTRACT_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/order-extract-from-image`;
const FB_POLL_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/fb-poll-messages`;
const JENNI_CREATE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/super-function`;

// محافظات العراق بأكواد شركة التوصيل Jenni الرسمية (18 محافظة)
const IRAQ_GOVERNORATES = [
  { code: 'BGD', name: 'بغداد' },
  { code: 'BAS', name: 'البصرة' },
  { code: 'NIN', name: 'نينوى' },
  { code: 'ARB', name: 'أربيل' },
  { code: 'NJF', name: 'النجف' },
  { code: 'KRB', name: 'كربلاء' },
  { code: 'BBL', name: 'بابل' },
  { code: 'DHI', name: 'ذي قار' },
  { code: 'DYL', name: 'ديالى' },
  { code: 'ANB', name: 'الأنبار' },
  { code: 'KRK', name: 'كركوك' },
  { code: 'WST', name: 'واسط' },
  { code: 'SAH', name: 'صلاح الدين' },
  { code: 'QAD', name: 'القادسية' },
  { code: 'MYS', name: 'ميسان' },
  { code: 'MTH', name: 'المثنى' },
  { code: 'DOH', name: 'دهوك' },
  { code: 'SMH', name: 'السليمانية' },
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
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*${query}`, {
    headers: sbHeaders,
  });
  if (!res.ok) throw new Error(`sbSelect ${table} failed: ${res.status}`);
  return res.json();
}

async function sbSelectColumns(table, columns, query = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=${columns}${query}`, {
    headers: sbHeaders,
  });
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
    console.error(`sbInsert ${table} failed [${res.status}]:`, errBody);
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
    console.error(`sbUpdate ${table} failed [${res.status}]:`, errBody);
    throw new Error(`sbUpdate ${table} failed: ${res.status} — ${errBody}`);
  }
  return res.json();
}

async function sbDelete(table, id) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: sbHeaders,
  });
  if (!res.ok) {
    const errBody = await res.text();
    console.error(`sbDelete ${table} failed [${res.status}]:`, errBody);
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

// صوت إشعار لطيف عند تثبيت طلب جديد (نغمتان صاعدتان)
let _audioCtx = null;
function ensureAudioReady() {
  // يجب استدعاؤها عند أول تفاعل من المستخدم (مثل الضغط) حتى يسمح المتصفح بالصوت
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!_audioCtx) _audioCtx = new Ctx();
    if (_audioCtx.state === 'suspended') _audioCtx.resume();
  } catch (_e) { /* تجاهل */ }
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
  } catch (_e) {
    // تجاهل لو المتصفح منع الصوت
  }
}

// صوت إنذار قوي وواضح لطلب مرفوض (ثلاث نغمات حادّة متكررة)
function playAlarmSound() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    if (!_audioCtx) _audioCtx = new Ctx();
    const ctx = _audioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;
    // ثلاث نبضات حادّة متتالية بنبرة تحذيرية
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
  } catch (_e) {
    // تجاهل
  }
}

// ── تحويل بين أعمدة قاعدة البيانات (snake_case) وحقول الواجهة (camelCase) ──
function mapPageFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    avatar: row.avatar || '📄',
    source: row.source,
    connected: row.connected,
    fbPageId: row.fb_page_id,
  };
}

function mapOrderFromDb(row) {
  return {
    id: row.id,
    orderNo: row.order_no,
    pageId: row.page_id,
    customer: row.customer_name,
    phone: row.phone,
    address: row.address,
    items: row.items,
    orderType: row.order_type || '',
    total: Number(row.total) || 0,
    status: row.status,
    date: row.order_date,
    fahdRef: row.fahd_ref,
    source: row.source || 'manual',
    conversationId: row.conversation_id || null,
    converted: !!row.converted,
    convertedAt: row.converted_at || null,
    convertedBy: row.converted_by || null,
    convertedByName: row.converted_by_name || null,
    createdAt: row.created_at || row.order_date,
    printed: !!row.printed,
    printBatchId: row.print_batch_id || null,
    printedAt: row.printed_at || null,
    // مرحلة الطلب: ready (جاهز للطباعة) → prep (قيد التجهيز) → delivery (لدى شركة التوصيل)
    stage: row.stage || (row.printed ? 'prep' : 'ready'),
    // التجهيز
    prepStatus: row.prep_status || null, // null | 'done' | 'rejected'
    prepBy: row.prep_by || null,
    prepByName: row.prep_by_name || null,
    prepReason: row.prep_reason || null,
    prepAt: row.prep_at || null,
    reprepNote: row.reprep_note || null,
    reprepByName: row.reprep_by_name || null,
    // شركة التوصيل
    deliveryStatus: row.delivery_status || null,
    governorateCode: row.governorate_code || '',
    governorateName: row.governorate_name || '',
    area: row.area || '',
    jenniShipmentId: row.jenni_shipment_id || null,
    jenniSent: !!row.jenni_sent,
    jenniTracking: row.jenni_tracking || null,
    jenniError: null, // خطأ مؤقت في الذاكرة فقط (مو بقاعدة البيانات)
    deliveryStep: row.delivery_step || null,
    deliveryStepAr: row.delivery_step_ar || null,
    deliveryNote: row.delivery_note || null,
    deliveryUpdatedAt: row.delivery_updated_at || null,
  };
}

function mapUserFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    role: row.role, // 'admin' | 'manager' | 'warehouse'
    permissions: row.permissions || [],
    active: row.active,
    jobTitle: row.job_title || '',
    whatsapp: row.whatsapp || '',
  };
}

function mapConversationFromDb(row) {
  return {
    id: row.id,
    pageId: row.page_id,
    customer: row.customer_name,
    customerPsid: row.customer_psid,
    avatar: row.avatar || '👤',
    avatarUrl: row.avatar_url || null,
    platform: row.source || 'facebook',
    lastMsg: row.last_message || '',
    time: row.last_message_time
      ? new Date(row.last_message_time).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
      : '',
    unread: row.unread_count || 0,
    tab: row.tab || 'normal',
    orderId: row.order_id,
  };
}

function mapMessageFromDb(row) {
  return {
    id: row.id,
    conversationId: row.conversation_id,
    direction: row.direction || 'incoming',
    content: row.content || null,
    type: row.message_type || 'text',
    mediaUrl: row.media_url || null,
    time: row.created_at
      ? new Date(row.created_at).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
      : '',
  };
}

// ──────────────────────────────────────────────
// ثوابت التصميم
// ──────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'قيد التوصيل', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: Truck },
  returned:  { label: 'راجع',        color: '#F45B69', bg: 'rgba(244,91,105,0.12)', icon: XCircle },
  delivered: { label: 'مستلم',       color: '#4ADE80', bg: 'rgba(74,222,128,0.12)', icon: CheckCircle2 },
};

// حالات شركة التوصيل (تُحدَّث لاحقاً عبر الربط مع الشركة)
const DELIVERY_STATUS_CONFIG = {
  sorting:   { label: 'قيد العد والفرز', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
  shipping:  { label: 'بالطريق',          color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' },
  delivered: { label: 'مستلم',            color: '#4ADE80', bg: 'rgba(74,222,128,0.12)' },
  returned:  { label: 'راجع',             color: '#F45B69', bg: 'rgba(244,91,105,0.12)' },
};

// مراحل دورة حياة الطلب
const ORDER_STAGES = [
  { id: 'ready',    label: 'جاهزة للطباعة' },
  { id: 'prep',     label: 'قيد التجهيز' },
  { id: 'delivery', label: 'لدى شركة التوصيل' },
];

const ORDER_STAGE_CONFIG = {
  ready: { label: 'جاهز للطباعة', color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', icon: Printer },
  prep: { label: 'قيد التجهيز', color: '#F0A868', bg: 'rgba(240,168,104,0.12)', icon: Package },
  delivery: { label: 'لدى شركة التوصيل', color: '#60A5FA', bg: 'rgba(96,165,250,0.12)', icon: Truck },
  converted: { label: 'محوّل/مؤرشف', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)', icon: Send },
  rejected: { label: 'مرفوض من المخزن', color: '#F45B69', bg: 'rgba(244,91,105,0.14)', icon: XCircle },
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
  { id: 'normal',  label: 'محادثات اعتيادية',         icon: MessageSquare },
  { id: 'pinned',  label: 'محادثات مثبّت بها طلب',     icon: Pin },
  { id: 'handoff', label: 'محوّلة من الذكاء الاصطناعي', icon: Bot },
];

// ──────────────────────────────────────────────
// بيانات تجريبية أولية (Seed) — تُستخدم أول مرة فقط
// ──────────────────────────────────────────────
const SEED_PAGES = [
  { id: 'pg1', name: 'متجر الفهد للإلكترونيات', avatar: '🦅', connected: true },
  { id: 'pg2', name: 'فهد ستور - أزياء', avatar: '👔', connected: true },
];

const SEED_CONVERSATIONS = [
  { id: 'c1', pageId: 'pg1', customer: 'محمد العبيدي', avatar: 'م', lastMsg: 'هل المنتج متوفر بلون أزرق؟', time: '10:42', unread: 2, tab: 'normal' },
  { id: 'c2', pageId: 'pg1', customer: 'سارة الجبوري', avatar: 'س', lastMsg: 'تم تثبيت الطلب رقم #1042', time: '09:15', unread: 0, tab: 'pinned', orderId: 'o1' },
  { id: 'c3', pageId: 'pg2', customer: 'علي حسين', avatar: 'ع', lastMsg: 'محول من المساعد الذكي - استفسار عن المقاسات', time: '08:50', unread: 1, tab: 'handoff' },
  { id: 'c4', pageId: 'pg2', customer: 'زينب كاظم', avatar: 'ز', lastMsg: 'شكراً جزيلاً، استلمت الطلب', time: 'أمس', unread: 0, tab: 'normal' },
  { id: 'c5', pageId: 'pg1', customer: 'حسين علاء', avatar: 'ح', lastMsg: 'تم تثبيت الطلب رقم #1038', time: 'أمس', unread: 0, tab: 'pinned', orderId: 'o2' },
];

const SEED_ORDERS = [
  { id: 'o1', orderNo: '1042', pageId: 'pg1', customer: 'سارة الجبوري', phone: '0780 123 4567', address: 'بغداد - الكرادة', items: 'سماعة لاسلكية × 1', total: 45000, status: 'pending', date: '2026-06-19', fahdRef: 'FHD-99821' },
  { id: 'o2', orderNo: '1038', pageId: 'pg1', customer: 'حسين علاء', phone: '0790 987 6543', address: 'بغداد - المنصور', items: 'شاحن سريع × 2', total: 30000, status: 'delivered', date: '2026-06-18', fahdRef: 'FHD-99776' },
  { id: 'o3', orderNo: '1029', pageId: 'pg2', customer: 'نور صباح', phone: '0770 456 1234', address: 'البصرة - العشار', items: 'قميص رجالي L × 1', total: 35000, status: 'returned', date: '2026-06-17', fahdRef: 'FHD-99701' },
  { id: 'o4', orderNo: '1051', pageId: 'pg2', customer: 'أحمد كريم', phone: '0750 222 3344', address: 'أربيل - عينكاوة', items: 'بنطلون جينز × 1', total: 28000, status: 'pending', date: '2026-06-19', fahdRef: 'FHD-99845' },
];

const SEED_USERS = [
  { id: 'u1', name: 'المدير العام', role: 'admin', code: '100020', active: true, permissions: ['all'] },
];

// ──────────────────────────────────────────────
// أداة كشف حجم الشاشة (للتصميم المتجاوب)
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// شعار AlFhd (SVG مخصص)
// ──────────────────────────────────────────────
function FahdLogo({ size = 56 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      <defs>
        <linearGradient id="fahdGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" stroke="url(#fahdGrad)" strokeWidth="1.5" opacity="0.4" />
      <path
        d="M50 18 C35 18 24 30 22 45 C21 52 24 58 28 63 L32 58 C29 54 27 50 28 45 C29 35 38 26 50 26 C62 26 71 35 72 45 C73 50 71 54 68 58 L72 63 C76 58 79 52 78 45 C76 30 65 18 50 18 Z"
        fill="url(#fahdGrad)"
      />
      <circle cx="40" cy="42" r="3" fill="#0A0E17" />
      <circle cx="60" cy="42" r="3" fill="#0A0E17" />
      <path d="M50 48 L46 55 L54 55 Z" fill="#0A0E17" opacity="0.7" />
      <path
        d="M30 68 Q50 78 70 68 L66 82 Q50 90 34 82 Z"
        fill="url(#fahdGrad)"
        opacity="0.85"
      />
    </svg>
  );
}

// ──────────────────────────────────────────────
// شاشة تسجيل الدخول
// ──────────────────────────────────────────────
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
      setError(true);
      setShake(true);
      setCode('');
      setTimeout(() => setShake(false), 520);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setCode(value);
    setError(false);
    if (value.length === 4) attemptLogin(value);
  };

  const handleKeypad = (digit) => {
    if (digit === 'back') {
      const next = code.slice(0, -1);
      setCode(next);
      setError(false);
      return;
    }
    if (code.length >= 4) return;
    const next = `${code}${digit}`;
    setCode(next);
    setError(false);
    if (next.length === 4) attemptLogin(next);
  };

  return (
    <div style={styles.loginWrap} onClick={() => hiddenInputRef.current?.focus()}>
      <div style={styles.loginSpaceBg} />
      <div style={styles.loginNebulaOne} />
      <div style={styles.loginNebulaTwo} />
      <div style={styles.loginOrbit} className="alfhd-login-orbit" />
      <div style={styles.loginStarsLayer} className="alfhd-stars-layer" />
      <div style={styles.loginStarsLayer2} className="alfhd-stars-layer-2" />

      <div style={styles.loginBrandTop}>
        <Sparkles size={16} />
        <span>ALFHD COMMAND CENTER</span>
      </div>

      <div
        className="alfhd-login-card"
        style={{
          ...styles.loginCard,
          animation: shake ? 'shake 0.42s ease' : 'loginFloat 5.5s ease-in-out infinite',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={styles.loginGlassShine} />
        <div style={styles.loginCardAccent} />
        <div style={styles.loginLogoArea}>
          <div style={styles.logoGlow} />
          <FahdLogo size={78} />
        </div>
        <h1 style={styles.loginTitle}>AlFhd</h1>
        <p style={styles.loginSubtitle}>نظام قيادة الطلبات والمحادثات</p>
        <div style={styles.loginMicroCopy}>دخول آمن برمز من 4 أرقام</div>

        <div style={{ width: '100%', marginTop: 34 }}>
          <label style={styles.inputLabel}>رمز الدخول</label>
          <div style={styles.pinBoxesWrap} onClick={() => hiddenInputRef.current?.focus()}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                style={{
                  ...styles.pinBox,
                  ...(error
                    ? styles.pinBoxError
                    : code.length === i
                      ? styles.pinBoxActive
                      : code.length > i
                        ? styles.pinBoxFilled
                        : {}),
                }}
              >
                {code[i] ? '•' : ''}
              </div>
            ))}
            <input
              ref={hiddenInputRef}
              type="password"
              inputMode="numeric"
              value={code}
              onChange={handleChange}
              style={styles.pinHiddenInput}
              autoFocus
              aria-label="رمز الدخول من 4 أرقام"
            />
          </div>
          {error && <p style={styles.errorText}>الرمز غير صحيح أو الحساب غير مفعّل</p>}

          <label style={styles.rememberRow} onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              style={styles.checkbox}
            />
            <span>تذكرني على هذا الجهاز</span>
          </label>

          <div style={styles.loginKeypad} onClick={(e) => e.stopPropagation()}>
            {[1,2,3,4,5,6,7,8,9].map((n) => (
              <button key={n} type="button" style={styles.loginKeypadBtn} onClick={() => handleKeypad(String(n))}>{n}</button>
            ))}
            <button type="button" style={styles.loginKeypadGhost} onClick={() => { setCode(''); setError(false); }}>مسح</button>
            <button type="button" style={styles.loginKeypadBtn} onClick={() => handleKeypad('0')}>0</button>
            <button type="button" style={styles.loginKeypadGhost} onClick={() => handleKeypad('back')}>⌫</button>
          </div>
        </div>
      </div>
      <p style={styles.loginFooter}>AlFhd Order Management © 2026 · Precision Logistics</p>
    </div>
  );
}

// ──────────────────────────────────────────────
// الشريط الجانبي
// ──────────────────────────────────────────────
function Sidebar({ activeView, setActiveView, onLogout, currentUser, pages }) {
  const isMobile = useIsMobile();
  const navItems = [
    { id: 'conversations', label: 'المحادثات', icon: MessageSquare },
    { id: 'orders', label: 'الطلبات', icon: Package },
    { id: 'stats', label: 'الإحصائيات', icon: BarChart3 },
    { id: 'users', label: 'الإدارة العامة', icon: Shield, adminOnly: true },
    { id: 'pages', label: 'الصفحات', icon: Facebook },
  ];

  if (isMobile) {
    return (
      <>
        <header style={styles.mobileHeader} className="alfhd-no-print">
          <div style={styles.mobileHeaderBrand}>
            <FahdLogo size={28} />
            <span style={styles.mobileHeaderTitle}>AlFhd</span>
          </div>
          <button onClick={onLogout} style={styles.mobileLogoutBtn}>
            <LogOut size={16} />
          </button>
        </header>
        <nav style={styles.bottomNav} className="alfhd-no-print">
          {navItems.map((item) => {
            if (item.adminOnly && currentUser.role !== 'admin') return null;
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`alfhd-bottom-nav-item${active ? ' alfhd-bottom-nav-item-active' : ''}`}
                style={{ ...styles.bottomNavItem, ...(active ? styles.bottomNavItemActive : {}) }}
              >
                <Icon size={19} strokeWidth={active ? 2.4 : 1.8} />
                <span style={styles.bottomNavLabel}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </>
    );
  }

  return (
    <aside style={styles.sidebar} className="alfhd-no-print">
      <div style={styles.sidebarHeader}>
        <FahdLogo size={36} />
        <div>
          <div style={styles.sidebarBrand}>AlFhd</div>
          <div style={styles.sidebarBrandSub}>إدارة طلبات</div>
        </div>
      </div>

      <nav style={styles.sidebarNav}>
        {navItems.map((item) => {
          if (item.adminOnly && currentUser.role !== 'admin') return null;
          const Icon = item.icon;
          const active = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`alfhd-nav-item${active ? ' alfhd-bottom-nav-item-active' : ''}`}
              style={{
                ...styles.navItem,
                ...(active ? styles.navItemActive : {}),
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.4 : 1.8} />
              <span>{item.label}</span>
              {active && <div style={styles.navActiveDot} />}
            </button>
          );
        })}
      </nav>

      <div style={styles.sidebarFooter}>
        <div style={styles.userBadge}>
          <div style={styles.userAvatar}>{currentUser.name[0]}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.userName}>{currentUser.name}</div>
            <div style={styles.userRole}>
              {currentUser.role === 'admin' ? 'صلاحية كاملة' : 'صلاحية محددة'}
            </div>
          </div>
        </div>
        <button onClick={onLogout} style={styles.logoutBtn}>
          <LogOut size={16} />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}

// ──────────────────────────────────────────────
// تلوين الأفاتار حسب اسم العميل (نمط تيليجرام) + عرضه
// ──────────────────────────────────────────────
const AVATAR_PALETTE = ['#A78BFA', '#34D9C5', '#4ADE80', '#F45B69', '#F0A868', '#E879B9', '#5B8DEF', '#FACC15'];
function avatarColorFromName(name = '') {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
}

function PlatformBadge({ platform, size = 'md' }) {
  const isWhatsApp = platform === 'whatsapp';
  const dim = size === 'lg' ? 18 : 17;
  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, width: dim, height: dim,
      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isWhatsApp ? '#25D366' : '#0A8CFF',
      border: '2.5px solid #0A0E17', boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
    }}>
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
  const wrapStyle = size === 'lg' ? styles.convAvatarLg : styles.convAvatar;
  return (
    <div style={{ position: 'relative', width: wrapStyle.width, height: wrapStyle.height, flexShrink: 0 }}>
      {conv?.avatarUrl ? (
        <img
          src={conv.avatarUrl}
          alt={conv.customer || ''}
          style={{ ...wrapStyle, objectFit: 'cover', background: '#222C42' }}
        />
      ) : (
        <div style={{ ...wrapStyle, background: `${color}22`, color, border: `1px solid ${color}44` }}>
          {conv?.avatar && conv.avatar !== '👤' ? conv.avatar : (conv?.customer?.[0] || '👤')}
        </div>
      )}
      <PlatformBadge platform={conv?.platform || 'facebook'} size={size} />
    </div>
  );
}

// ──────────────────────────────────────────────
// عرض المحادثات
// ──────────────────────────────────────────────
function ConversationsView({ conversations, pages, orders, setConversations, pendingOpenConvId, clearPendingOpenConvId, onCreateOrderFromConv, onOpenOrderDetails }) {
  const [activeTab, setActiveTab] = useState('normal');
  const [selectedPage, setSelectedPage] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedConv, setSelectedConv] = useState(null);

  useEffect(() => {
    if (!pendingOpenConvId) return;
    const target = conversations.find((c) => c.id === pendingOpenConvId);
    if (target) {
      setActiveTab(target.tab);
      setSelectedConv(target);
      markConversationRead(target.id);
    }
    clearPendingOpenConvId?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  const markConversationRead = useCallback(async (convId) => {
    if (!convId) return;
    setSelectedConv((prev) => (prev?.id === convId ? { ...prev, unread: 0 } : prev));
    setConversations?.((prev) => prev.map((c) => (
      c.id === convId ? { ...c, unread: 0 } : c
    )));
    try {
      await sbUpdate('alfhd_conversations', convId, { unread_count: 0, last_read_at: new Date().toISOString() });
    } catch (e) {
      console.error('mark read error:', e);
    }
  }, [setConversations]);

  const markAllRead = useCallback(async (convList) => {
    const unreadOnes = convList.filter((c) => c.unread > 0);
    if (unreadOnes.length === 0) return;
    const ids = unreadOnes.map((c) => c.id);
    setConversations?.((prev) => prev.map((c) => (
      ids.includes(c.id) ? { ...c, unread: 0 } : c
    )));
    try {
      await Promise.all(ids.map((id) => sbUpdate('alfhd_conversations', id, { unread_count: 0, last_read_at: new Date().toISOString() })));
    } catch (e) {
      console.error('mark all read error:', e);
    }
  }, [setConversations]);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (c.tab !== activeTab) return false;
      if (selectedPage !== 'all' && c.pageId !== selectedPage) return false;
      if (search) {
        const q = search.trim().toLowerCase();
        const hay = [c.customer, c.lastMsg, c.customerPsid, c.orderId].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [conversations, activeTab, selectedPage, search]);

  const counts = useMemo(() => {
    const base = { normal: 0, pinned: 0, handoff: 0 };
    const unread = { normal: 0, pinned: 0, handoff: 0 };
    conversations.forEach((c) => {
      if (selectedPage === 'all' || c.pageId === selectedPage) {
        if (base[c.tab] !== undefined) {
          base[c.tab]++;
          if (Number(c.unread || 0) > 0) unread[c.tab] += Number(c.unread || 0);
        }
      }
    });
    return { total: base, unread };
  }, [conversations, selectedPage]);

  const linkedOrder = selectedConv?.orderId
    ? orders.find((o) => o.id === selectedConv.orderId)
    : null;

  const loadMessages = useCallback(async (convId) => {
    if (!convId) return;
    try {
      const dbMsgs = await sbSelect('alfhd_messages', `&conversation_id=eq.${convId}&order=created_at.asc`);
      setMessages((dbMsgs || []).map(mapMessageFromDb));
    } catch (e) {
      console.error('load messages error:', e);
    }
  }, []);

  useEffect(() => {
    if (!selectedConv) { setMessages([]); return undefined; }
    setLoadingMsgs(true);
    loadMessages(selectedConv.id).finally(() => setLoadingMsgs(false));
    // أثناء فتح المحادثة: اسحب من فيسبوك مباشرة وحدّث الرسائل كل 2.5 ثانية لأقل تأخير ممكن
    const refreshOpenChat = async () => {
      try {
        await fetch(FB_POLL_FUNCTION_URL, { method: 'GET', headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY } });
      } catch (_e) { /* تجاهل، نكمل بالتحديث المحلي */ }
      await loadMessages(selectedConv.id);
      await markConversationRead(selectedConv.id);
    };
    const interval = setInterval(refreshOpenChat, 2500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedConv?.id]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  function touchConvLocally(convId, lastMessage) {
    if (!setConversations) return;
    setConversations((prev) => prev.map((c) => (
      c.id === convId
        ? { ...c, lastMsg: lastMessage, time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) }
        : c
    )));
  }

  async function uploadToStorage(file, ext) {
    const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/chat-media/${filename}`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true',
      },
      body: file,
    });
    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const isBucketMissing = res.status === 404 || /bucket not found/i.test(body);
      if (isBucketMissing) {
        throw new Error('مخزن الملفات غير موجود. أنشئ Bucket باسم chat-media من Supabase ← Storage واجعله Public، ثم أعد المحاولة.');
      }
      throw new Error(`فشل رفع الملف (${res.status}): ${body || 'تحقق من إعدادات مخزن chat-media'}`);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/chat-media/${filename}`;
  }

  async function sendToFacebook(payload) {
    const res = await fetch(FB_SEND_FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'apikey': SUPABASE_KEY,
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.error) {
      throw new Error(data?.error || `فشل الإرسال: ${res.status}`);
    }
    return data;
  }

  async function handleSendText() {
    const text = composerText.trim();
    if (!text || !selectedConv || sendingMsg) return;
    setComposerText('');
    setSendingMsg(true);
    const nowLabel = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, direction: 'outgoing', content: text, type: 'text', mediaUrl: null, time: nowLabel }]);
    touchConvLocally(selectedConv.id, text);
    try {
      await sendToFacebook({
        pageId: selectedConv.pageId,
        conversationId: selectedConv.id,
        recipientPsid: selectedConv.customerPsid,
        text,
      });
      await loadMessages(selectedConv.id);
    } catch (e) {
      console.error('send text error:', e);
      alert(`تعذّر إرسال الرسالة:\n${e?.message || 'خطأ غير معروف'}`);
    } finally {
      setSendingMsg(false);
    }
  }

  async function handlePickImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !selectedConv) return;
    setSendingMsg(true);
    try {
      const url = await uploadToStorage(file, (file.name.split('.').pop() || 'jpg').toLowerCase());
      setMessages((prev) => [...prev, { id: `temp-${Date.now()}`, direction: 'outgoing', content: null, type: 'image', mediaUrl: url, time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' }) }]);
      touchConvLocally(selectedConv.id, '📷 صورة');
      await sendToFacebook({
        pageId: selectedConv.pageId,
        conversationId: selectedConv.id,
        recipientPsid: selectedConv.customerPsid,
        mediaUrl: url,
        mediaType: 'image',
      });
      await loadMessages(selectedConv.id);
    } catch (e) {
      console.error('send image error:', e);
      alert(`تعذّر إرسال الصورة:\n${e?.message || 'خطأ غير معروف'}`);
    } finally {
      setSendingMsg(false);
    }
  }

  async function startRecording() {
    if (!selectedConv) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recCanceledRef.current = false;
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
          await sendToFacebook({
            pageId: selectedConv.pageId,
            conversationId: selectedConv.id,
            recipientPsid: selectedConv.customerPsid,
            mediaUrl: url,
            mediaType: 'audio',
          });
          await loadMessages(selectedConv.id);
        } catch (e) {
          console.error('send audio error:', e);
          alert(`تعذّر إرسال التسجيل الصوتي:\n${e?.message || 'خطأ غير معروف'}`);
        } finally {
          setSendingMsg(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
      setRecSeconds(0);
      recTimerRef.current = setInterval(() => setRecSeconds((s) => s + 1), 1000);
    } catch (e) {
      alert('تعذّر الوصول إلى الميكروفون، تأكد من السماح بالإذن من المتصفح');
    }
  }

  function stopRecording() {
    recCanceledRef.current = false;
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  function cancelRecording() {
    recCanceledRef.current = true;
    mediaRecorderRef.current?.stop();
    setRecording(false);
    if (recTimerRef.current) { clearInterval(recTimerRef.current); recTimerRef.current = null; }
    setRecSeconds(0);
  }

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header">
        <div>
          <h2 style={styles.viewTitle}>المحادثات</h2>
          <p style={styles.viewSubtitle}>إدارة محادثات صفحاتك في مكان واحد</p>
        </div>
        <div style={styles.pageSelectWrap}>
          <Facebook size={15} color="#3B82F6" />
          <select
            value={selectedPage}
            onChange={(e) => setSelectedPage(e.target.value)}
            style={styles.pageSelect}
          >
            <option value="all">كل الصفحات ({pages.length})</option>
            {pages.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <ChevronDown size={14} color="#5E6986" />
        </div>
      </div>

      <div style={styles.convTabs}>
        {CONV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setSelectedConv(null); }}
              style={{ ...styles.convTab, ...(active ? styles.convTabActive : {}), position: 'relative' }}
            >
              <Icon size={15} />
              {tab.label}
              <span style={{
                ...styles.convTabCount,
                ...(active ? styles.convTabCountActive : {}),
              }}>
                {counts.total[tab.id]}
              </span>
              {counts.unread[tab.id] > 0 && (
                <span style={styles.unreadPulse} className="alfhd-unread-pulse">
                  {counts.unread[tab.id]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div style={styles.convLayout} className="alfhd-conv-layout">
        <div
          style={styles.convList}
          className={`alfhd-conv-list${selectedConv ? ' alfhd-conv-list-hidden-mobile' : ''}`}
        >
          <div style={styles.searchBox}>
            <Search size={15} color="#5E6986" />
            <input
              placeholder="بحث باسم العميل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <button
            onClick={() => markAllRead(filtered)}
            style={{
              ...styles.markAllReadBtn,
              ...(filtered.reduce((s, c) => s + Number(c.unread || 0), 0) === 0 ? styles.markAllReadBtnDisabled : {}),
            }}
            disabled={filtered.reduce((s, c) => s + Number(c.unread || 0), 0) === 0}
          >
            <CheckCircle2 size={14} />
            تعليم الكل كمقروء ({filtered.reduce((s, c) => s + Number(c.unread || 0), 0)})
          </button>

          {filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <MessageSquare size={32} color="#39425C" />
              <p>لا توجد محادثات هنا</p>
            </div>
          ) : (
            filtered.map((c) => {
              return (
                <button
                  key={c.id}
                  onClick={() => { setSelectedConv(c); markConversationRead(c.id); }}
                  className="alfhd-conv-item"
                  style={{
                    ...styles.convItem,
                    ...(selectedConv?.id === c.id ? styles.convItemActive : {}),
                  }}
                >
                  <ConvAvatar conv={c} />
                  <div style={{ flex: 1, minWidth: 0, textAlign: 'right' }}>
                    <div style={styles.convItemTop}>
                      <span style={styles.convCustomer}>{c.customer}</span>
                      <span style={styles.convTime}>{c.time}</span>
                    </div>
                    <div style={styles.convItemBottom}>
                      <span style={styles.convLastMsg}>{c.lastMsg}</span>
                      {c.unread > 0 && <span style={styles.unreadBadge}>{c.unread}</span>}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div
          style={styles.convDetail}
          className={`alfhd-conv-detail${selectedConv ? ' alfhd-conv-detail-active-mobile' : ' alfhd-conv-detail-empty'}`}
        >
          {selectedConv ? (
            <>
              <div style={styles.detailHeader} className="alfhd-chat-detail-header">
                <button
                  onClick={() => setSelectedConv(null)}
                  style={styles.convBackBtn}
                  className="alfhd-conv-back-btn"
                >
                  <ArrowRight size={18} />
                </button>
                <ConvAvatar conv={selectedConv} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.detailName}>{selectedConv.customer}</div>
                  <div style={styles.detailPage}>
                    {pages.find((p) => p.id === selectedConv.pageId)?.name}
                  </div>
                </div>
                {!selectedConv.orderId && (
                  <button
                    onClick={() => onCreateOrderFromConv?.(selectedConv)}
                    style={styles.pinOrderBtn}
                    title="تثبيت طلب من هذه المحادثة"
                  >
                    <Pin size={14} />
                    تثبيت طلب
                  </button>
                )}
              </div>

              {linkedOrder && (
                <div style={styles.linkedOrderCard} className="alfhd-linked-order">
                  <div style={styles.linkedOrderHeader}>
                    <Pin size={14} color="#3B82F6" />
                    <span>طلب مثبّت بهذه المحادثة</span>
                  </div>
                  <div style={styles.linkedOrderBody}>
                    <div style={styles.linkedOrderRow}>
                      <span style={styles.linkedOrderLabel}>رقم الطلب</span>
                      <span style={styles.linkedOrderValue}>#{linkedOrder.orderNo}</span>
                    </div>
                    <div style={styles.linkedOrderRow}>
                      <span style={styles.linkedOrderLabel}>مرحلة الطلب</span>
                      <OrderStagePill order={linkedOrder} />
                    </div>
                    {linkedOrder.stage === 'delivery' && (
                      <div style={styles.linkedOrderRow}>
                        <span style={styles.linkedOrderLabel}>حالة التوصيل</span>
                        <StatusPill status={linkedOrder.status} />
                      </div>
                    )}
                    {linkedOrder.orderType && (
                      <div style={styles.linkedOrderRow}>
                        <span style={styles.linkedOrderLabel}>نوع الطلب</span>
                        <span style={styles.linkedOrderValue}>{linkedOrder.orderType}</span>
                      </div>
                    )}
                    <div style={styles.linkedOrderRow}>
                      <span style={styles.linkedOrderLabel}>المبلغ</span>
                      <span style={{ ...styles.linkedOrderValue, color: '#60A5FA', fontWeight: 700 }}>
                        {linkedOrder.total.toLocaleString()} د.ع
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenOrderDetails?.(linkedOrder)}
                    style={styles.linkedOrderDetailBtn}
                  >
                    <Eye size={14} /> عرض تفاصيل الطلب وإدارته
                  </button>
                </div>
              )}

              <div style={styles.chatScroll} ref={scrollRef} className="alfhd-chat-scroll">
                {loadingMsgs ? (
                  <div style={styles.emptyStateLg}>
                    <RefreshCw size={22} color="#39425C" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={styles.emptyStateLg}>
                    <MessageSquare size={32} color="#39425C" />
                    <p>لا توجد رسائل بعد</p>
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className="alfhd-chat-bubble-row"
                      style={{
                        display: 'flex',
                        justifyContent: m.direction === 'outgoing' ? 'flex-end' : 'flex-start',
                        marginBottom: 10,
                        width: '100%',
                        minWidth: 0,
                      }}
                    >
                      <div style={m.direction === 'outgoing' ? styles.msgBubbleOut : styles.msgBubbleIn}>
                        {m.type === 'image' && m.mediaUrl && (
                          <img src={m.mediaUrl} alt="" style={styles.msgImage} />
                        )}
                        {m.type === 'audio' && m.mediaUrl && (
                          <audio controls src={m.mediaUrl} style={styles.msgAudio} />
                        )}
                        {m.content && <div style={{ overflowWrap: 'anywhere', wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}>{m.content}</div>}
                        <div style={styles.msgTime}>{m.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.composerBar} className="alfhd-composer-bar">
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePickImage}
                  style={{ display: 'none' }}
                />
                {recording ? (
                  <div style={styles.recordingBar}>
                    <button
                      style={styles.recordingCancelBtn}
                      onClick={cancelRecording}
                      title="إلغاء"
                    >
                      <Trash2 size={18} />
                    </button>
                    <div style={styles.recordingInfo}>
                      <span style={styles.recordingDot} className="alfhd-rec-dot" />
                      <span style={styles.recordingTime}>{formatRecTime(recSeconds)}</span>
                      <span style={styles.recordingLabel}>جارٍ التسجيل…</span>
                    </div>
                    <button
                      style={styles.recordingSendBtn}
                      onClick={stopRecording}
                      title="إرسال التسجيل"
                    >
                      <Send size={17} />
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      style={styles.composerIconBtn}
                      onClick={() => fileInputRef.current?.click()}
                      disabled={sendingMsg}
                      title="إرسال صورة"
                    >
                      <Image size={18} />
                    </button>
                    <button
                      style={styles.composerIconBtn}
                      onClick={startRecording}
                      disabled={sendingMsg}
                      title="تسجيل صوتي"
                    >
                      <Mic size={18} />
                    </button>
                    <input
                      value={composerText}
                      onChange={(e) => setComposerText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleSendText(); }}
                      placeholder="اكتب رسالة..."
                      style={styles.composerInput}
                      disabled={sendingMsg}
                    />
                    <button
                      style={styles.composerSendBtn}
                      onClick={handleSendText}
                      disabled={sendingMsg || !composerText.trim()}
                    >
                      <Send size={17} />
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div style={styles.emptyStateLg}>
              <MessageSquare size={40} color="#39425C" />
              <p>اختر محادثة لعرض التفاصيل</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// شارة الحالة
// ──────────────────────────────────────────────
function StatusPill({ status }) {
  const cfg = STATUS_CONFIG[status];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}33`,
    }}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

function OrderStagePill({ order }) {
  const cfg = getOrderStageInfo(order);
  const Icon = cfg.icon || Package;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 800,
      color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.color}44`,
      whiteSpace: 'nowrap',
    }}>
      <Icon size={12} />
      {cfg.label}
    </span>
  );
}

// ──────────────────────────────────────────────
// أدوات الفلترة المشتركة (تاريخ + صفحات + بحث)
// ──────────────────────────────────────────────
function startOfDayTs(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); }

const DATE_PRESETS = [
  { id: 'today', label: 'اليوم' },
  { id: 'yesterday', label: 'أمس' },
  { id: 'dayBefore', label: 'أول أمس' },
  { id: 'week', label: 'هذا الأسبوع' },
  { id: 'custom', label: 'اختيار شهر وسنة' },
  { id: 'all', label: 'الكل' },
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

// شريط فلترة موحّد: تاريخ + صفحات + بحث
function OrderFilters({
  pages, datePreset, setDatePreset, customMonth, setCustomMonth, customYear, setCustomYear,
  pageFilter, setPageFilter, search, setSearch, searchPlaceholder,
}) {
  const years = [];
  for (let y = new Date().getFullYear(); y >= 2024; y--) years.push(y);
  return (
    <div style={styles.filtersWrap} className="alfhd-no-print">
      <div style={styles.filterBottomRow}>
        <div style={styles.pageSelectWrap}>
          <Calendar size={15} color="#60A5FA" />
          <select value={datePreset} onChange={(e) => setDatePreset(e.target.value)} style={styles.pageSelect}>
            {DATE_PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <ChevronDown size={14} color="#5E6986" />
        </div>
        {datePreset === 'custom' && (
          <>
            <select value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} style={styles.customDateSelectCompact}>
              {AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select value={customYear} onChange={(e) => setCustomYear(e.target.value)} style={styles.customDateSelectCompact}>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </>
        )}
        <div style={styles.pageSelectWrap}>
          <Facebook size={15} color="#3B82F6" />
          <select value={pageFilter} onChange={(e) => setPageFilter(e.target.value)} style={styles.pageSelect}>
            <option value="all">كل الصفحات</option>
            {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown size={14} color="#5E6986" />
        </div>
        <div style={styles.searchBox}>
          <Search size={15} color="#5E6986" />
          <input
            placeholder={searchPlaceholder || 'بحث...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// عرض الطلبات
// ──────────────────────────────────────────────
function OrdersView({ orders, pages, setOrders, conversations, setConversations, onViewConversation, pendingNewOrderFromConv, clearPendingNewOrderFromConv, currentUser, onContactCustomer, pendingOpenOrderId, clearPendingOpenOrderId }) {
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

  // مطابقة الفلاتر المشتركة (صفحة + تاريخ + بحث) على طلب
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
    setEditingOrder({
      id: null,
      pageId: conv.pageId || pages[0]?.id || '',
      customer: conv.customer || '',
      phone: '', address: '', items: '', orderType: '', total: '',
      status: 'pending', conversationId: conv.id || '',
    });
    clearPendingNewOrderFromConv?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNewOrderFromConv]);

  useEffect(() => {
    if (!pendingOpenOrderId) return;
    const target = orders.find((o) => o.id === pendingOpenOrderId);
    if (target) {
      const stage = target.stage || (target.printed ? 'prep' : 'ready');
      setSection(stage);
      setDetailOrder(target);
    }
    clearPendingOpenOrderId?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOpenOrderId, orders]);

  // الطلب المحوّل يُستبعد من القوائم كلها (يبقى بالإحصائيات فقط)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalOrderSearch, orders, pages]);

  function openOrderFromGlobalSearch(o) {
    setGlobalOrderSearch('');
    if (o.converted) {
      alert(`الطلب #${o.orderNo} محوّل/مؤرشف. يمكنك رؤيته من الإحصائيات ← الطلبات المحوّلة.`);
      return;
    }
    const stage = o.stage || (o.printed ? 'prep' : 'ready');
    setSection(stage);
    setStatusFilter('all');
    setDetailOrder(o);
  }

  const THREE_DAYS = 3 * 86400000;
  function isWithinPrepWindow(o) {
    // طلبات "قيد التجهيز" تبقى ظاهرة 3 أيام فقط، بعدها تنتقل للمهملة
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    try {
      await sbUpdate('alfhd_orders', id, { status });
    } catch (e) {
      console.error('Failed to update order status:', e);
    }
  };

  function startNewOrder() {
    if (!pages.length) { alert('لا توجد صفحات مضافة. أضف/اربط صفحة أولاً قبل إنشاء طلب.'); return; }
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
    if (!window.confirm(`هل تريد حذف الطلب #${o.orderNo}؟ لا يمكن التراجع، ولن يُحتسب ضمن الإحصائيات.`)) return;
    setOrders((prev) => prev.filter((x) => x.id !== o.id));
    setDetailOrder(null);
    try {
      await sbDelete('alfhd_orders', o.id);
    } catch (e) {
      console.error('delete order error:', e);
      alert('تعذّر حذف الطلب، تحقق من اتصالك');
    }
  }

  function buildOrderShareText(o) {
    const page = pages.find((p) => p.id === o.pageId);
    return [
      `طلب #${o.orderNo}`,
      page ? `الصفحة: ${page.name}` : null,
      `العميل: ${o.customer}`,
      o.phone ? `الهاتف: ${o.phone}` : null,
      o.address ? `العنوان: ${o.address}` : null,
      o.orderType ? `نوع الطلب: ${o.orderType}` : null,
      `المنتجات: ${o.items}`,
      `المبلغ: ${Number(o.total).toLocaleString()} د.ع`,
    ].filter(Boolean).join('\n');
  }

  async function markOrderConverted(o) {
    // التحويل: يُشال من القوائم، يبقى بالإحصائيات، ويصير "قيد التوصيل" بمحادثة الزبون
    const now = new Date().toISOString();
    const byName = currentUser?.name || null;
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, converted: true, convertedAt: now, convertedByName: byName, status: 'pending' } : x)));
    try {
      await sbUpdate('alfhd_orders', o.id, { converted: true, converted_at: now, converted_by: currentUser?.id || null, converted_by_name: byName, status: 'pending' });
    } catch (e) {
      console.error('convert order error:', e);
    }
  }

  // إعادة الطلب المرفوض للتجهيز من جديد، مع ملاحظة اختيارية من المدير
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
    try {
      await sbUpdate('alfhd_orders', o.id, patch);
    } catch (e) {
      console.error('reprep error:', e);
    }
  }

  async function handleShare(o) {
    const text = buildOrderShareText(o);
    try {
      if (navigator.share) {
        await navigator.share({ title: `طلب #${o.orderNo}`, text });
        await markOrderConverted(o);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        alert('تم نسخ تفاصيل الطلب، الصقها بأي تطبيق تحب');
        await markOrderConverted(o);
        return;
      }
      window.prompt('انسخ تفاصيل الطلب:', text);
      await markOrderConverted(o);
    } catch (e) {
      if (e?.name !== 'AbortError') {
        console.error('share error:', e);
        alert('تعذّرت المشاركة، حاول مرة أخرى');
      }
    }
  }

  async function pinConversationToOrder(conversationId, orderId) {
    if (!conversationId) return;
    setConversations?.((prev) => prev.map((c) => (
      c.id === conversationId ? { ...c, tab: 'pinned', orderId } : c
    )));
    try {
      await sbUpdate('alfhd_conversations', conversationId, { tab: 'pinned', order_id: orderId });
    } catch (e) {
      console.error('pin conversation error:', e);
    }
  }

  async function handleSaveOrder() {
    if (!editingOrder.customer.trim()) { alert('أدخل اسم العميل'); return; }
    if (!editingOrder.pageId) { alert('اختر الصفحة'); return; }
    setSaving(true);
    try {
      if (editingOrder.id) {
        const payload = {
          page_id: editingOrder.pageId,
          customer_name: editingOrder.customer,
          phone: editingOrder.phone,
          address: editingOrder.address,
          governorate_code: editingOrder.governorateCode || null,
          governorate_name: editingOrder.governorateName || null,
          area: editingOrder.area || null,
          items: editingOrder.items,
          order_type: editingOrder.orderType || null,
          total: Number(editingOrder.total) || 0,
          status: editingOrder.status,
          conversation_id: editingOrder.conversationId || null,
          source: editingOrder.conversationId ? 'chat' : (editingOrder.source || 'manual'),
        };
        await sbUpdate('alfhd_orders', editingOrder.id, payload);
        setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? {
          ...o,
          pageId: editingOrder.pageId, customer: editingOrder.customer, phone: editingOrder.phone,
          address: editingOrder.address, items: editingOrder.items, orderType: editingOrder.orderType,
          governorateCode: editingOrder.governorateCode || '', governorateName: editingOrder.governorateName || '', area: editingOrder.area || '',
          total: Number(editingOrder.total) || 0, status: editingOrder.status,
          conversationId: editingOrder.conversationId || null,
          source: editingOrder.conversationId ? 'chat' : (o.source || 'manual'),
        } : o)));
        if (editingOrder.conversationId) await pinConversationToOrder(editingOrder.conversationId, editingOrder.id);
      } else {
        const payload = {
          order_no: String(Date.now()).slice(-6),
          page_id: editingOrder.pageId,
          customer_name: editingOrder.customer,
          phone: editingOrder.phone,
          address: editingOrder.address,
          governorate_code: editingOrder.governorateCode || null,
          governorate_name: editingOrder.governorateName || null,
          area: editingOrder.area || null,
          items: editingOrder.items,
          order_type: editingOrder.orderType || null,
          total: Number(editingOrder.total) || 0,
          status: editingOrder.status || 'pending',
          stage: 'ready',
          order_date: new Date().toISOString().slice(0, 10),
          fahd_ref: `FHD-${Math.floor(10000 + Math.random() * 89999)}`,
          conversation_id: editingOrder.conversationId || null,
          source: editingOrder.conversationId ? 'chat' : 'manual',
        };
        const created = await sbInsert('alfhd_orders', payload);
        if (created?.[0]) {
          setOrders((prev) => [mapOrderFromDb(created[0]), ...prev]);
          if (editingOrder.conversationId) await pinConversationToOrder(editingOrder.conversationId, created[0].id);
        }
      }
      setEditingOrder(null);
    } catch (e) {
      console.error('save order error:', e);
      alert('تعذّر حفظ الطلب، تحقق من اتصالك');
    } finally {
      setSaving(false);
    }
  }

  async function handlePickOcrImage(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setOcrLoading(true);
    try {
      const { base64, mediaType } = await fileToBase64(file);
      const res = await fetch(ORDER_EXTRACT_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || 'فشل الاستخراج');
      setEditingOrder({
        id: null, pageId: pages[0]?.id || '',
        customer: data.order?.customer_name || '', phone: data.order?.phone || '',
        address: data.order?.address || '', items: data.order?.items || '',
        orderType: data.order?.order_type || '',
        total: data.order?.total ? String(data.order.total) : '',
        status: 'pending', conversationId: '',
      });
    } catch (e) {
      console.error('ocr error:', e);
      alert('تعذّر استخراج التفاصيل تلقائياً، أدخلها يدوياً بالنموذج');
      setEditingOrder({
        id: null, pageId: pages[0]?.id || '', customer: '', phone: '', address: '',
        items: '', orderType: '', total: '', status: 'pending', conversationId: '',
      });
    } finally {
      setOcrLoading(false);
    }
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

  // الطباعة تنقل الطلبات من "جاهز للطباعة" إلى "قيد التجهيز"
  async function markOrdersPrintedAndPrep(ids) {
    if (ids.length === 0) return;
    const batchId = `batch-${Date.now()}`;
    const printedAt = new Date().toISOString();
    setOrders((prev) => prev.map((o) => (
      ids.includes(o.id) ? { ...o, printed: true, printBatchId: batchId, printedAt, stage: 'prep' } : o
    )));
    try {
      await Promise.all(ids.map((id) => sbUpdate('alfhd_orders', id, {
        printed: true, print_batch_id: batchId, printed_at: printedAt, stage: 'prep',
      })));
    } catch (e) {
      console.error('mark printed error:', e);
    }
    // لا نرسل الطلب إلى Jenni عند الطباعة فقط؛ الإرسال يتم عند النقل الفعلي لمرحلة شركة التوصيل
  }

  // إرسال طلب واحد لشركة Jenni وحفظ رقم الشحنة (صامت)
  // تنظيف رقم الهاتف ليكون بصيغة 07XXXXXXXXX التي تقبلها جيني
  function normalizeIraqiPhone(raw) {
    if (!raw) return '';
    let digits = String(raw).replace(/[^0-9]/g, '');
    if (digits.startsWith('964')) digits = '0' + digits.slice(3);
    if (digits.startsWith('00964')) digits = '0' + digits.slice(5);
    if (!digits.startsWith('0')) digits = '0' + digits;
    return digits.slice(0, 11); // 07XXXXXXXXX = 11 رقماً
  }

  async function sendOrderToJenni(o, { silent = false } = {}) {
    // لا نرسل بدون محافظة أو هاتف (Jenni ترفضه)
    if (!o.governorateCode || !o.phone) {
      const msg = 'لا يمكن الإرسال لجيني: المحافظة ورقم الهاتف مطلوبان';
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: msg } : x)));
      if (!silent) alert(msg);
      return false;
    }
    const cleanPhone = normalizeIraqiPhone(o.phone);
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('07')) {
      const msg = `رقم الهاتف غير صالح لجيني: ${o.phone}`;
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: msg } : x)));
      if (!silent) alert(msg);
      return false;
    }
    try {
      const res = await fetch(JENNI_CREATE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({
          external_shipment_id: String(o.id),
          shipment_number: String(o.orderNo || o.id),
          receiver_name: o.customer || '',
          receiver_phone_1: cleanPhone,
          governorate_code: o.governorateCode,
          city: o.area || o.address?.split(' - ')[1] || '',
          address: o.address || '',
          amount_iqd: Number(o.total) || 0,
          note: o.orderType || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.success) {
        const patch = { jenni_sent: true, jenni_shipment_id: data.shipment_id || null, jenni_tracking: data.tracking_number || null };
        setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniSent: true, jenniShipmentId: data.shipment_id || null, jenniTracking: data.tracking_number || null, jenniError: null } : x)));
        try { await sbUpdate('alfhd_orders', o.id, patch); } catch (_e) { /* تجاهل */ }
        return true;
      }
      const errMsg = data?.error || data?.message || `فشل الإرسال لجيني (${res.status})`;
      console.warn('Jenni send failed for order', o.orderNo, errMsg);
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: errMsg } : x)));
      if (!silent) alert(`فشل الإرسال لجيني:
${errMsg}`);
      return false;
    } catch (e) {
      const errMsg = e?.message || 'خطأ اتصال غير معروف';
      console.warn('Jenni send error:', e);
      setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, jenniError: errMsg } : x)));
      if (!silent) alert(`تعذّر الاتصال بجيني:
${errMsg}`);
      return false;
    }
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
    if (ids.length === 0) { alert('لا توجد طلبات جاهزة للطباعة'); return; }
    triggerPrint('ready', ids);
  }

  function handleReprintBatch(batchId, batchOrders) {
    triggerPrint(batchId, null);
  }

  // نقل الطلب لمرحلة شركة التوصيل: يرسل أولاً إلى Jenni ثم يحدّث المرحلة محلياً
  async function moveToDelivery(o) {
    const sentOk = o.jenniSent || await sendOrderToJenni(o);
    if (!sentOk) return;
    const patch = { stage: 'delivery', delivery_status: 'sorting' };
    setOrders((prev) => prev.map((x) => (x.id === o.id ? { ...x, stage: 'delivery', deliveryStatus: 'sorting', jenniSent: true } : x)));
    setDetailOrder(null);
    try {
      await sbUpdate('alfhd_orders', o.id, patch);
    } catch (e) { console.error('move to delivery error:', e); }
  }

  const prepBatches = useMemo(() => groupByBatch(stageOrders), [stageOrders]);

  function StageStatusBadge({ o }) {
    if (section === 'delivery') {
      const dcfg = DELIVERY_STATUS_CONFIG[o.deliveryStatus] || DELIVERY_STATUS_CONFIG.sorting;
      return <div style={{ ...styles.orderStatusPill, color: dcfg.color, background: dcfg.bg }}>{dcfg.label}</div>;
    }
    if (section === 'prep') {
      return <div style={{ ...styles.orderStatusPill, color: '#F0A868', background: 'rgba(240,168,104,0.12)' }}>قيد التجهيز</div>;
    }
    return <div style={{ ...styles.orderStatusPill, color: '#3B82F6', background: 'rgba(59,130,246,0.12)' }}>جديد</div>;
  }

  function renderOrderCard(o, index = 0) {
    const page = pages.find((p) => p.id === o.pageId);
    const isRejected = o.prepStatus === 'rejected';
    return (
      <div
        key={o.id}
        style={{ ...styles.orderCard, ...(isRejected ? styles.rejectedCard : {}), animationDelay: `${Math.min(index * 0.04, 0.4)}s` }}
        className="alfhd-order-card alfhd-card-enter"
      >
        {isRejected && (
          <div style={styles.rejectedBanner}>
            <AlertCircle size={16} />
            <span>لم يُجهَّز من قبل المخزن — تحقق قبل الطباعة</span>
          </div>
        )}

        <div style={styles.orderTicketHead}>
          <div style={styles.orderTicketAvatar}>{o.customer?.[0] || '؟'}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.orderCardCustomer}>{o.customer}</div>
            <div style={styles.orderTicketPage}>{page?.avatar} {page?.name || 'بدون صفحة'}</div>
          </div>
          <StageStatusBadge o={o} />
        </div>

        {isRejected && o.prepReason && (
          <div style={styles.rejectReasonBox}>
            <span style={styles.rejectReasonLabel}>سبب المخزن:</span>
            <span>{o.prepReason}{o.prepByName ? ` — ${o.prepByName}` : ''}</span>
          </div>
        )}

        {o.reprepNote && (
          <div style={styles.orderReprepNoteBox}>
            <AlertCircle size={14} />
            <span><strong>ملاحظة {o.reprepByName || 'المدير'}:</strong> {o.reprepNote}</span>
          </div>
        )}

        <div style={styles.orderTicketBody}>
          {o.orderType && (
            <div style={styles.orderDetailRow}><Package size={12} color="#5E6986" /><span>{o.orderType}</span></div>
          )}
          {o.phone && (
            <div style={styles.orderDetailRow}><Phone size={12} color="#5E6986" /><span>{o.phone}</span></div>
          )}
          {(o.governorateName || o.address) && (
            <div style={styles.orderDetailRow}><MapPin size={12} color="#5E6986" /><span>{[o.governorateName, o.area, o.address].filter(Boolean).join(' - ')}</span></div>
          )}
          {section === 'delivery' && o.deliveryStepAr && (
            <div style={styles.deliveryStepRow}><Truck size={12} color="#60A5FA" /><span>حالة الشركة: {o.deliveryStepAr}</span></div>
          )}
          {o.items && <div style={styles.orderTicketItems}>{o.items}</div>}
        </div>

        <div style={styles.orderTicketFoot}>
          <div>
            <div style={styles.orderCardTotal}>{Number(o.total).toLocaleString()} <span style={styles.orderCurrency}>د.ع</span></div>
            <div style={styles.orderTicketMeta}>
              <span>{o.date}</span>
              <span style={{ fontFamily: 'monospace' }}>· {o.fahdRef}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {o.printed && <span style={styles.printedBadge}><Printer size={9} /> مطبوعة</span>}
          </div>
        </div>

        {o.jenniError && (
          <div style={{ background: 'rgba(244,91,105,0.1)', border: '1px solid rgba(244,91,105,0.3)', borderRadius: 8, padding: '6px 10px', fontSize: 11, color: '#F45B69', marginBottom: 6 }}>
            ⚠️ فشل الإرسال لجيني: {o.jenniError}
          </div>
        )}
        <div style={styles.orderCardActions} className="alfhd-no-print">
          <button onClick={() => setDetailOrder(o)} style={{ ...styles.orderActionBtn, flex: 1.6 }} title="عرض التفاصيل">
            <Eye size={14} /> <span style={{ fontSize: 12, fontWeight: 700 }}>التفاصيل</span>
          </button>
          {section === 'delivery' && (
            o.jenniSent ? (
              // الطلب عند شركة التوصيل — الحالة تأتي تلقائياً من جيني
              <div style={{
                ...styles.statusSelect,
                color: STATUS_CONFIG[o.status]?.color || '#9AA3B8',
                background: STATUS_CONFIG[o.status]?.bg || 'rgba(154,163,184,0.1)',
                borderColor: (STATUS_CONFIG[o.status]?.color || '#9AA3B8') + '44',
                flex: 1.4, display: 'flex', alignItems: 'center', gap: 5,
                fontSize: 12, fontWeight: 700, cursor: 'default',
              }}>
                <Truck size={12} />
                {STATUS_CONFIG[o.status]?.label || o.deliveryStepAr || 'جاري التحديث...'}
              </div>
            ) : (
              <select
                value={o.status}
                onChange={(e) => updateStatus(o.id, e.target.value)}
                style={{ ...styles.statusSelect, color: STATUS_CONFIG[o.status]?.color, borderColor: (STATUS_CONFIG[o.status]?.color || '#999') + '44', background: STATUS_CONFIG[o.status]?.bg, flex: 1.4 }}
              >
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
              </select>
            )
          )}
          {o.conversationId && (
            <button onClick={() => onViewConversation?.(o.conversationId)} style={styles.orderActionBtn} title="عرض المحادثة">
              <MessageSquare size={14} />
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
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header alfhd-no-print">
        <div>
          <h2 style={styles.viewTitle}>الطلبات</h2>
          <p style={styles.viewSubtitle}>متابعة كاملة لطلباتك عبر مراحل التجهيز والتوصيل</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end' }}>
          <div style={styles.globalOrderSearchWrap}>
            <Search size={14} color="#60A5FA" />
            <input
              value={globalOrderSearch}
              onChange={(e) => setGlobalOrderSearch(e.target.value)}
              placeholder="بحث عام بالطلبات..."
              style={styles.globalOrderSearchInput}
            />
            {globalOrderSearch.trim().length >= 2 && (
              <div style={styles.globalOrderResultsBox}>
                {globalOrderResults.length === 0 ? (
                  <div style={styles.globalOrderEmpty}>لا توجد نتائج</div>
                ) : globalOrderResults.map((o) => {
                  const page = pages.find((p) => p.id === o.pageId);
                  return (
                    <button key={o.id} onClick={() => openOrderFromGlobalSearch(o)} style={styles.globalOrderResultItem}>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={styles.globalOrderResultTitle}>{o.customer || 'بدون اسم'} <span>#{o.orderNo}</span></div>
                        <div style={styles.globalOrderResultMeta}>{page?.name || 'بدون صفحة'} · {o.phone || 'بدون هاتف'}</div>
                      </div>
                      <OrderStagePill order={o} />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
          <input type="file" accept="image/*" ref={ocrInputRef} onChange={handlePickOcrImage} style={{ display: 'none' }} />
          <button onClick={() => ocrInputRef.current?.click()} style={styles.secondaryBtn} disabled={ocrLoading}>
            {ocrLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Image size={15} />}
            إضافة بالصورة
          </button>
          <button onClick={startNewOrder} style={styles.secondaryBtn}>
            <Plus size={15} /> إضافة طلب
          </button>
          {isReady && (
            <button onClick={handlePrintReady} style={styles.printBtn}>
              <Printer size={15} /> طباعة الآن
            </button>
          )}
        </div>
      </div>

      <div style={styles.statsRow} className="alfhd-stats-row alfhd-no-print">
        <ClickableStat icon={Package} label="إجمالي الطلبات" value={stats.total} color="#3B82F6"
          active={isDelivery && statusFilter === 'all'} onClick={() => { setSection('delivery'); setStatusFilter('all'); }} />
        <ClickableStat icon={Truck} label="قيد التوصيل" value={stats.pending} color="#3B82F6"
          active={isDelivery && statusFilter === 'pending'} onClick={() => { setSection('delivery'); setStatusFilter('pending'); }} />
        <ClickableStat icon={CheckCircle2} label="مستلمة" value={stats.delivered} color="#4ADE80"
          active={isDelivery && statusFilter === 'delivered'} onClick={() => { setSection('delivery'); setStatusFilter('delivered'); }} />
        <ClickableStat icon={XCircle} label="راجعة" value={stats.returned} color="#F45B69"
          active={isDelivery && statusFilter === 'returned'} onClick={() => { setSection('delivery'); setStatusFilter('returned'); }} />
      </div>

      <div style={styles.sectionTabs} className="alfhd-no-print">
        {ORDER_STAGES.map((st) => (
          <button
            key={st.id}
            onClick={() => { setSection(st.id); setStatusFilter('all'); }}
            style={{ ...styles.sectionTab, ...(section === st.id ? styles.sectionTabActive : {}) }}
          >
            {st.label}
            <span style={{ ...styles.convTabCount, ...(section === st.id ? styles.convTabCountActive : {}) }}>
              {stageCounts[st.id]}
            </span>
          </button>
        ))}
      </div>

      <OrderFilters
        pages={pages}
        datePreset={datePreset} setDatePreset={setDatePreset}
        customMonth={customMonth} setCustomMonth={setCustomMonth}
        customYear={customYear} setCustomYear={setCustomYear}
        pageFilter={selectedPage} setPageFilter={setSelectedPage}
        search={search} setSearch={setSearch}
        searchPlaceholder="رقم الطلب، الاسم، الهاتف، أو نوع الطلب..."
      />

      {isDelivery && (
        <div style={{ ...styles.filterChips, marginBottom: 16 }} className="alfhd-no-print">
          {['all', 'pending', 'delivered', 'returned'].map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{ ...styles.chip, ...(statusFilter === s ? styles.chipActive : {}) }}>
              {s === 'all' ? 'الكل' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      )}

      {isPrep ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {prepBatches.length === 0 ? (
            <div style={styles.emptyState}><Package size={32} color="#39425C" /><p>لا توجد طلبات قيد التجهيز</p></div>
          ) : prepBatches.map((batch) => (
            <div key={batch.batchId} style={styles.batchBlock}>
              <div style={styles.batchHeader} className="alfhd-no-print">
                <div style={styles.batchHeaderInfo}>
                  <Printer size={14} color="#3B82F6" />
                  <span>دفعة — {batch.orders.length} طلب</span>
                  {batch.printedAt && <span style={styles.batchHeaderTime}>{new Date(batch.printedAt).toLocaleString('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' })}</span>}
                </div>
                <button onClick={() => handleReprintBatch(batch.batchId, batch.orders)} style={styles.secondaryBtn}>
                  <Printer size={14} /> إعادة طباعة
                </button>
              </div>
              <div style={styles.ordersGrid} className={`alfhd-orders-grid${printTarget === batch.batchId ? ' alfhd-print-area' : ''}`}>
                {batch.orders.map(renderOrderCard)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={styles.ordersGrid} className={`alfhd-orders-grid${printTarget === 'ready' ? ' alfhd-print-area' : ''}`}>
          {stageOrders.length === 0 ? (
            <div style={styles.emptyState}>
              {isReady ? <Package size={32} color="#39425C" /> : <Truck size={32} color="#39425C" />}
              <p>{isReady ? 'لا توجد طلبات جاهزة للطباعة' : 'لا توجد طلبات لدى شركة التوصيل بعد'}</p>
            </div>
          ) : stageOrders.map(renderOrderCard)}
        </div>
      )}

      {detailOrder && (
        <OrderDetailModal
          order={detailOrder}
          page={pages.find((p) => p.id === detailOrder.pageId)}
          section={section}
          onClose={() => setDetailOrder(null)}
          onEdit={() => startEditOrder(detailOrder)}
          onDelete={() => handleDelete(detailOrder)}
          onShare={() => handleShare(detailOrder)}
          onViewConversation={detailOrder.conversationId ? () => { onViewConversation?.(detailOrder.conversationId); setDetailOrder(null); } : null}
          onMoveToDelivery={isPrep ? () => moveToDelivery(detailOrder) : null}
          onReprep={detailOrder.prepStatus === 'rejected' ? (note) => reprepOrder(detailOrder, note) : null}
          onContactCustomer={onContactCustomer}
        />
      )}

      {editingOrder && (
        <div style={styles.modalOverlay} onClick={() => !saving && setEditingOrder(null)}>
          <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingOrder.id ? 'تعديل الطلب' : 'إضافة طلب جديد'}</h3>
              <button onClick={() => setEditingOrder(null)} style={styles.modalClose}><X size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>الصفحة</label>
                <select value={editingOrder.pageId} onChange={(e) => setEditingOrder({ ...editingOrder, pageId: e.target.value })} style={styles.formInput}>
                  {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>اسم العميل</label>
                <input value={editingOrder.customer} onChange={(e) => setEditingOrder({ ...editingOrder, customer: e.target.value })} style={styles.formInput} placeholder="اسم الزبون" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>نوع الطلب</label>
                <input value={editingOrder.orderType} onChange={(e) => setEditingOrder({ ...editingOrder, orderType: e.target.value })} style={styles.formInput} placeholder="مثال: أرضيات سيارة" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>رقم الهاتف</label>
                <input value={editingOrder.phone} onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })} style={styles.formInput} placeholder="07XXXXXXXXX" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>المحافظة</label>
                <select
                  value={editingOrder.governorateCode || ''}
                  onChange={(e) => {
                    const gov = IRAQ_GOVERNORATES.find((g) => g.code === e.target.value);
                    setEditingOrder({ ...editingOrder, governorateCode: e.target.value, governorateName: gov?.name || '' });
                  }}
                  style={styles.formInput}
                >
                  <option value="">اختر المحافظة</option>
                  {IRAQ_GOVERNORATES.map((g) => <option key={g.code} value={g.code}>{g.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>المنطقة</label>
                <input value={editingOrder.area || ''} onChange={(e) => setEditingOrder({ ...editingOrder, area: e.target.value })} style={styles.formInput} placeholder="مثال: الكرادة" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>العنوان التفصيلي</label>
                <input value={editingOrder.address} onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })} style={styles.formInput} placeholder="أقرب نقطة دالة، رقم الدار..." />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>المنتجات / التفاصيل</label>
                <textarea value={editingOrder.items} onChange={(e) => setEditingOrder({ ...editingOrder, items: e.target.value })} style={{ ...styles.formInput, minHeight: 70, resize: 'vertical' }} placeholder="وصف المنتجات والكميات" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>المبلغ (د.ع)</label>
                <input type="number" value={editingOrder.total} onChange={(e) => setEditingOrder({ ...editingOrder, total: e.target.value })} style={styles.formInput} placeholder="0" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>ربط بمحادثة (اختياري)</label>
                <select value={editingOrder.conversationId || ''} onChange={(e) => setEditingOrder({ ...editingOrder, conversationId: e.target.value })} style={styles.formInput}>
                  <option value="">بدون ربط</option>
                  {conversations.map((c) => <option key={c.id} value={c.id}>{c.customer}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setEditingOrder(null)} style={styles.modalCancelBtn}>إلغاء</button>
              <button onClick={handleSaveOrder} style={styles.modalSaveBtn} disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ClickableStat({ icon: Icon, label, value, color, active, onClick }) {
  return (
    <button onClick={onClick} style={{ ...styles.statCard, ...(active ? { borderColor: color + '66', background: `linear-gradient(180deg, ${color}14, #111725)` } : {}), cursor: 'pointer', textAlign: 'right', width: '100%' }} className="alfhd-stat-card">
      <div style={{ ...styles.statIconWrap, background: `linear-gradient(135deg, ${color}22, ${color}0D)`, color, boxShadow: `0 4px 12px -4px ${color}55` }}>
        <Icon size={19} />
      </div>
      <div>
        <div style={styles.statValue}>{typeof value === 'number' && value > 999 ? value.toLocaleString() : value}</div>
        <div style={styles.statLabel}>{label}</div>
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
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>تفاصيل الطلب #{o.orderNo}</h3>
          <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
        </div>
        <div style={styles.modalBody}>
          {isRejected && (
            <div style={{ ...styles.rejectReasonBox, margin: 0 }}>
              <span style={styles.rejectReasonLabel}>لم يُجهَّز من المخزن{o.prepByName ? ` (${o.prepByName})` : ''}:</span>
              <span>{o.prepReason || 'بدون سبب محدد'}</span>
            </div>
          )}
          <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>العميل</span><span style={styles.detailGridValue}>{o.customer}</span></div>
          {page && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>الصفحة</span><span style={styles.detailGridValue}>{page.avatar} {page.name}</span></div>}
          {o.orderType && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>نوع الطلب</span><span style={styles.detailGridValue}>{o.orderType}</span></div>}
          {o.phone && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>الهاتف</span><span style={styles.detailGridValue}>{o.phone}</span></div>}
          {o.governorateName && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>المحافظة</span><span style={styles.detailGridValue}>{o.governorateName}</span></div>}
          {o.area && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>المنطقة</span><span style={styles.detailGridValue}>{o.area}</span></div>}
          {o.address && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>العنوان</span><span style={styles.detailGridValue}>{o.address}</span></div>}
          {o.deliveryStepAr && <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>حالة الشركة</span><span style={{ ...styles.detailGridValue, color: '#60A5FA', fontWeight: 700 }}>{o.deliveryStepAr}</span></div>}
          {o.items && (
            <div style={{ ...styles.detailGridRow, flexDirection: 'column', alignItems: 'flex-start', gap: 6 }}>
              <span style={styles.detailGridLabel}>المنتجات</span>
              <span style={{ ...styles.detailGridValue, whiteSpace: 'pre-wrap', textAlign: 'right' }}>{o.items}</span>
            </div>
          )}
          <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>المبلغ</span><span style={{ ...styles.detailGridValue, color: '#60A5FA', fontWeight: 800, fontSize: 16 }}>{Number(o.total).toLocaleString()} د.ع</span></div>
          <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>التاريخ</span><span style={styles.detailGridValue}>{o.date}</span></div>
          <div style={styles.detailGridRow}><span style={styles.detailGridLabel}>الرقم المرجعي</span><span style={{ ...styles.detailGridValue, fontFamily: 'monospace' }}>{o.fahdRef}</span></div>

          {reprepMode && (
            <div style={styles.formGroup}>
              <label style={styles.formLabel}>ملاحظة للمجهّز (اختياري)</label>
              <textarea value={reprepNote} onChange={(e) => setReprepNote(e.target.value)} style={{ ...styles.formInput, minHeight: 70, resize: 'vertical' }} placeholder="مثال: المنتج وصل المخزن، جهّزه من فضلك" autoFocus />
            </div>
          )}
        </div>
        <div style={{ ...styles.modalFooter, flexWrap: 'wrap' }}>
          {reprepMode ? (
            <>
              <button onClick={() => { setReprepMode(false); setReprepNote(''); }} style={styles.modalCancelBtn}>إلغاء</button>
              <button onClick={() => onReprep?.(reprepNote.trim())} style={styles.modalSaveBtn}>تأكيد إعادة التجهيز</button>
            </>
          ) : (
            <>
              {onReprep && (
                <button onClick={() => setReprepMode(true)} style={{ ...styles.modalSaveBtn, flex: '1 1 100%', marginBottom: 4, background: 'linear-gradient(135deg,#F0A868,#E0833C)' }}>
                  <RefreshCw size={15} style={{ marginLeft: 6, display: 'inline', verticalAlign: 'middle' }} /> إعادة الطلب للتجهيز
                </button>
              )}
              {onMoveToDelivery && (
                <button onClick={onMoveToDelivery} style={{ ...styles.modalSaveBtn, flex: '1 1 100%', marginBottom: 4 }}>
                  <Truck size={15} style={{ marginLeft: 6, display: 'inline', verticalAlign: 'middle' }} /> نقل لشركة التوصيل
                </button>
              )}
              <button onClick={onEdit} style={styles.detailActionBtn}><Edit3 size={14} /> تعديل</button>
              <button onClick={onShare} style={styles.detailActionBtn}><Send size={14} /> تحويل</button>
              {onViewConversation && <button onClick={onViewConversation} style={styles.detailActionBtn}><MessageSquare size={14} /> المحادثة</button>}
              {!onViewConversation && o.phone && onContactCustomer && (
                <button onClick={() => onContactCustomer(o.phone)} style={styles.detailActionBtn}><Phone size={14} /> الزبون</button>
              )}
              <button onClick={onDelete} style={{ ...styles.detailActionBtn, color: '#F45B69', borderColor: 'rgba(244,91,105,0.3)' }}><Trash2 size={14} /> حذف</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={styles.statCard} className="alfhd-stat-card">
      <div style={{ ...styles.statIconWrap, background: `linear-gradient(135deg, ${color}22, ${color}0D)`, color, boxShadow: `0 4px 12px -4px ${color}55` }}>
        <Icon size={19} />
      </div>
      <div>
        <div style={styles.statValue}>{typeof value === 'number' && value > 999 ? value.toLocaleString() : value}</div>
        <div style={styles.statLabel}>{label}</div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// عرض الإحصائيات
// ──────────────────────────────────────────────
function StatsView({ orders, pages, conversations, setOrders }) {
  const [statsPage, setStatsPage] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all');
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);

  const years = [];
  for (let y = new Date().getFullYear(); y >= 2024; y--) years.push(y);

  function isInRange(dateStr) {
    return dateInRange(dateStr, timeFilter, customMonth, customYear);
  }

  // كل الإحصائيات تحترم فلتر الصفحة + فلتر الوقت
  const scopedOrders = useMemo(() => {
    return orders.filter((o) => {
      if (statsPage !== 'all' && o.pageId !== statsPage) return false;
      if (!isInRange(o.createdAt || o.date)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        ...p,
        orderCount: pOrders.length,
        revenue: pOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0),
        convCount: pConvs.length,
      };
    });
  }, [pages, scopedOrders, conversations, statsPage]);

  const maxRevenue = Math.max(...perPage.map((p) => p.revenue), 1);

  // ── بيانات قسم الخلاصة ──
  const summary = useMemo(() => {
    const booked = scopedOrders;
    const converted = scopedOrders.filter((o) => o.converted);
    const sentToCompany = scopedOrders.filter((o) => o.stage === 'delivery');
    const sortingC = sentToCompany.filter((o) => o.deliveryStatus === 'sorting' || (!o.deliveryStatus && o.status === 'pending'));
    const deliveredC = sentToCompany.filter((o) => o.status === 'delivered');
    const returnedC = sentToCompany.filter((o) => o.status === 'returned');
    const neglected = scopedOrders.filter((o) => o.printed && !o.converted && o.stage !== 'delivery');
    return {
      booked: booked.length,
      converted: converted.length,
      sentToCompany: sentToCompany.length,
      sorting: sortingC.length,
      delivered: deliveredC.length,
      returned: returnedC.length,
      neglected: neglected.length,
    };
  }, [scopedOrders]);

  // ── الأكثر مبيعاً (حسب نوع السيارة/الطلب) ──
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

  const [panel, setPanel] = useState(null); // null | 'summary' | 'bestSellers' | 'converted' | 'neglected'

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header">
        <div>
          <h2 style={styles.viewTitle}>الإحصائيات</h2>
          <p style={styles.viewSubtitle}>نظرة شاملة على الأداء مع فلاتر دقيقة</p>
        </div>
        <div style={styles.pageSelectWrap}>
          <Facebook size={15} color="#3B82F6" />
          <select value={statsPage} onChange={(e) => setStatsPage(e.target.value)} style={styles.pageSelect}>
            <option value="all">كل الصفحات</option>
            {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown size={14} color="#5E6986" />
        </div>
      </div>

      <div style={styles.filtersWrap} className="alfhd-no-print">
        <div style={styles.filterBottomRow}>
          <div style={styles.pageSelectWrap}>
            <Calendar size={15} color="#60A5FA" />
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={styles.pageSelect}>
              {DATE_PRESETS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <ChevronDown size={14} color="#5E6986" />
          </div>
          {timeFilter === 'custom' && (
            <>
              <select value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} style={styles.customDateSelectCompact}>
                {AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={customYear} onChange={(e) => setCustomYear(e.target.value)} style={styles.customDateSelectCompact}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      <div style={styles.statsRow} className="alfhd-stats-row">
        <StatCard icon={Package} label="إجمالي الطلبات" value={breakdown.total} color="#3B82F6" />
        <StatCard icon={MessageSquare} label="من المحادثات" value={breakdown.fromChat} color="#5B8DEF" />
        <StatCard icon={Edit3} label="مضافة يدوياً" value={breakdown.manual} color="#4ADE80" />
        <StatCard icon={Send} label="طلبات محوّلة" value={breakdown.converted} color="#A78BFA" />
      </div>

      <div style={styles.statsRow} className="alfhd-stats-row">
        <StatCard icon={Truck} label="قيد التوصيل" value={overall.pending} color="#3B82F6" />
        <StatCard icon={CheckCircle2} label="نسبة التسليم" value={`${overall.deliveryRate}%`} color="#4ADE80" />
        <StatCard icon={XCircle} label="نسبة الإرجاع" value={`${overall.returnRate}%`} color="#F45B69" />
        <StatCard icon={Sparkles} label="الإيرادات" value={`${overall.revenue.toLocaleString()} د.ع`} color="#3B82F6" />
      </div>

      <div style={styles.chartCard}>
        <h3 style={styles.chartTitle}>الإيرادات حسب الصفحة</h3>
        <div style={styles.barChartArea}>
          {perPage.map((p) => (
            <div key={p.id} style={styles.barChartRow} className="alfhd-bar-chart-row">
              <div style={styles.barChartLabel}>
                <span>{p.avatar}</span>
                <span>{p.name}</span>
              </div>
              <div style={styles.barChartTrack}>
                <div style={{ ...styles.barChartFill, width: `${(p.revenue / maxRevenue) * 100}%` }} />
              </div>
              <div style={styles.barChartValue}>{p.revenue.toLocaleString()} د.ع</div>
            </div>
          ))}
        </div>
      </div>

      <div style={styles.statsGrid2} className="alfhd-stats-grid-2">
        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>توزيع حالات الطلبات</h3>
          <div style={styles.donutWrap}>
            <DonutChart
              data={[
                { label: 'مستلم', value: overall.delivered, color: '#4ADE80' },
                { label: 'قيد التوصيل', value: overall.pending, color: '#3B82F6' },
                { label: 'راجع', value: overall.returned, color: '#F45B69' },
              ]}
            />
          </div>
        </div>

        <div style={styles.chartCard}>
          <h3 style={styles.chartTitle}>محادثات كل صفحة</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 }}>
            {perPage.map((p) => (
              <div key={p.id} style={styles.pageStatRow}>
                <div style={styles.pageStatInfo}>
                  <span style={{ fontSize: 20 }}>{p.avatar}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#EAF0FB' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#5E6986' }}>{p.orderCount} طلب</div>
                  </div>
                </div>
                <div style={styles.pageStatBadge}>{p.convCount} محادثة</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.statsBottomBtns}>
        <button onClick={() => setPanel('bestSellers')} style={styles.statsSmallBtn}>
          <Sparkles size={15} /> الأكثر مبيعاً
        </button>
        <button onClick={() => setPanel('summary')} style={styles.statsSummaryBtn}>
          <BarChart3 size={16} /> الخلاصة الكاملة
        </button>
      </div>

      {panel === 'summary' && (
        <StatsSummaryPanel
          summary={summary}
          onClose={() => setPanel(null)}
          onOpenConverted={() => setPanel('converted')}
          onOpenNeglected={() => setPanel('neglected')}
        />
      )}
      {panel === 'bestSellers' && (
        <BestSellersPanel data={bestSellers} onClose={() => setPanel(null)} />
      )}
      {panel === 'converted' && (
        <ConvertedOrdersPanel orders={convertedOrders} pages={pages} onClose={() => setPanel('summary')} />
      )}
      {panel === 'neglected' && (
        <NeglectedOrdersPanel orders={neglectedOrders} pages={pages} setOrders={setOrders} onClose={() => setPanel('summary')} />
      )}
    </div>
  );
}

// لوحة الخلاصة الكاملة
function StatsSummaryPanel({ summary, onClose, onOpenConverted, onOpenNeglected }) {
  const rows = [
    { label: 'الطلبات المحجوزة', value: summary.booked, color: '#3B82F6' },
    { label: 'الطلبات المحوّلة', value: summary.converted, color: '#A78BFA', onClick: onOpenConverted },
    { label: 'أُرسلت لشركة التوصيل', value: summary.sentToCompany, color: '#60A5FA' },
    { label: '— قيد التوصيل', value: summary.sorting, color: '#3B82F6', sub: true },
    { label: '— مستلمة', value: summary.delivered, color: '#4ADE80', sub: true },
    { label: '— راجعة', value: summary.returned, color: '#F45B69', sub: true },
    { label: 'الطلبات المهملة', value: summary.neglected, color: '#F0A868', onClick: onOpenNeglected },
  ];
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>الخلاصة الكاملة</h3>
          <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
        </div>
        <div style={styles.modalBody}>
          {rows.map((r, i) => (
            <div
              key={i}
              onClick={r.onClick}
              style={{
                ...styles.summaryRow,
                ...(r.sub ? styles.summaryRowSub : {}),
                ...(r.onClick ? { cursor: 'pointer' } : {}),
              }}
            >
              <span style={{ ...styles.summaryRowLabel, color: r.sub ? '#8B96AD' : '#EAF0FB' }}>
                {r.label}
                {r.onClick && <ArrowUpRight size={13} style={{ marginRight: 4, display: 'inline', verticalAlign: 'middle', color: r.color }} />}
              </span>
              <span style={{ ...styles.summaryRowValue, color: r.color }}>{r.value}</span>
            </div>
          ))}
          <p style={styles.summaryHint}>اضغط على "المحوّلة" أو "المهملة" لعرض تفاصيلها</p>
        </div>
      </div>
    </div>
  );
}

// لوحة الأكثر مبيعاً
function BestSellersPanel({ data, onClose }) {
  const max = Math.max(...data.map((d) => d.count), 1);
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>الأكثر مبيعاً</h3>
          <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
        </div>
        <div style={styles.modalBody}>
          {data.length === 0 ? (
            <div style={styles.emptyState}><Package size={28} color="#39425C" /><p>لا توجد بيانات كافية</p></div>
          ) : data.map((d, i) => (
            <div key={i} style={styles.bestSellerRow}>
              <div style={styles.bestSellerRank}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.bestSellerType}>{d.type}</div>
                <div style={styles.bestSellerTrack}>
                  <div style={{ ...styles.bestSellerFill, width: `${(d.count / max) * 100}%` }} />
                </div>
              </div>
              <div style={styles.bestSellerCount}>{d.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// لوحة الطلبات المحوّلة (مع بحث وفلتر)
function ConvertedOrdersPanel({ orders, pages, onClose }) {
  const [q, setQ] = useState('');
  const shown = orders.filter((o) => {
    if (!q) return true;
    const s = q.trim().toLowerCase();
    return [o.customer, o.orderNo, o.phone, o.orderType, o.convertedByName].filter(Boolean).join(' ').toLowerCase().includes(s);
  });
  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxHeight: '85vh' }} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>الطلبات المحوّلة ({orders.length})</h3>
          <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
        </div>
        <div style={styles.modalBody}>
          <div style={{ ...styles.searchBox, marginBottom: 14 }}>
            <Search size={15} color="#5E6986" />
            <input placeholder="بحث بالاسم، الرقم، الهاتف، أو المدير..." value={q} onChange={(e) => setQ(e.target.value)} style={styles.searchInput} />
          </div>
          {shown.length === 0 ? (
            <div style={styles.emptyState}><Send size={28} color="#39425C" /><p>لا توجد طلبات محوّلة</p></div>
          ) : shown.map((o) => {
            const page = pages.find((p) => p.id === o.pageId);
            return (
              <div key={o.id} style={styles.convertedRow}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.convertedCustomer}>{o.customer} <span style={{ fontSize: 11, color: '#5E6986' }}>#{o.orderNo}</span></div>
                  {o.orderType && <div style={styles.convertedSub}>{o.orderType}</div>}
                  <div style={styles.convertedMeta}>
                    {page && <span>{page.avatar} {page.name}</span>}
                    {o.convertedByName && <span> · حوّله: {o.convertedByName}</span>}
                    {o.convertedAt && <span> · {new Date(o.convertedAt).toLocaleDateString('ar-IQ')}</span>}
                  </div>
                </div>
                <div style={styles.convertedTotal}>{Number(o.total).toLocaleString()} د.ع</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// لوحة الطلبات المهملة (تحديد متعدد + إعادة طباعة)
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
    // أعدها لمرحلة التجهيز بدفعة طباعة جديدة
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
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={{ ...styles.modal, maxHeight: '85vh' }} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
        <div style={styles.modalHeader}>
          <h3 style={styles.modalTitle}>الطلبات المهملة ({orders.length})</h3>
          <button onClick={onClose} style={styles.modalClose}><X size={18} /></button>
        </div>
        <div style={styles.modalBody}>
          <p style={styles.summaryHint}>طلبات طُبعت لكن لم تُحوّل ولم تُرسل لشركة التوصيل. حدّد ما تريد وأعد طباعته.</p>
          <div style={{ ...styles.searchBox, marginBottom: 12 }}>
            <Search size={15} color="#5E6986" />
            <input placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} style={styles.searchInput} />
          </div>
          {shown.length === 0 ? (
            <div style={styles.emptyState}><Package size={28} color="#39425C" /><p>لا توجد طلبات مهملة</p></div>
          ) : shown.map((o) => {
            const page = pages.find((p) => p.id === o.pageId);
            const isSel = selected.has(o.id);
            return (
              <div key={o.id} onClick={() => toggle(o.id)} style={{ ...styles.neglectedRow, ...(isSel ? styles.neglectedRowSel : {}) }}>
                <div style={{ ...styles.neglectedCheck, ...(isSel ? styles.neglectedCheckOn : {}) }}>
                  {isSel && <CheckCircle2 size={14} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.convertedCustomer}>{o.customer} <span style={{ fontSize: 11, color: '#5E6986' }}>#{o.orderNo}</span></div>
                  {o.orderType && <div style={styles.convertedSub}>{o.orderType}</div>}
                  {page && <div style={styles.convertedMeta}>{page.avatar} {page.name}</div>}
                </div>
                <div style={styles.convertedTotal}>{Number(o.total).toLocaleString()} د.ع</div>
              </div>
            );
          })}
        </div>
        <div style={styles.modalFooter}>
          <button onClick={onClose} style={styles.modalCancelBtn}>إغلاق</button>
          <button onClick={reprintSelected} style={styles.modalSaveBtn}>
            <Printer size={15} style={{ marginLeft: 6, display: 'inline', verticalAlign: 'middle' }} />
            إعادة طباعة ({selected.size})
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#222C42" strokeWidth="18" />
        {data.map((d, i) => {
          const fraction = d.value / total;
          const dash = fraction * circumference;
          const offset = -cumulative * circumference;
          cumulative += fraction;
          return (
            <circle
              key={i}
              cx="80" cy="80" r={radius}
              fill="none"
              stroke={d.color}
              strokeWidth="18"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={offset}
              transform="rotate(-90 80 80)"
              strokeLinecap="round"
            />
          );
        })}
        <text x="80" y="76" textAnchor="middle" fontSize="22" fontWeight="700" fill="#EAF0FB">{total}</text>
        <text x="80" y="94" textAnchor="middle" fontSize="11" fill="#5E6986">طلب</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
            <span style={{ fontSize: 12, color: '#8B96AD' }}>{d.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#EAF0FB' }}>{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// عرض الصفحات المرتبطة
// ──────────────────────────────────────────────
function PagesView({ pages, setPages }) {
  const [exchanging, setExchanging] = useState(false);
  const [fbError, setFbError] = useState('');
  const [fbCandidates, setFbCandidates] = useState(null); // صفحات فيسبوك التي جاءت من OAuth بانتظار اختيار المستخدم
  const [subscribingId, setSubscribingId] = useState(null);

  // عند تحميل الصفحة: تحقق إن كان الرابط يحوي ?code= (يعني فيسبوك رجّعنا بعد الموافقة)
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
      // نظّف الرابط فوراً حتى لا يُعاد استخدام نفس الكود عند تحديث الصفحة
      window.history.replaceState({}, '', window.location.pathname);
      exchangeCodeForPages(code);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const exchangeCodeForPages = async (code) => {
    setExchanging(true);
    setFbError('');
    try {
      const res = await fetch(FB_EXCHANGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ code, redirectUri: FB_REDIRECT_URI }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'فشل الاتصال بفيسبوك');
      }
      if (!data.pages || data.pages.length === 0) {
        setFbError('لم يتم العثور على أي صفحة فيسبوك مرتبطة بحسابك. تأكد أنك مدير لصفحة فيسبوك واحدة على الأقل ووافقت على الصلاحيات المطلوبة.');
        return;
      }
      setFbCandidates(data.pages);
    } catch (e) {
      console.error('FB exchange failed:', e);
      setFbError(e.message || 'حدث خطأ غير متوقع أثناء الربط مع فيسبوك');
    } finally {
      setExchanging(false);
    }
  };

  const confirmAddPage = async (candidate) => {
    const emojis = ['🦅', '👔', '🛍️', '📱', '🏪', '✨', '🎯', '💎'];
    const avatar = emojis[pages.length % emojis.length];
    try {
      const [created] = await sbInsert('alfhd_pages', {
        name: candidate.name,
        avatar,
        source: 'facebook',
        connected: true,
        fb_page_id: candidate.fb_page_id,
        page_access_token: candidate.page_access_token,
      });
      setPages((prev) => [...prev, mapPageFromDb(created)]);
      setFbCandidates((prev) => prev.filter((c) => c.fb_page_id !== candidate.fb_page_id));
      // تفعيل استقبال الرسائل تلقائياً فور ربط الصفحة، بدون انتظار ضغطة زر إضافية
      await subscribePage(created.id);
    } catch (e) {
      console.error('Failed to add page:', e);
      alert('تعذّر حفظ الصفحة، حاول مجدداً');
    }
  };

  const removePage = async (id) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    try {
      await sbDelete('alfhd_pages', id);
    } catch (e) {
      console.error('Failed to delete page:', e);
    }
  };

  const subscribePage = async (pageId) => {
    setSubscribingId(pageId);
    try {
      const res = await fetch(FB_SUBSCRIBE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'apikey': SUPABASE_KEY,
        },
        body: JSON.stringify({ pageId }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'فشل تفعيل استقبال الرسائل');
      }
      alert('تم تفعيل استقبال الرسائل الحقيقية لهذه الصفحة بنجاح ✅');
    } catch (e) {
      console.error('Subscribe failed:', e);
      alert('تعذّر تفعيل استقبال الرسائل: ' + (e.message || ''));
    } finally {
      setSubscribingId(null);
    }
  };

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header">
        <div>
          <h2 style={styles.viewTitle}>الصفحات المرتبطة</h2>
          <p style={styles.viewSubtitle}>اربط صفحات فيسبوك الحقيقية التي تديرها لإدارة محادثاتها وطلباتها</p>
        </div>
        <button onClick={startFacebookLogin} style={styles.addBtn} disabled={exchanging}>
          <Facebook size={16} />
          {exchanging ? 'جارٍ الاتصال بفيسبوك...' : 'ربط صفحة جديدة'}
        </button>
      </div>

      {fbError && (
        <div style={styles.fbErrorBox}>
          <XCircle size={16} />
          <span>{fbError}</span>
        </div>
      )}

      {exchanging && (
        <div style={styles.fbExchangingBox}>
          جارٍ التحقق من حسابك على فيسبوك وجلب صفحاتك...
        </div>
      )}

      {fbCandidates && fbCandidates.length > 0 && (
        <div style={styles.fbCandidatesWrap}>
          <div style={styles.fbCandidatesTitle}>اختر الصفحة (أو الصفحات) التي تريد ربطها:</div>
          {fbCandidates.map((c) => (
            <div key={c.fb_page_id} style={styles.fbCandidateRow}>
              {c.avatar ? (
                <img src={c.avatar} alt="" style={styles.fbCandidateAvatarImg} />
              ) : (
                <div style={styles.pageCardAvatar}>📘</div>
              )}
              <div style={{ flex: 1 }}>
                <div style={styles.pageCardName}>{c.name}</div>
                <div style={styles.fbCandidateId}>معرّف الصفحة: {c.fb_page_id}</div>
              </div>
              <button onClick={() => confirmAddPage(c)} style={styles.confirmBtn}>
                ربط هذه الصفحة
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={styles.pagesGrid} className="alfhd-pages-grid">
        {pages.map((p) => (
          <div key={p.id} style={styles.pageCard} className="alfhd-order-card">
            <div style={styles.pageCardTopLine} />
            <div style={styles.pageCardHeader}>
              <div style={styles.pageCardAvatar}>{p.avatar}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={styles.pageCardName}>{p.name}</div>
                <div style={styles.pageCardMeta}>Facebook Page · {p.fbPageId || 'غير معروف'}</div>
              </div>
              <button onClick={() => removePage(p.id)} style={styles.iconBtnDanger} title="حذف الصفحة">
                <Trash2 size={15} />
              </button>
            </div>
            <div style={{ ...styles.pageStatusPill, ...(p.connected ? styles.pageStatusPillOk : styles.pageStatusPillWait) }}>
              <span style={{ ...styles.liveDot, background: p.connected ? '#4ADE80' : '#60A5FA' }} />
              {p.connected ? 'متصلة وتستقبل البيانات' : 'بانتظار إكمال الربط'}
            </div>
            {p.connected && (
              <button
                onClick={() => subscribePage(p.id)}
                style={styles.subscribeBtn}
                disabled={subscribingId === p.id}
              >
                {subscribingId === p.id ? 'جارٍ التفعيل...' : 'تفعيل/تحديث استقبال الرسائل'}
              </button>
            )}
          </div>
        ))}

        {pages.length === 0 && (
          <div style={styles.emptyStateLg}>
            <Facebook size={40} color="#39425C" />
            <p>لا توجد صفحات مرتبطة بعد</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────
// عرض إدارة المستخدمين
// ──────────────────────────────────────────────
const PERMISSIONS_LIST = [
  { id: 'conversations', label: 'عرض المحادثات' },
  { id: 'orders_view', label: 'عرض الطلبات' },
  { id: 'orders_edit', label: 'تعديل حالة الطلبات' },
  { id: 'stats', label: 'عرض الإحصائيات' },
  { id: 'pages_manage', label: 'إدارة الصفحات' },
  { id: 'users_manage', label: 'إدارة المستخدمين' },
];

function AdminView({ users, setUsers, orders, conversations, onViewConversation, onContactWhatsApp }) {
  const [adminTab, setAdminTab] = useState('managers'); // managers | warehouse | fulfillment
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

  // طلبات التجهيز: المجهّزة والمرفوضة
  const fulfillmentOrders = useMemo(() => {
    return orders.filter((o) => o.prepStatus === 'done' || o.prepStatus === 'rejected')
      .sort((a, b) => new Date(b.prepAt || 0) - new Date(a.prepAt || 0));
  }, [orders]);

  const ADMIN_TABS = [
    { id: 'managers', label: 'المدراء', icon: ShieldCheck },
    { id: 'warehouse', label: 'موظفي المخزن', icon: Package },
    { id: 'fulfillment', label: 'متابعة التجهيز', icon: CheckCircle2 },
  ];

  function UserCard({ u, isWarehouse }) {
    return (
      <div style={{ ...styles.userCard, opacity: u.active ? 1 : 0.5 }} className="alfhd-order-card">
        <div style={styles.userCardTop}>
          <div style={{ ...styles.userCardAvatar, background: u.role === 'admin' ? 'linear-gradient(135deg,#60A5FA,#1D4ED8)' : '#222C42', color: u.role === 'admin' ? '#fff' : '#3B82F6' }}>
            {u.name[0]}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={styles.userCardName}>{u.name}</div>
            <div style={styles.userCardRole}>
              {u.role === 'admin' ? <><ShieldCheck size={12} color="#4ADE80" /> مدير عام</>
                : u.role === 'warehouse' ? <><Package size={12} color="#F0A868" /> {u.jobTitle || 'موظف مخزن'}</>
                : <><Shield size={12} color="#3B82F6" /> مدير ({(u.permissions || []).length} صلاحية)</>}
            </div>
          </div>
          <div style={{ ...styles.activeDot, background: u.active ? '#4ADE80' : '#5E6986' }} />
        </div>

        <div style={styles.userCardMetaRow}>
          <span style={styles.userCodeTag}>الرمز: {u.code}</span>
          {isWarehouse && u.whatsapp && <span style={styles.userCodeTag}>واتساب: {u.whatsapp}</span>}
        </div>

        {u.role === 'manager' && (u.permissions || []).length > 0 && (
          <div style={styles.userPermsList}>
            {u.permissions.map((pId) => {
              const perm = PERMISSIONS_LIST.find((p) => p.id === pId);
              return perm ? <span key={pId} style={styles.permTag}>{perm.label}</span> : null;
            })}
          </div>
        )}

        <div style={styles.userCardActions}>
          <button onClick={() => openEdit(u)} style={styles.userActionBtn}><Edit3 size={13} /> تعديل</button>
          <button onClick={() => toggleActive(u.id)} style={styles.userActionBtn}>
            {u.active ? <EyeOff size={13} /> : <Eye size={13} />} {u.active ? 'تعطيل' : 'تفعيل'}
          </button>
          {u.role !== 'admin' && (
            <button onClick={() => deleteUser(u.id)} style={{ ...styles.userActionBtn, color: '#F45B69' }}><Trash2 size={13} /> حذف</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header">
        <div>
          <h2 style={styles.viewTitle}>الإدارة العامة</h2>
          <p style={styles.viewSubtitle}>المدراء، موظفو المخزن، ومتابعة تجهيز الطلبات</p>
        </div>
        {adminTab === 'managers' && <button onClick={openAddManager} style={styles.addBtn}><UserPlus size={16} /> إضافة مدير</button>}
        {adminTab === 'warehouse' && <button onClick={openAddWarehouse} style={styles.addBtn}><UserPlus size={16} /> إضافة موظف مخزن</button>}
      </div>

      <div style={styles.sectionTabs}>
        {ADMIN_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setAdminTab(t.id)} style={{ ...styles.sectionTab, ...(adminTab === t.id ? styles.sectionTabActive : {}) }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {adminTab === 'managers' && (
        <div style={styles.usersGrid} className="alfhd-users-grid">
          {managers.map((u) => <UserCard key={u.id} u={u} />)}
        </div>
      )}

      {adminTab === 'warehouse' && (
        warehouse.length === 0 ? (
          <div style={styles.emptyState}><Package size={32} color="#39425C" /><p>لا يوجد موظفو مخزن بعد</p></div>
        ) : (
          <div style={styles.usersGrid} className="alfhd-users-grid">
            {warehouse.map((u) => <UserCard key={u.id} u={u} isWarehouse />)}
          </div>
        )
      )}

      {adminTab === 'fulfillment' && (
        <FulfillmentList orders={fulfillmentOrders} users={users} onViewConversation={onViewConversation} onContactWhatsApp={onContactWhatsApp} />
      )}

      {showAdd && (
        <div style={styles.modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {editingUser ? 'تعديل' : (form.role === 'warehouse' ? 'إضافة موظف مخزن' : 'إضافة مدير')}
              </h3>
              <button onClick={() => setShowAdd(false)} style={styles.modalClose}><X size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>الاسم</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={styles.formInput} placeholder="اسم الموظف" />
              </div>

              {form.role === 'warehouse' && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>المسمى الوظيفي</label>
                    <input value={form.jobTitle} onChange={(e) => setForm({ ...form, jobTitle: e.target.value })} style={styles.formInput} placeholder="مثال: مسؤول تجهيز" />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>رقم واتساب</label>
                    <input value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} style={styles.formInput} placeholder="07XXXXXXXXX" />
                  </div>
                </>
              )}

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>رمز الدخول (4 أرقام)</label>
                <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} style={styles.formInput} placeholder="1234" inputMode="numeric" />
              </div>

              {form.role !== 'warehouse' && (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.formLabel}>نوع المدير</label>
                    <div style={styles.roleToggle}>
                      <button onClick={() => setForm({ ...form, role: 'admin' })} style={{ ...styles.roleBtn, ...(form.role === 'admin' ? styles.roleBtnActive : {}) }}>
                        <ShieldCheck size={14} /> مدير عام
                      </button>
                      <button onClick={() => setForm({ ...form, role: 'manager' })} style={{ ...styles.roleBtn, ...(form.role === 'manager' ? styles.roleBtnActive : {}) }}>
                        <Shield size={14} /> صلاحية محددة
                      </button>
                    </div>
                  </div>

                  {form.role === 'manager' && (
                    <div style={styles.formGroup}>
                      <label style={styles.formLabel}>الصلاحيات</label>
                      <div style={styles.permsGrid}>
                        {PERMISSIONS_LIST.map((perm) => (
                          <label key={perm.id} style={styles.permCheckRow}>
                            <input type="checkbox" checked={form.permissions.includes(perm.id)} onChange={() => togglePermission(perm.id)} style={styles.checkbox} />
                            <span>{perm.label}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              {form.role === 'warehouse' && (
                <div style={styles.warehouseNote}>
                  <AlertCircle size={14} color="#F0A868" />
                  <span>موظف المخزن يرى فقط الطلبات المثبتة من كل الصفحات، ويعلّمها "تم التجهيز" أو "لم يتم" بدون صلاحية تعديل أو حذف.</span>
                </div>
              )}

              {formError && <p style={{ color: '#F45B69', fontSize: 12, margin: 0 }}>{formError}</p>}
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setShowAdd(false)} style={styles.modalCancelBtn}>إلغاء</button>
              <button onClick={saveUser} style={styles.modalSaveBtn} disabled={saving}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FulfillmentList({ orders, users, onViewConversation, onContactWhatsApp }) {
  const [filter, setFilter] = useState('all'); // all | done | rejected
  const [timeFilter, setTimeFilter] = useState('all');
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const years = [];
  for (let y = new Date().getFullYear(); y >= 2024; y--) years.push(y);

  function inTime(dateStr) {
    return dateInRange(dateStr, timeFilter, customMonth, customYear);
  }

  const shown = orders.filter((o) => (filter === 'all' || o.prepStatus === filter) && inTime(o.prepAt));


  if (orders.length === 0) {
    return <div style={styles.emptyState}><CheckCircle2 size={32} color="#39425C" /><p>لا توجد طلبات تم التعامل معها بعد</p></div>;
  }

  return (
    <div>
      <div style={styles.filterChips} className="alfhd-no-print">
        {[['all', 'الكل'], ['done', 'تم التجهيز'], ['rejected', 'لم يتم']].map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)} style={{ ...styles.chip, ...(filter === id ? styles.chipActive : {}) }}>{label}</button>
        ))}
      </div>
      <div style={{ ...styles.filtersWrap, marginTop: 10 }} className="alfhd-no-print">
        <div style={styles.filterBottomRow}>
          <div style={styles.pageSelectWrap}>
            <Calendar size={15} color="#60A5FA" />
            <select value={timeFilter} onChange={(e) => setTimeFilter(e.target.value)} style={styles.pageSelect}>
              {DATE_PRESETS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
            </select>
            <ChevronDown size={14} color="#5E6986" />
          </div>
          {timeFilter === 'custom' && (
            <>
              <select value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} style={styles.customDateSelectCompact}>
                {AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={customYear} onChange={(e) => setCustomYear(e.target.value)} style={styles.customDateSelectCompact}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      <div style={{ ...styles.ordersGrid, marginTop: 14 }}>
        {shown.map((o) => {
          const prepUser = users.find((u) => u.id === o.prepBy);
          const isDone = o.prepStatus === 'done';
          const prepTime = o.prepAt ? new Date(o.prepAt).toLocaleString('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' }) : null;
          return (
            <div
              key={o.id}
              style={{ ...styles.orderCard, ...(isDone ? {} : styles.rejectedCard) }}
              className="alfhd-order-card"
            >
              {!isDone && (
                <div style={styles.rejectedBanner}>
                  <AlertCircle size={16} />
                  <span>طلب لم يُجهَّز — يحتاج متابعة عاجلة</span>
                </div>
              )}

              <div style={styles.orderTicketHead}>
                <div style={{ ...styles.orderTicketAvatar, background: isDone ? 'rgba(74,222,128,0.15)' : 'rgba(244,91,105,0.18)', color: isDone ? '#4ADE80' : '#F45B69', border: 'none' }}>
                  {isDone ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.orderCardCustomer}>{o.customer} <span style={{ fontSize: 12, color: '#5E6986' }}>#{o.orderNo}</span></div>
                  <div style={styles.orderTicketPage}>المجهّز: {o.prepByName || prepUser?.name || 'غير معروف'}</div>
                </div>
                <div style={{ ...styles.orderStatusPill, color: isDone ? '#4ADE80' : '#F45B69', background: isDone ? 'rgba(74,222,128,0.12)' : 'rgba(244,91,105,0.16)' }}>
                  {isDone ? 'تم التجهيز' : 'لم يتم'}
                </div>
              </div>

              {prepTime && (
                <div style={styles.prepTimeRow}>
                  <Calendar size={12} color="#5E6986" />
                  <span>{isDone ? 'وقت التجهيز' : 'وقت الرفض'}: {prepTime}</span>
                </div>
              )}

              {!isDone && o.prepReason && (
                <div style={styles.rejectReasonBox}>
                  <span style={styles.rejectReasonLabel}>سبب عدم التجهيز:</span>
                  <span>{o.prepReason}</span>
                </div>
              )}

              {o.items && <div style={{ ...styles.orderTicketItems, margin: '0 16px 12px' }}>{o.items}</div>}

              {!isDone && (
                <div style={styles.orderCardActions}>
                  {prepUser?.whatsapp && (
                    <button onClick={() => onContactWhatsApp?.(prepUser.whatsapp)} style={styles.orderActionBtn} title="اتصال بالمجهّز عبر واتساب">
                      <Phone size={14} /> <span style={{ fontSize: 11, fontWeight: 700 }}>المجهّز</span>
                    </button>
                  )}
                  {o.conversationId ? (
                    <button onClick={() => onViewConversation?.(o.conversationId)} style={styles.orderActionBtn} title="مراسلة الزبون">
                      <MessageSquare size={14} /> <span style={{ fontSize: 11, fontWeight: 700 }}>الزبون</span>
                    </button>
                  ) : o.phone ? (
                    <button onClick={() => onContactWhatsApp?.(o.phone)} style={styles.orderActionBtn} title="الاتصال بالزبون">
                      <Phone size={14} /> <span style={{ fontSize: 11, fontWeight: 700 }}>الزبون</span>
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

// واجهة موظف المخزن المبسطة — يرى فقط الطلبات المثبتة ويعلّمها تم/لم يتم
function WarehouseView({ orders, setOrders, currentUser, onLogout }) {
  const [rejectOrder, setRejectOrder] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [dayFilter, setDayFilter] = useState('all');
  const [customMonth, setCustomMonth] = useState(new Date().getMonth() + 1);
  const [customYear, setCustomYear] = useState(new Date().getFullYear());
  const years = [];
  for (let y = new Date().getFullYear(); y >= 2024; y--) years.push(y);
  const knownPrepIdsRef = React.useRef(null);

  // الطلبات المثبتة (المصدر chat) التي لم تُجهَّز بعد، من كل الصفحات
  const pendingPrep = useMemo(() => {
    return orders.filter((o) => o.source === 'chat' && !o.converted && !o.prepStatus)
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  }, [orders]);

  // صوت إشعار عند وصول طلب جديد للتجهيز
  useEffect(() => {
    const ids = new Set(pendingPrep.map((o) => o.id));
    if (knownPrepIdsRef.current) {
      const hasNew = pendingPrep.some((o) => !knownPrepIdsRef.current.has(o.id));
      if (hasNew) playNotificationSound();
    }
    knownPrepIdsRef.current = ids;
  }, [pendingPrep]);

  function dayMatch(dateStr, which) {
    return dateInRange(dateStr, which, customMonth, customYear);
  }

  const dayCounts = useMemo(() => {
    const out = {};
    DATE_PRESETS.forEach((f) => { out[f.id] = pendingPrep.filter((o) => dayMatch(o.createdAt, f.id)).length; });
    return out;
  }, [pendingPrep, customMonth, customYear]);

  const shownPrep = useMemo(
    () => pendingPrep.filter((o) => dayMatch(o.createdAt, dayFilter)),
    [pendingPrep, dayFilter]
  );

  async function markDone(o) {
    setSaving(true);
    const patch = { prep_status: 'done', prep_by: currentUser.id, prep_by_name: currentUser.name, prep_at: new Date().toISOString() };
    setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, prepStatus: 'done', prepBy: currentUser.id, prepByName: currentUser.name, prepAt: patch.prep_at } : x));
    try { await sbUpdate('alfhd_orders', o.id, patch); } catch (e) { console.error(e); }
    setSaving(false);
  }

  async function confirmReject() {
    if (!rejectReason.trim()) { alert('اكتب سبب عدم التجهيز'); return; }
    setSaving(true);
    const o = rejectOrder;
    const patch = { prep_status: 'rejected', prep_reason: rejectReason.trim(), prep_by: currentUser.id, prep_by_name: currentUser.name, prep_at: new Date().toISOString() };
    setOrders((prev) => prev.map((x) => x.id === o.id ? { ...x, prepStatus: 'rejected', prepReason: rejectReason.trim(), prepBy: currentUser.id, prepByName: currentUser.name, prepAt: patch.prep_at } : x));
    try { await sbUpdate('alfhd_orders', o.id, patch); } catch (e) { console.error(e); }
    setRejectOrder(null); setRejectReason(''); setSaving(false);
  }

  return (
    <div style={styles.warehouseWrap}>
      <div style={styles.warehouseHeader}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={styles.warehouseBadge}>{shownPrep.length}</div>
          <div>
            <h2 style={styles.viewTitle}>طلبات التجهيز</h2>
            <p style={styles.viewSubtitle}>أهلاً {currentUser.name}</p>
          </div>
        </div>
        <button onClick={onLogout} style={styles.mobileLogoutBtn} title="خروج"><LogOut size={18} /></button>
      </div>

      <div style={styles.filtersWrap}>
        <div style={styles.filterBottomRow}>
          <div style={styles.pageSelectWrap}>
            <Calendar size={15} color="#60A5FA" />
            <select value={dayFilter} onChange={(e) => setDayFilter(e.target.value)} style={styles.pageSelect}>
              {DATE_PRESETS.map((f) => <option key={f.id} value={f.id}>{f.label} ({dayCounts[f.id] || 0})</option>)}
            </select>
            <ChevronDown size={14} color="#5E6986" />
          </div>
          {dayFilter === 'custom' && (
            <>
              <select value={customMonth} onChange={(e) => setCustomMonth(e.target.value)} style={styles.customDateSelectCompact}>
                {AR_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
              </select>
              <select value={customYear} onChange={(e) => setCustomYear(e.target.value)} style={styles.customDateSelectCompact}>
                {years.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </>
          )}
        </div>
      </div>

      {shownPrep.length === 0 ? (
        <div style={styles.emptyStateLg}><CheckCircle2 size={40} color="#4ADE80" /><p>لا توجد طلبات للتجهيز في هذه الفترة 🎉</p></div>
      ) : (
        <div style={styles.warehouseGrid}>
          {shownPrep.map((o) => (
            <div key={o.id} style={styles.warehouseCard}>
              <div style={styles.warehouseCardTop}>
                <div style={styles.warehouseCardNo}>طلب #{o.orderNo}</div>
                {o.createdAt && (
                  <div style={styles.warehouseCardDate}>
                    {new Date(o.createdAt).toLocaleString('ar-IQ', { dateStyle: 'short', timeStyle: 'short' })}
                  </div>
                )}
              </div>

              {o.orderType && <div style={styles.warehouseBigType}>{o.orderType}</div>}

              {o.reprepNote && (
                <div style={styles.warehouseReprepNote}>
                  <AlertCircle size={17} />
                  <div>
                    <div style={styles.warehouseReprepTitle}>ملاحظة {o.reprepByName || 'المدير'}</div>
                    <div style={styles.warehouseReprepText}>{o.reprepNote}</div>
                  </div>
                </div>
              )}

              {o.items && (
                <div style={styles.warehouseItemsBox}>
                  <div style={styles.warehouseItemsLabel}>تفاصيل الطلب</div>
                  <div style={styles.warehouseItemsText}>{o.items}</div>
                </div>
              )}

              <div style={styles.warehouseActions}>
                <button onClick={() => markDone(o)} disabled={saving} style={styles.warehouseDoneBtn}>
                  <CheckCircle2 size={20} /> تم التجهيز
                </button>
                <button onClick={() => { setRejectOrder(o); setRejectReason(''); }} disabled={saving} style={styles.warehouseRejectBtn}>
                  <XCircle size={20} /> لم يتم
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {rejectOrder && (
        <div style={styles.modalOverlay} onClick={() => setRejectOrder(null)}>
          <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>سبب عدم تجهيز الطلب #{rejectOrder.orderNo}</h3>
              <button onClick={() => setRejectOrder(null)} style={styles.modalClose}><X size={18} /></button>
            </div>
            <div style={styles.modalBody}>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} style={{ ...styles.formInput, minHeight: 100, resize: 'vertical' }} placeholder="اكتب السبب بوضوح (مثال: المنتج غير متوفر بالمخزن)" autoFocus />
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setRejectOrder(null)} style={styles.modalCancelBtn}>إلغاء</button>
              <button onClick={confirmReject} style={{ ...styles.modalSaveBtn, background: 'linear-gradient(135deg,#F45B69,#C0143C)' }} disabled={saving}>{saving ? '...' : 'تأكيد'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────
// التطبيق الرئيسي
// ──────────────────────────────────────────────
export default function AlFhdApp() {
  const [activeView, setActiveView] = useState('conversations');
  const [pendingOpenConvId, setPendingOpenConvId] = useState(null);
  const [pendingNewOrderFromConv, setPendingNewOrderFromConv] = useState(null);
  const [pendingOpenOrderId, setPendingOpenOrderId] = useState(null);

  const goToConversation = useCallback((convId) => {
    setPendingOpenConvId(convId);
    setActiveView('conversations');
  }, []);

  const goToNewOrderFromConversation = useCallback((conv) => {
    setPendingNewOrderFromConv(conv);
    setActiveView('orders');
  }, []);

  const goToOrderDetails = useCallback((order) => {
    setPendingOpenOrderId(order.id);
    setActiveView('orders');
  }, []);


  const [pages, setPages] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [storageReady, setStorageReady] = useState(false);

  // ── حالة تسجيل الدخول ── يُستعاد فوراً من localStorage بدون انتظار Supabase
  const [authedUser, setAuthedUser] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('alfhd_session') || sessionStorage.getItem('alfhd_session') || 'null');
      if (saved?.userId && saved?.userData) return saved.userData;
    } catch (_) {}
    return null;
  });
  const [appLoading, setAppLoading] = useState(!(localStorage.getItem('alfhd_session') || sessionStorage.getItem('alfhd_session')));

  // جلب المحادثات الحقيقية من Supabase (يُستخدم عند التحميل وعند كل تحديث دوري)
  const convSignatureRef = React.useRef('');
  const refreshConversations = useCallback(async () => {
    try {
      const dbConversations = await sbSelect(
        'alfhd_conversations',
        '&order=last_message_time.desc'
      );
      if (dbConversations) {
        // وقّع البيانات؛ حدّث الحالة فقط إذا تغيّر شيء فعلاً (يمنع إعادة الرسم غير الضرورية)
        const sig = dbConversations.map((c) => `${c.id}:${c.last_message_time}:${c.last_message}:${c.unread_count}:${c.tab}:${c.order_id}:${c.avatar_url || ''}`).join('|');
        if (sig !== convSignatureRef.current) {
          convSignatureRef.current = sig;
          setConversations(dbConversations.map(mapConversationFromDb));
        }
      }
    } catch (e) {
      console.error('Supabase conversations load error:', e);
    }
  }, []);

  const knownOrderIdsRef = React.useRef(null);
  const orderSignatureRef = React.useRef('');
  const rejectedIdsRef = React.useRef(null);
  const refreshOrders = useCallback(async () => {
    try {
      const dbOrders = await sbSelect('alfhd_orders', '&order=created_at.desc');
      if (!dbOrders) return;
      const mapped = dbOrders.map(mapOrderFromDb);
      // كشف طلب جديد مثبّت من المحادثات لتشغيل صوت الإشعار
      if (knownOrderIdsRef.current) {
        const newChatOrder = mapped.find((o) => o.source === 'chat' && !knownOrderIdsRef.current.has(o.id));
        if (newChatOrder) playNotificationSound();
      }
      knownOrderIdsRef.current = new Set(mapped.map((o) => o.id));

      // كشف طلب رفضه المجهّز حديثاً لتشغيل صوت إنذار قوي للمدير
      const rejectedNow = new Set(mapped.filter((o) => o.prepStatus === 'rejected').map((o) => o.id));
      if (rejectedIdsRef.current) {
        const newlyRejected = [...rejectedNow].some((id) => !rejectedIdsRef.current.has(id));
        if (newlyRejected) playAlarmSound();
      }
      rejectedIdsRef.current = rejectedNow;

      // حدّث الحالة فقط إذا تغيّر شيء فعلاً
      const sig = dbOrders.map((o) => `${o.id}:${o.status}:${o.stage}:${o.prep_status}:${o.converted}:${o.printed}:${o.jenni_sent}:${o.jenni_shipment_id}:${o.jenni_tracking}:${o.delivery_status}:${o.delivery_step}:${o.delivery_step_ar}:${o.delivery_note}:${o.delivery_updated_at}`).join('|');
      if (sig !== orderSignatureRef.current) {
        orderSignatureRef.current = sig;
        setOrders(mapped);
      }
    } catch (e) {
      console.error('orders refresh error:', e);
    }
  }, []);

  useEffect(() => {
    if (!storageReady) return undefined;
    const interval = setInterval(refreshOrders, 10000);
    return () => clearInterval(interval);
  }, [storageReady, refreshOrders]);

  // تحميل البيانات الحقيقية من Supabase (لا يمنع عرض الواجهة أبداً)
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
      } catch (e) {
        console.error('Supabase init load error:', e);
      } finally {
        setStorageReady(true);
      }
    })();
  }, [refreshConversations]);

  // سحب فعّال للرسائل الجديدة من فيسبوك مباشرة كل 7 ثواني طالما التطبيق مفتوح
  // (يحدّث المحادثات أيضاً، فلا حاجة لمؤقّت منفصل)
  const pollFacebookNow = useCallback(async () => {
    try {
      await fetch(FB_POLL_FUNCTION_URL, { method: 'GET', headers: { 'Authorization': `Bearer ${SUPABASE_KEY}`, 'apikey': SUPABASE_KEY } });
    } catch (e) {
      console.error('active poll error:', e);
    } finally {
      refreshConversations();
    }
  }, [refreshConversations]);

  useEffect(() => {
    if (!storageReady) return undefined;
    pollFacebookNow();
    const interval = setInterval(pollFacebookNow, 7000);
    return () => clearInterval(interval);
  }, [storageReady, pollFacebookNow]);

  // بعد تحميل Supabase: حدّث بيانات المستخدم المسجّل (صلاحيات جديدة إلخ) وأوقف شاشة التحميل
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
          // المستخدم محذوف أو معطّل في قاعدة البيانات
          setAuthedUser(null);
          localStorage.removeItem('alfhd_session');
          sessionStorage.removeItem('alfhd_session');
        }
      }
    } catch (e) { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady]);

  const handleLogin = (user, rememberMe = true) => {
    ensureAudioReady();
    setAuthedUser(user);
    setAppLoading(false);
    try {
      const payload = JSON.stringify({ userId: user.id, userData: user });
      localStorage.removeItem('alfhd_session');
      sessionStorage.removeItem('alfhd_session');
      (rememberMe ? localStorage : sessionStorage).setItem('alfhd_session', payload);
    } catch (e) { /* ignore */ }
  };

  const handleLogout = () => {
    setAuthedUser(null);
    try {
      localStorage.removeItem('alfhd_session');
      sessionStorage.removeItem('alfhd_session');
    } catch (e) { /* ignore */ }
  };

  const hasPermission = (permId) => {
    if (!authedUser) return false;
    if (authedUser.role === 'admin') return true;
    return authedUser.permissions?.includes(permId);
  };

  // فتح واتساب برقم عراقي منسّق
  const contactWhatsApp = useCallback((rawPhone) => {
    if (!rawPhone) { alert('لا يوجد رقم متاح'); return; }
    let digits = String(rawPhone).replace(/[^0-9]/g, '');
    if (digits.startsWith('00')) digits = digits.slice(2);
    else if (digits.startsWith('0')) digits = '964' + digits.slice(1);
    else if (!digits.startsWith('964')) digits = '964' + digits;
    window.open(`https://wa.me/${digits}`, '_blank');
  }, []);

  // ── شاشة التحميل الأولية (تظهر فقط عند أول تشغيل بدون جلسة محفوظة) ──
  if (appLoading && !authedUser) {
    return (
      <>
        <GlobalStyles />
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080B14', flexDirection: 'column', gap: 16 }}>
          <FahdLogo size={52} />
          <div style={{ color: '#3B82F6', fontSize: 13, animation: 'spin 1s linear infinite', display: 'inline-block' }}>
            <RefreshCw size={20} />
          </div>
        </div>
      </>
    );
  }

  // ── شاشة الدخول ──
  if (!authedUser) {
    return (
      <>
        <GlobalStyles />
        <LoginScreen users={users} onLogin={handleLogin} />
      </>
    );
  }

  // ── واجهة موظف المخزن المبسطة (لا يرى بقية التطبيق) ──
  if (authedUser.role === 'warehouse') {
    return (
      <>
        <GlobalStyles />
        <div style={styles.appWrap} className="alfhd-app-wrap">
          <WarehouseView
            orders={orders}
            setOrders={setOrders}
            currentUser={authedUser}
            onLogout={handleLogout}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <GlobalStyles />
      <div style={styles.appWrap} className="alfhd-app-wrap">
        <Sidebar
          activeView={activeView}
          setActiveView={setActiveView}
          onLogout={handleLogout}
          currentUser={authedUser}
          pages={pages}
        />
        <main style={styles.mainArea} className="alfhd-main-area">
          {activeView === 'conversations' && (
            <ConversationsView
              conversations={conversations}
              pages={pages}
              orders={orders}
              setConversations={setConversations}
              pendingOpenConvId={pendingOpenConvId}
              clearPendingOpenConvId={() => setPendingOpenConvId(null)}
              onCreateOrderFromConv={goToNewOrderFromConversation}
              onOpenOrderDetails={goToOrderDetails}
            />
          )}
          {activeView === 'orders' && (
            <OrdersView
              orders={orders}
              pages={pages}
              setOrders={setOrders}
              conversations={conversations}
              setConversations={setConversations}
              pendingOpenOrderId={pendingOpenOrderId}
              clearPendingOpenOrderId={() => setPendingOpenOrderId(null)}
              onViewConversation={goToConversation}
              pendingNewOrderFromConv={pendingNewOrderFromConv}
              clearPendingNewOrderFromConv={() => setPendingNewOrderFromConv(null)}
              currentUser={authedUser}
            />
          )}
          {activeView === 'stats' && (
            <StatsView orders={orders} pages={pages} conversations={conversations} setOrders={setOrders} />
          )}
          {activeView === 'users' && (authedUser.role === 'admin' || (authedUser.permissions || []).includes('users_manage')) && (
            <AdminView
              users={users}
              setUsers={setUsers}
              orders={orders}
              conversations={conversations}
              onViewConversation={goToConversation}
              onContactWhatsApp={contactWhatsApp}
            />
          )}
          {activeView === 'pages' && (
            <PagesView pages={pages} setPages={setPages} />
          )}
        </main>
      </div>
    </>
  );
}

// ──────────────────────────────────────────────
// أنماط عامة + خطوط
// ──────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap');
      * { box-sizing: border-box; font-family: 'Cairo', sans-serif; -webkit-tap-highlight-color: transparent; }
      body {
        margin: 0;
        background: #0A0E17;
        background-image:
          radial-gradient(ellipse 80% 50% at 50% -10%, rgba(59,130,246,0.08), transparent 60%),
          radial-gradient(ellipse 60% 50% at 100% 100%, rgba(59,130,246,0.04), transparent 55%);
        background-attachment: fixed;
      }
      input::placeholder, textarea::placeholder { color: #5E6986; }
      input:focus-visible, select:focus-visible, textarea:focus-visible, button:focus-visible {
        outline: 2px solid rgba(59,130,246,0.5); outline-offset: 1px;
      }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #2A3550; border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: #3A4768; }
      @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-6px); }
        80% { transform: translateX(6px); }
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes chatSlideIn {
        from { transform: translateX(28px); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes msgPop {
        from { transform: scale(0.92); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      @keyframes cardEnter {
        from { transform: translateY(12px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
      @keyframes unreadPulse {
        0%, 100% { box-shadow: 0 0 0 0 rgba(244,20,60,0.6); }
        50% { box-shadow: 0 0 0 6px rgba(244,20,60,0); }
      }
      .alfhd-unread-pulse { animation: unreadPulse 1.4s ease-in-out infinite; }
      @keyframes recPulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.4; transform: scale(0.8); }
      }
      .alfhd-rec-dot { animation: recPulse 1s ease-in-out infinite; }
      input:focus, select:focus, textarea:focus { outline: none; }
      button {
        font-family: 'Cairo', sans-serif; cursor: pointer;
        transition: transform 0.12s ease, opacity 0.12s ease, background 0.15s ease, border-color 0.15s ease;
      }
      button:active { transform: scale(0.95); }
      button:disabled { opacity: 0.55; cursor: default; transform: none; }
      .alfhd-conv-item, .alfhd-order-card {
        transition: border-color 0.16s ease, transform 0.16s cubic-bezier(0.22,1,0.36,1), background 0.16s ease, box-shadow 0.16s ease;
      }
      .alfhd-conv-item:active { transform: scale(0.985); background: rgba(255,255,255,0.02); }
      @media (hover: hover) {
        .alfhd-order-card:hover {
          transform: translateY(-3px);
          border-color: rgba(59,130,246,0.28) !important;
          box-shadow: 0 1px 2px rgba(0,0,0,0.3), 0 18px 40px -12px rgba(0,0,0,0.65), 0 0 0 1px rgba(59,130,246,0.1), inset 0 1px 0 rgba(255,255,255,0.05) !important;
        }
        .alfhd-conv-item:hover { background: rgba(255,255,255,0.03); border-color: rgba(255,255,255,0.06) !important; }
        .alfhd-nav-item:hover { background: rgba(255,255,255,0.04); color: #C4CEE0 !important; }
        .alfhd-stat-card:hover { transform: translateY(-2px); }
      }
      .alfhd-stat-card { transition: transform 0.16s cubic-bezier(0.22,1,0.36,1); }
      .alfhd-chat-scroll {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      .alfhd-chat-bubble-row { animation: msgPop 0.22s cubic-bezier(0.22, 1, 0.36, 1); }
      .alfhd-card-enter { animation: cardEnter 0.4s cubic-bezier(0.22,1,0.36,1) backwards; }
      .alfhd-bottom-nav-item, .alfhd-nav-item {
        transition: color 0.18s ease, background 0.18s ease, border-color 0.18s ease;
      }
      .alfhd-bottom-nav-item svg, .alfhd-nav-item svg {
        transition: transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1);
      }
      .alfhd-bottom-nav-item-active svg { transform: scale(1.12); }

      /* ── تصميم متجاوب للموبايل ── */
      @media (max-width: 860px) {
        .alfhd-app-wrap {
          flex-direction: column !important;
        }
        .alfhd-main-area {
          padding: 76px 14px 86px !important;
          width: 100% !important;
        }
        .alfhd-conv-layout {
          grid-template-columns: 1fr !important;
        }
        .alfhd-conv-list {
          max-height: none !important;
        }
        .alfhd-conv-list-hidden-mobile {
          display: none !important;
        }
        .alfhd-conv-detail-empty {
          display: none !important;
        }
        .alfhd-conv-detail-active-mobile {
          position: fixed !important;
          top: 0 !important;
          right: 0 !important;
          left: 0 !important;
          bottom: 0 !important;
          z-index: 200 !important;
          border-radius: 0 !important;
          border: none !important;
          padding: 0 !important;
          min-height: 0 !important;
          height: 100dvh !important;
          display: flex !important;
          flex-direction: column !important;
          animation: chatSlideIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) !important;
        }
        .alfhd-conv-detail-active-mobile .alfhd-chat-detail-header {
          padding: 14px 14px 12px !important;
          padding-top: calc(14px + env(safe-area-inset-top, 0px)) !important;
        }
        .alfhd-conv-detail-active-mobile .alfhd-chat-scroll {
          flex: 1 1 auto !important;
          max-height: none !important;
          min-height: 0 !important;
          padding: 12px 14px !important;
        }
        .alfhd-conv-detail-active-mobile .alfhd-composer-bar {
          margin: 0 !important;
          border-radius: 0 !important;
          border-left: none !important;
          border-right: none !important;
          border-bottom: none !important;
          padding: 10px 12px !important;
          padding-bottom: calc(10px + env(safe-area-inset-bottom, 0px)) !important;
          flex-shrink: 0 !important;
        }
        .alfhd-conv-detail-active-mobile .alfhd-linked-order {
          flex-shrink: 0 !important;
          margin: 0 14px 0 !important;
          max-height: 120px !important;
          overflow-y: auto !important;
        }
        .alfhd-conv-back-btn {
          display: flex !important;
        }
        .alfhd-chat-scroll {
          max-height: none !important;
        }
        .alfhd-stats-row {
          grid-template-columns: repeat(2, 1fr) !important;
        }
        .alfhd-stats-grid-2 {
          grid-template-columns: 1fr !important;
        }
        .alfhd-orders-table-header {
          display: none !important;
        }
        .alfhd-orders-row {
          grid-template-columns: 1fr !important;
          display: flex !important;
          flex-direction: column !important;
          gap: 6px !important;
          padding: 14px !important;
        }
        .alfhd-view-header {
          flex-direction: column !important;
          align-items: flex-start !important;
        }
        .alfhd-pages-grid, .alfhd-users-grid {
          grid-template-columns: 1fr !important;
        }
        .alfhd-bar-chart-row {
          grid-template-columns: 1fr !important;
          gap: 6px !important;
        }
        .alfhd-modal {
          max-width: 94vw !important;
        }
        .alfhd-login-card {
          max-width: 92vw !important;
          padding: 36px 24px !important;
        }
      }

      @keyframes loginFloat {
        0%, 100% { transform: translateY(0) scale(1); }
        50% { transform: translateY(-10px) scale(1.006); }
      }
      @keyframes starDrift {
        from { transform: translate3d(0, 0, 0); }
        to { transform: translate3d(-120px, 160px, 0); }
      }
      @keyframes starDriftReverse {
        from { transform: translate3d(0, 0, 0) rotate(0deg); }
        to { transform: translate3d(140px, -120px, 0) rotate(8deg); }
      }
      @keyframes orbitSpin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes auroraMove {
        0%, 100% { transform: translate3d(0,0,0) scale(1); opacity: .72; }
        50% { transform: translate3d(34px,-26px,0) scale(1.08); opacity: .95; }
      }
      .alfhd-stars-layer { animation: starDrift 22s linear infinite; }
      .alfhd-stars-layer-2 { animation: starDriftReverse 34s linear infinite; }
      .alfhd-login-orbit { animation: orbitSpin 28s linear infinite; }

      /* ── طباعة الطلبات ── */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }

      @media print {
        body * { visibility: hidden; }
        .alfhd-print-area, .alfhd-print-area * { visibility: visible; }
        .alfhd-print-area {
          position: absolute; top: 0; right: 0; left: 0; width: 100%;
          display: grid !important; grid-template-columns: repeat(2, 1fr) !important;
        }
        .alfhd-orders-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; }
        .alfhd-no-print { display: none !important; }
      }
    `}</style>
  );
}

// ──────────────────────────────────────────────
// كائن الأنماط (Design Tokens)
// ──────────────────────────────────────────────
const styles = {
  // ── Login ──
  loginWrap: {
    minHeight: '100vh', display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'radial-gradient(circle at 50% 120%, #111C36 0%, #070A12 42%, #02040A 100%)',
    position: 'relative', overflow: 'hidden', direction: 'rtl', padding: 20,
  },
  loginSpaceBg: {
    position: 'absolute', inset: 0,
    background: 'radial-gradient(circle at 18% 22%, rgba(96,165,250,0.18), transparent 26%), radial-gradient(circle at 82% 72%, rgba(167,139,250,0.14), transparent 24%), linear-gradient(135deg, rgba(2,6,23,0.2), rgba(15,23,42,0.35))',
    pointerEvents: 'none',
  },
  loginStarsLayer: {
    position: 'absolute', inset: '-20%', opacity: 0.75,
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.9) 0 1px, transparent 1.4px), radial-gradient(circle, rgba(96,165,250,0.8) 0 1px, transparent 1.3px)',
    backgroundSize: '110px 110px, 170px 170px', backgroundPosition: '0 0, 42px 64px',
  },
  loginStarsLayer2: {
    position: 'absolute', inset: '-18%', opacity: 0.34,
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.75) 0 1px, transparent 1.5px)',
    backgroundSize: '74px 74px', backgroundPosition: '30px 20px', filter: 'blur(0.2px)',
  },
  loginNebulaOne: {
    position: 'absolute', width: 520, height: 520, borderRadius: '50%', top: '-130px', right: '-160px',
    background: 'radial-gradient(circle, rgba(59,130,246,0.26), rgba(59,130,246,0.08) 34%, transparent 70%)',
    filter: 'blur(18px)', animation: 'auroraMove 9s ease-in-out infinite',
  },
  loginNebulaTwo: {
    position: 'absolute', width: 460, height: 460, borderRadius: '50%', bottom: '-160px', left: '-130px',
    background: 'radial-gradient(circle, rgba(168,85,247,0.22), rgba(14,165,233,0.08) 36%, transparent 72%)',
    filter: 'blur(20px)', animation: 'auroraMove 11s ease-in-out infinite reverse',
  },
  loginOrbit: {
    position: 'absolute', width: 620, height: 620, borderRadius: '50%',
    border: '1px solid rgba(96,165,250,0.10)', borderTopColor: 'rgba(96,165,250,0.36)',
    borderRightColor: 'rgba(167,139,250,0.22)', pointerEvents: 'none',
  },
  loginBrandTop: {
    position: 'absolute', top: 24, zIndex: 2, display: 'flex', alignItems: 'center', gap: 8,
    color: '#93C5FD', fontSize: 11, fontWeight: 900, letterSpacing: '0.16em',
    background: 'rgba(15,23,42,0.48)', border: '1px solid rgba(147,197,253,0.18)', borderRadius: 999,
    padding: '9px 14px', backdropFilter: 'blur(14px)',
  },
  loginCard: {
    position: 'relative', zIndex: 1,
    background: 'linear-gradient(180deg, rgba(15,23,42,0.66) 0%, rgba(2,6,23,0.90) 100%)',
    border: '1px solid rgba(191,219,254,0.18)',
    borderRadius: 34, padding: '42px 36px 30px', width: '100%', maxWidth: 430,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 36px 120px rgba(0,0,0,0.74), 0 0 90px rgba(37,99,235,0.12), inset 0 1px 0 rgba(255,255,255,0.12)',
    overflow: 'hidden', backdropFilter: 'blur(28px) saturate(1.2)',
  },
  loginGlassShine: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(135deg, rgba(255,255,255,0.12), transparent 30%, transparent 62%, rgba(96,165,250,0.08))',
    pointerEvents: 'none',
  },
  loginCardAccent: {
    position: 'absolute', top: 0, right: 0, left: 0, height: 4,
    background: 'linear-gradient(90deg, transparent, #60A5FA, #A78BFA, #60A5FA, transparent)',
  },
  loginLogoArea: { position: 'relative', marginBottom: 4 },
  logoGlow: {
    position: 'absolute', inset: -28, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(96,165,250,0.42) 0%, rgba(167,139,250,0.16) 42%, transparent 72%)',
    filter: 'blur(10px)',
  },
  loginTitle: {
    fontSize: 38, fontWeight: 950, color: '#F8FAFC', margin: '18px 0 3px',
    letterSpacing: '0.035em', fontFamily: "'Cairo', sans-serif", textShadow: '0 0 28px rgba(96,165,250,0.28)',
  },
  loginSubtitle: { fontSize: 13.5, color: '#AAB8D3', letterSpacing: '0.02em', margin: 0, fontWeight: 700 },
  loginMicroCopy: {
    marginTop: 12, color: '#60A5FA', fontSize: 11.5, fontWeight: 900,
    background: 'rgba(96,165,250,0.10)', border: '1px solid rgba(96,165,250,0.22)', borderRadius: 999,
    padding: '6px 12px',
  },
  inputLabel: { display: 'block', fontSize: 12, color: '#B8C4D9', marginBottom: 14, fontWeight: 900, textAlign: 'center' },
  pinBoxesWrap: { position: 'relative', display: 'flex', gap: 12, justifyContent: 'center', cursor: 'text' },
  pinBox: {
    width: 58, height: 66, borderRadius: 21, background: 'linear-gradient(180deg, rgba(15,23,42,0.82), rgba(2,6,23,0.82))',
    border: '1.5px solid rgba(147,197,253,0.20)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 28, color: '#BFDBFE', fontWeight: 950,
    transition: 'border-color 0.15s, transform 0.12s, background 0.15s, box-shadow .15s',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.045)',
  },
  pinBoxActive: { borderColor: '#60A5FA', transform: 'translateY(-3px)', boxShadow: '0 0 24px rgba(96,165,250,0.22)' },
  pinBoxFilled: { borderColor: 'rgba(96,165,250,0.75)', background: 'rgba(59,130,246,0.13)', boxShadow: 'inset 0 0 18px rgba(96,165,250,0.08)' },
  pinBoxError: { borderColor: '#F45B69', boxShadow: '0 0 20px rgba(244,91,105,0.2)' },
  pinHiddenInput: {
    position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%',
    border: 'none', padding: 0, margin: 0, cursor: 'text',
  },
  errorText: { color: '#FF8A98', fontSize: 12.5, marginTop: 13, textAlign: 'center', fontWeight: 800 },
  rememberRow: {
    marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
    color: '#AAB8D3', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
  },
  loginKeypad: {
    marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(3, 58px)', gap: 12, justifyContent: 'center',
  },
  loginKeypadBtn: {
    width: 58, height: 58, borderRadius: '50%', border: '1px solid rgba(191,219,254,0.14)',
    background: 'radial-gradient(circle at 35% 20%, rgba(255,255,255,0.10), rgba(15,23,42,0.72) 42%, rgba(2,6,23,0.72))', color: '#F8FAFC', fontSize: 19, fontWeight: 950,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.07), 0 10px 24px -20px rgba(0,0,0,0.9)',
  },
  loginKeypadGhost: {
    width: 58, height: 58, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.07)',
    background: 'rgba(255,255,255,0.028)', color: '#94A3B8', fontSize: 11.5, fontWeight: 950,
  },
  checkbox: { width: 16, height: 16, accentColor: '#60A5FA', cursor: 'pointer' },
  loginFooter: { marginTop: 28, fontSize: 11, color: '#64748B', position: 'relative', zIndex: 1, letterSpacing: '0.04em' },

  // ── App layout ──
  appWrap: {
    display: 'flex', minHeight: '100vh',
    background: 'radial-gradient(circle at 10% 0%, rgba(59,130,246,0.16), transparent 30%), radial-gradient(circle at 88% 20%, rgba(34,211,238,0.08), transparent 28%), linear-gradient(135deg,#050812 0%, #080D18 45%, #0B1020 100%)',
    direction: 'rtl', color: '#EAF0FB', fontFamily: "'Cairo', sans-serif",
  },
  sidebar: {
    width: 286, background: 'linear-gradient(180deg, rgba(15,23,42,0.82), rgba(2,6,23,0.92))',
    borderLeft: '1px solid rgba(148,163,184,0.10)', backdropFilter: 'blur(22px)',
    display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0,
    boxShadow: '-20px 0 70px -55px rgba(0,0,0,0.95), inset 1px 0 0 rgba(255,255,255,0.04)',
  },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 8px 22px', borderBottom: '1px solid rgba(148,163,184,0.10)', marginBottom: 18 },
  sidebarBrand: { fontSize: 18, fontWeight: 800, color: '#EAF0FB', letterSpacing: '-0.01em' },
  sidebarBrandSub: { fontSize: 10, color: '#5E6986', letterSpacing: '0.04em' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
    borderRadius: 15, border: '1px solid transparent', background: 'transparent', color: '#94A3B8',
    fontSize: 14, fontWeight: 700, textAlign: 'right', position: 'relative',
    transition: 'all 0.18s cubic-bezier(0.22,1,0.36,1)',
  },
  navItemActive: {
    background: 'linear-gradient(135deg, rgba(37,99,235,0.24), rgba(14,165,233,0.08))',
    borderColor: 'rgba(96,165,250,0.30)', color: '#DBEAFE', fontWeight: 900,
    boxShadow: '0 12px 30px -24px rgba(59,130,246,0.8), inset 0 1px 0 rgba(255,255,255,0.06)',
  },
  navActiveDot: { position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)', width: 3, height: 20, borderRadius: 4, background: '#3B82F6', boxShadow: '0 0 10px rgba(59,130,246,0.6)' },
  sidebarFooter: { paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' },
  userBadge: { display: 'flex', alignItems: 'center', gap: 11, padding: '8px', marginBottom: 8 },
  userAvatar: {
    width: 36, height: 36, borderRadius: 11, background: 'linear-gradient(135deg,#60A5FA,#1D4ED8)',
    color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 14, flexShrink: 0, boxShadow: '0 4px 12px -2px rgba(59,130,246,0.5)',
  },
  userName: { fontSize: 13, fontWeight: 700, color: '#EAF0FB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: 11, color: '#5E6986' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '11px 14px',
    background: 'transparent', border: '1px solid rgba(244,91,105,0.2)', borderRadius: 11,
    color: '#F45B69', fontSize: 13, fontWeight: 600,
  },

  // ── Mobile header + bottom nav ──
  mobileHeader: {
    position: 'fixed', top: 0, right: 0, left: 0, height: 58, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: 'rgba(14,20,34,0.82)', backdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '0 16px', direction: 'rtl',
  },
  mobileHeaderBrand: { display: 'flex', alignItems: 'center', gap: 9 },
  mobileHeaderTitle: { fontSize: 16, fontWeight: 800, color: '#EAF0FB', letterSpacing: '-0.01em' },
  mobileLogoutBtn: {
    width: 34, height: 34, borderRadius: 10, background: 'rgba(244,91,105,0.1)',
    border: 'none', color: '#F45B69', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bottomNav: {
    position: 'fixed', bottom: 0, right: 0, left: 0, zIndex: 100,
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    background: 'rgba(14,20,34,0.9)', backdropFilter: 'blur(16px)',
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '8px 4px 10px', direction: 'rtl',
  },
  bottomNavItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
    background: 'transparent', border: 'none', color: '#5E6986', padding: '6px 8px',
    flex: 1, minWidth: 0, position: 'relative',
  },
  bottomNavItemActive: { color: '#60A5FA' },
  bottomNavLabel: { fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' },

  mainArea: { flex: 1, overflow: 'auto', padding: '34px 38px', position: 'relative' },
  viewWrap: { animation: 'fadeUp 0.35s cubic-bezier(0.22,1,0.36,1)', maxWidth: 1480, margin: '0 auto' },
  viewHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 26, flexWrap: 'wrap', gap: 14,
    padding: '4px 2px 0',
  },
  viewTitle: { fontSize: 28, fontWeight: 950, color: '#F8FAFC', margin: 0, letterSpacing: '-0.035em', textShadow: '0 0 28px rgba(59,130,246,0.08)' },
  viewSubtitle: { fontSize: 13.5, color: '#8290A8', margin: '6px 0 0', letterSpacing: '0.01em', fontWeight: 600 },

  pageSelectWrap: {
    display: 'flex', alignItems: 'center', gap: 8,
    background: 'linear-gradient(180deg, rgba(15,23,42,0.86), rgba(2,6,23,0.52))',
    border: '1px solid rgba(148,163,184,0.12)', borderRadius: 14, padding: '9px 13px',
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  pageSelect: {
    background: 'transparent', border: 'none', color: '#EAF0FB', fontSize: 13,
    fontWeight: 600, appearance: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif",
  },

  // ── Conversations ──
  convTabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  convTab: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '10px 16px',
    background: '#1A2235', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12,
    color: '#8B96AD', fontSize: 13, fontWeight: 600, transition: 'all 0.16s cubic-bezier(0.22,1,0.36,1)',
  },
  convTabActive: {
    background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.06))',
    borderColor: 'rgba(59,130,246,0.32)', color: '#93C5FD',
  },
  convTabCount: {
    background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700,
  },
  convTabCountActive: { background: 'rgba(59,130,246,0.3)', color: '#93C5FD' },
  unreadPulse: {
    position: 'absolute', top: -6, left: -6, minWidth: 18, height: 18, padding: '0 5px',
    borderRadius: 20, background: '#F4143C', color: '#fff', fontSize: 10, fontWeight: 800,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    border: '2px solid #0A0E17',
  },
  markAllReadBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%',
    padding: '9px', marginBottom: 8, background: 'rgba(59,130,246,0.1)',
    border: '1px solid rgba(59,130,246,0.22)', borderRadius: 11, color: '#60A5FA',
    fontSize: 12, fontWeight: 700,
  },
  markAllReadBtnDisabled: {
    opacity: 0.55, color: '#6B7280', background: 'rgba(255,255,255,0.035)', borderColor: 'rgba(255,255,255,0.06)',
    cursor: 'not-allowed',
  },

  convLayout: { display: 'grid', gridTemplateColumns: '400px 1fr', gap: 22, minHeight: 540, alignItems: 'stretch' },
  convList: {
    background: 'linear-gradient(180deg, rgba(20,27,44,0.72), rgba(13,18,31,0.58))',
    border: '1px solid rgba(255,255,255,0.07)', borderRadius: 22,
    padding: 12, display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 680, overflow: 'auto',
    boxShadow: '0 18px 50px -30px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 9, background: 'rgba(10,14,23,0.72)',
    border: '1px solid rgba(96,165,250,0.14)', borderRadius: 16, padding: '12px 15px', marginBottom: 6,
    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.03)',
  },
  searchInput: {
    background: 'transparent', border: 'none', color: '#EAF0FB', fontSize: 13.5,
    width: '100%', fontFamily: "'Cairo', sans-serif",
  },
  convItem: {
    display: 'flex', gap: 13, padding: '13px 12px', background: 'rgba(255,255,255,0.018)',
    border: '1px solid rgba(255,255,255,0.045)', borderRadius: 16,
    textAlign: 'right', alignItems: 'center', transition: 'background 0.16s ease, transform .16s ease, border-color .16s ease', width: '100%',
  },
  convItemActive: { background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(96,165,250,0.06))', borderColor: 'rgba(96,165,250,0.32)', transform: 'translateY(-1px)' },
  convAvatar: {
    width: 52, height: 52, borderRadius: '50%', background: '#222C42', color: '#3B82F6',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0, fontSize: 18,
  },
  convItemTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  convCustomer: { fontSize: 14.5, fontWeight: 700, color: '#EAF0FB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  convTime: { fontSize: 11.5, color: '#5E6986', flexShrink: 0, marginRight: 8 },
  convItemBottom: { display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center' },
  convLastMsg: { fontSize: 12.5, color: '#7C879E', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  unreadBadge: {
    background: 'linear-gradient(135deg,#60A5FA,#3B82F6)', color: '#fff', borderRadius: 20, fontSize: 11, fontWeight: 800,
    padding: '2px 8px', minWidth: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
    textAlign: 'center', flexShrink: 0, boxShadow: '0 2px 8px -1px rgba(59,130,246,0.5)',
  },

  convDetail: {
    background: 'linear-gradient(180deg, rgba(20,27,44,0.92), rgba(11,16,28,0.96))', border: '1px solid rgba(147,197,253,0.10)', borderRadius: 24,
    padding: 24, display: 'flex', flexDirection: 'column', minHeight: 580, minWidth: 0, overflow: 'hidden',
    boxShadow: '0 24px 70px -38px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.055)',
  },
  detailHeader: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 0 18px', borderBottom: '1px solid rgba(147,197,253,0.10)', marginBottom: 16, position: 'relative' },
  convBackBtn: {
    display: 'none', width: 36, height: 36, borderRadius: 11, background: '#1A2235',
    border: '1px solid rgba(255,255,255,0.06)', color: '#C4CEE0', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  convAvatarLg: {
    width: 48, height: 48, borderRadius: '50%', background: '#222C42', color: '#3B82F6',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0,
  },
  detailName: { fontSize: 16, fontWeight: 700, color: '#EAF0FB' },
  detailPage: { fontSize: 12, color: '#5E6986' },
  pinOrderBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '9px 13px',
    background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
    borderRadius: 11, color: '#60A5FA', fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  chatScroll: {
    flex: 1, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column',
    padding: '14px 10px', minHeight: 260, maxHeight: 520,
    background: 'radial-gradient(circle at 50% 0%, rgba(96,165,250,0.055), transparent 30%), rgba(2,6,23,0.20)',
    border: '1px solid rgba(255,255,255,0.035)', borderRadius: 20,
  },
  msgBubbleIn: {
    background: 'linear-gradient(180deg, rgba(30,41,59,0.92), rgba(15,23,42,0.94))',
    border: '1px solid rgba(148,163,184,0.12)', borderRadius: '20px 20px 6px 20px', padding: '11px 15px',
    fontSize: 13.5, color: '#EAF0FB', maxWidth: '76%', lineHeight: 1.7,
    display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 10px 26px -20px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.04)',
    overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0,
  },
  msgBubbleOut: {
    background: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 48%, #60A5FA 100%)',
    border: '1px solid rgba(191,219,254,0.22)', borderRadius: '20px 20px 20px 6px', padding: '11px 15px',
    fontSize: 13.5, color: '#ffffff', maxWidth: '76%', lineHeight: 1.7,
    display: 'flex', flexDirection: 'column', gap: 5, boxShadow: '0 14px 30px -18px rgba(59,130,246,0.9), inset 0 1px 0 rgba(255,255,255,0.16)',
    overflowWrap: 'anywhere', wordBreak: 'break-word', minWidth: 0,
  },
  msgImage: { width: '100%', maxWidth: 220, borderRadius: 12, display: 'block' },
  msgAudio: { width: 220, maxWidth: '100%', height: 36 },
  msgTime: { fontSize: 10, color: 'rgba(255,255,255,0.5)', alignSelf: 'flex-end' },
  composerBar: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
    background: 'linear-gradient(180deg, rgba(26,34,53,0.92), rgba(15,23,42,0.88))', border: '1px solid rgba(147,197,253,0.12)',
    borderRadius: 18, padding: 9, boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  composerIconBtn: {
    width: 38, height: 38, borderRadius: 11, background: 'transparent',
    border: 'none', color: '#8B96AD', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  recordingBar: {
    display: 'flex', alignItems: 'center', gap: 12, width: '100%', padding: '4px 6px',
  },
  recordingInfo: { flex: 1, display: 'flex', alignItems: 'center', gap: 9, justifyContent: 'center' },
  recordingDot: { width: 11, height: 11, borderRadius: '50%', background: '#F4143C', flexShrink: 0 },
  recordingTime: { fontSize: 15, fontWeight: 800, color: '#EAF0FB', fontFamily: 'monospace', minWidth: 44 },
  recordingLabel: { fontSize: 12.5, color: '#8B96AD' },
  recordingCancelBtn: {
    width: 40, height: 40, borderRadius: 12, background: 'rgba(244,91,105,0.12)',
    border: '1px solid rgba(244,91,105,0.25)', color: '#F45B69',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  recordingSendBtn: {
    width: 44, height: 44, borderRadius: 13, background: 'linear-gradient(135deg, #60A5FA, #2563EB)',
    border: 'none', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, boxShadow: '0 3px 14px -3px rgba(59,130,246,0.6)',
  },
  composerInput: {
    flex: 1, background: 'transparent', border: 'none', color: '#EAF0FB',
    fontSize: 13.5, padding: '6px 4px', fontFamily: "'Cairo', sans-serif",
  },
  composerSendBtn: {
    width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg, #60A5FA, #2563EB)',
    border: 'none', color: '#ffffff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 12px -2px rgba(59,130,246,0.5)',
  },
  linkedOrderCard: {
    background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: 14, padding: 16, marginBottom: 14,
  },
  linkedOrderHeader: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#3B82F6', marginBottom: 12 },
  linkedOrderBody: { display: 'flex', flexDirection: 'column', gap: 9 },
  linkedOrderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  linkedOrderLabel: { fontSize: 12, color: '#5E6986' },
  linkedOrderValue: { fontSize: 13, color: '#EAF0FB', fontWeight: 600 },
  linkedOrderDetailBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, width: '100%',
    marginTop: 12, padding: '10px', background: 'rgba(59,130,246,0.12)',
    border: '1px solid rgba(59,130,246,0.3)', borderRadius: 11, color: '#60A5FA',
    fontSize: 12.5, fontWeight: 700,
  },

  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '50px 20px', color: '#5E6986', fontSize: 13 },
  emptyStateLg: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, flex: 1, color: '#5E6986', fontSize: 14 },

  // ── Orders ──
  printBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px',
    background: 'linear-gradient(135deg,#60A5FA,#2563EB)', border: 'none', borderRadius: 11,
    color: '#ffffff', fontSize: 13, fontWeight: 700, boxShadow: '0 3px 14px -3px rgba(59,130,246,0.55)',
  },
  secondaryBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px',
    background: '#1A2235', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 11,
    color: '#C4CEE0', fontSize: 13, fontWeight: 700,
  },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 },
  statCard: {
    display: 'flex', alignItems: 'center', gap: 13, background: 'linear-gradient(180deg,#141B2C,#111725)',
    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: '18px 20px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  statIconWrap: { width: 42, height: 42, borderRadius: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontSize: 22, fontWeight: 800, color: '#EAF0FB', lineHeight: 1.15, letterSpacing: '-0.02em' },
  statLabel: { fontSize: 11, color: '#5E6986', marginTop: 3 },

  sectionTabs: { display: 'flex', gap: 8, marginBottom: 18 },
  sectionTab: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px',
    background: '#111725', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 13,
    color: '#8B96AD', fontSize: 13, fontWeight: 700, transition: 'all 0.16s cubic-bezier(0.22,1,0.36,1)',
  },
  sectionTabActive: {
    background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.06))',
    borderColor: 'rgba(59,130,246,0.32)', color: '#93C5FD',
  },
  filterChips: { display: 'flex', gap: 6 },
  chip: {
    padding: '8px 14px', background: '#1A2235', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 10, color: '#8B96AD', fontSize: 12, fontWeight: 600,
  },
  chipActive: { background: 'rgba(59,130,246,0.14)', borderColor: 'rgba(59,130,246,0.32)', color: '#93C5FD' },

  ordersGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(285px, 1fr))', gap: 18,
  },
  orderCard: {
    background: 'linear-gradient(180deg, rgba(20,27,44,0.92), rgba(12,17,29,0.96))', border: '1px solid rgba(147,197,253,0.08)', borderRadius: 22,
    padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    boxShadow: '0 18px 45px -30px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.055)',
    transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
  },
  orderTicketHead: {
    display: 'flex', alignItems: 'center', gap: 11, padding: '15px 16px 12px',
  },
  orderTicketAvatar: {
    width: 42, height: 42, borderRadius: 13, flexShrink: 0,
    background: 'linear-gradient(135deg, rgba(59,130,246,0.25), rgba(59,130,246,0.08))',
    border: '1px solid rgba(59,130,246,0.2)', color: '#93C5FD',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 17,
  },
  orderCardCustomer: { fontSize: 15, fontWeight: 700, color: '#EAF0FB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  orderTicketPage: { fontSize: 11.5, color: '#5E6986', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  orderStatusPill: {
    fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '4px 11px', flexShrink: 0,
  },
  orderTicketBody: {
    padding: '0 16px 12px', display: 'flex', flexDirection: 'column', gap: 7,
  },
  orderDetailRow: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#8B96AD' },
  deliveryStepRow: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: '#60A5FA', fontWeight: 700, marginTop: 2 },
  orderTicketItems: {
    fontSize: 12.5, color: '#C4CEE0', background: 'rgba(255,255,255,0.03)', borderRadius: 11,
    padding: '10px 12px', marginTop: 2, lineHeight: 1.55, border: '1px solid rgba(255,255,255,0.04)',
  },
  orderTicketFoot: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
    padding: '12px 16px', borderTop: '1px dashed rgba(255,255,255,0.08)',
  },
  orderCardTotal: { fontSize: 19, fontWeight: 800, color: '#EAF0FB', letterSpacing: '-0.02em' },
  orderCurrency: { fontSize: 12, fontWeight: 600, color: '#5E6986' },
  orderTicketMeta: { display: 'flex', gap: 5, alignItems: 'center', fontSize: 10.5, color: '#5E6986', marginTop: 3 },
  printedBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)',
    borderRadius: 20, padding: '2px 9px', fontSize: 10, fontWeight: 700,
  },
  batchBlock: {
    background: 'linear-gradient(180deg,#141B2C,#111725)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: 18,
    boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  batchHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10,
  },
  batchHeaderInfo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#EAF0FB' },
  batchHeaderTime: { fontSize: 11, color: '#5E6986', fontWeight: 500 },
  orderCardActions: {
    display: 'flex', gap: 6, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)',
    background: 'rgba(0,0,0,0.15)',
  },
  orderActionBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: 34, borderRadius: 10, background: '#1A2235', border: '1px solid rgba(255,255,255,0.06)',
    color: '#8B96AD',
  },
  statusSelect: {
    border: '1px solid', borderRadius: 10, padding: '6px 10px', fontSize: 12,
    fontWeight: 700, appearance: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif",
  },

  // ── Stats ──
  chartCard: {
    background: 'linear-gradient(180deg,#141B2C,#111725)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18,
    padding: 24, marginBottom: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  timeFilterBar: { display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' },
  customDateRow: { display: 'flex', gap: 10, marginBottom: 20 },
  customDateSelect: {
    background: '#1A2235', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 11,
    padding: '10px 14px', color: '#EAF0FB', fontSize: 13, fontFamily: "'Cairo', sans-serif", flex: 1,
  },
  customDateSelectCompact: {
    background: 'rgba(26,34,53,0.82)', border: '1px solid rgba(96,165,250,0.13)', borderRadius: 13,
    padding: '10px 13px', color: '#EAF0FB', fontSize: 12.5, fontFamily: "'Cairo', sans-serif", minWidth: 120,
  },
  filtersWrap: {
    display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16,
    background: 'linear-gradient(180deg, rgba(20,27,44,0.46), rgba(17,23,37,0.35))',
    border: '1px solid rgba(255,255,255,0.055)', borderRadius: 18, padding: 12,
  },
  dateChipsRow: { display: 'none' },
  filterBottomRow: { display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' },
  chartTitle: { fontSize: 15, fontWeight: 700, color: '#EAF0FB', margin: '0 0 18px' },
  barChartArea: { display: 'flex', flexDirection: 'column', gap: 16 },
  barChartRow: { display: 'grid', gridTemplateColumns: '180px 1fr 120px', gap: 14, alignItems: 'center' },
  barChartLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#C4CEE0', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  barChartTrack: { height: 10, background: '#1A2235', borderRadius: 6, overflow: 'hidden' },
  barChartFill: { height: '100%', background: 'linear-gradient(90deg,#1D4ED8,#60A5FA)', borderRadius: 6, transition: 'width 0.6s cubic-bezier(0.22,1,0.36,1)', boxShadow: '0 0 12px -2px rgba(59,130,246,0.6)' },
  barChartValue: { fontSize: 12, fontWeight: 700, color: '#60A5FA', textAlign: 'left' },

  statsGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  donutWrap: { display: 'flex', justifyContent: 'center', padding: '10px 0' },
  pageStatRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageStatInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  pageStatBadge: {
    background: '#1A2235', padding: '5px 12px', borderRadius: 20, fontSize: 11,
    fontWeight: 700, color: '#8B96AD',
  },

  // ── Pages ──
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px',
    background: 'linear-gradient(135deg,#60A5FA,#1D4ED8)', border: 'none', borderRadius: 10,
    color: '#ffffff', fontSize: 13, fontWeight: 700, boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
  },
  confirmBtn: {
    background: '#3B82F6', border: 'none', borderRadius: 8, padding: '0 18px',
    color: '#ffffff', fontWeight: 700, fontSize: 13,
  },
  fbErrorBox: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
    background: 'rgba(244,91,105,0.08)', border: '1px solid rgba(244,91,105,0.25)',
    borderRadius: 12, padding: '12px 16px', color: '#F45B69', fontSize: 13, lineHeight: 1.6,
  },
  fbExchangingBox: {
    marginBottom: 16, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: 12, padding: '12px 16px', color: '#3B82F6', fontSize: 13,
  },
  fbCandidatesWrap: {
    marginBottom: 20, background: '#111725', border: '1px solid rgba(59,130,246,0.2)',
    borderRadius: 14, padding: 16,
  },
  fbCandidatesTitle: { fontSize: 13, fontWeight: 700, color: '#EAF0FB', marginBottom: 12 },
  fbCandidateRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  fbCandidateAvatarImg: { width: 38, height: 38, borderRadius: 10, objectFit: 'cover' },
  fbCandidateId: { fontSize: 11, color: '#5E6986', marginTop: 2 },
  pagesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 18 },
  pageCard: {
    position: 'relative', display: 'flex', flexDirection: 'column', gap: 14,
    background: 'linear-gradient(180deg, rgba(20,27,44,0.92), rgba(12,17,29,0.96))',
    border: '1px solid rgba(147,197,253,0.10)', borderRadius: 24, padding: 18,
    boxShadow: '0 20px 55px -34px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.055)', overflow: 'hidden',
  },
  pageCardTopLine: { position: 'absolute', top: 0, right: 22, left: 22, height: 3, background: 'linear-gradient(90deg, transparent, #60A5FA, transparent)' },
  pageCardHeader: { display: 'flex', alignItems: 'center', gap: 13, width: '100%' },
  subscribeBtn: {
    width: '100%', marginTop: 0, background: 'linear-gradient(135deg, rgba(74,222,128,0.18), rgba(34,197,94,0.08))',
    border: '1px solid rgba(74,222,128,0.32)', borderRadius: 14, padding: '11px 0',
    color: '#86EFAC', fontSize: 12.5, fontWeight: 900,
  },
  pageCardAvatar: {
    width: 54, height: 54, borderRadius: 18, background: 'linear-gradient(135deg, rgba(59,130,246,0.24), rgba(96,165,250,0.07))', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0, border: '1px solid rgba(96,165,250,0.18)',
  },
  pageCardName: { fontSize: 15.5, fontWeight: 900, color: '#EAF0FB', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pageCardMeta: { fontSize: 11, color: '#6B7280', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  pageCardStatus: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginTop: 4, fontWeight: 600 },
  pageStatusPill: { display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', borderRadius: 999, padding: '8px 12px', fontSize: 12, fontWeight: 900, border: '1px solid' },
  pageStatusPillOk: { color: '#86EFAC', background: 'rgba(34,197,94,0.10)', borderColor: 'rgba(74,222,128,0.28)' },
  pageStatusPillWait: { color: '#93C5FD', background: 'rgba(59,130,246,0.10)', borderColor: 'rgba(96,165,250,0.25)' },
  liveDot: { width: 8, height: 8, borderRadius: '50%', boxShadow: '0 0 14px currentColor' },
  iconBtnDanger: {
    width: 32, height: 32, borderRadius: 9, background: 'rgba(244,91,105,0.1)',
    border: 'none', color: '#F45B69', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // ── Users ──
  usersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  userCard: {
    background: 'linear-gradient(180deg,#141B2C,#111725)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: 18,
    boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -8px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)',
  },
  userCardTop: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  userCardAvatar: {
    width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0,
  },
  userCardName: { fontSize: 14, fontWeight: 700, color: '#EAF0FB' },
  userCardRole: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#8B96AD', marginTop: 3 },
  activeDot: { width: 9, height: 9, borderRadius: '50%', flexShrink: 0 },
  userPermsList: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.06)' },
  permTag: {
    background: 'rgba(59,130,246,0.12)', color: '#60A5FA', fontSize: 10, fontWeight: 600,
    padding: '4px 9px', borderRadius: 8,
  },
  userCardActions: { display: 'flex', gap: 8 },
  userActionBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    padding: '8px', background: '#1A2235', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, color: '#8B96AD', fontSize: 11, fontWeight: 600,
  },
  userCardMetaRow: { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 },
  userCodeTag: {
    fontSize: 11, color: '#8B96AD', background: '#1A2235', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, padding: '4px 10px', fontFamily: 'monospace',
  },
  warehouseNote: {
    display: 'flex', gap: 9, alignItems: 'flex-start', background: 'rgba(240,168,104,0.08)',
    border: '1px solid rgba(240,168,104,0.22)', borderRadius: 11, padding: 12,
    fontSize: 12, color: '#C4CEE0', lineHeight: 1.6,
  },
  rejectReasonBox: {
    margin: '0 16px 12px', padding: '10px 12px', background: 'rgba(244,91,105,0.08)',
    border: '1px solid rgba(244,91,105,0.2)', borderRadius: 11, fontSize: 12.5, color: '#EAF0FB',
    display: 'flex', flexDirection: 'column', gap: 3,
  },
  rejectReasonLabel: { fontSize: 11, color: '#F45B69', fontWeight: 700 },
  rejectedCard: {
    border: '1.5px solid rgba(244,91,105,0.45)',
    boxShadow: '0 0 0 1px rgba(244,91,105,0.15), 0 8px 24px -8px rgba(244,91,105,0.35)',
  },
  rejectedBanner: {
    display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center',
    background: 'linear-gradient(135deg, #F4143C, #C0143C)', color: '#fff',
    fontSize: 12.5, fontWeight: 800, padding: '9px 12px',
    borderRadius: '16px 16px 0 0', margin: '-1px -1px 0',
  },
  prepTimeRow: {
    display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#8B96AD',
    margin: '0 16px 10px', paddingTop: 2,
  },
  orderReprepNoteBox: {
    display: 'flex', alignItems: 'flex-start', gap: 8, margin: '0 16px 12px',
    background: 'rgba(244,91,105,0.12)', border: '1px solid rgba(244,91,105,0.35)', color: '#FFD0D6',
    borderRadius: 12, padding: '10px 12px', fontSize: 12.5, lineHeight: 1.6,
  },
  globalOrderSearchWrap: {
    position: 'relative', display: 'flex', alignItems: 'center', gap: 7,
    width: 230, minHeight: 38, background: '#111827', border: '1px solid rgba(96,165,250,0.32)',
    borderRadius: 12, padding: '0 11px', boxShadow: '0 8px 22px -16px rgba(96,165,250,0.7)',
  },
  globalOrderSearchInput: {
    width: '100%', background: 'transparent', border: 'none', outline: 'none', color: '#EAF0FB',
    fontSize: 12.5, fontFamily: "'Cairo', sans-serif",
  },
  globalOrderResultsBox: {
    position: 'absolute', top: 'calc(100% + 8px)', left: 0, right: 0, zIndex: 50,
    background: '#101827', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 14,
    boxShadow: '0 18px 40px -18px rgba(0,0,0,0.85)', padding: 6, maxHeight: 360, overflowY: 'auto',
  },
  globalOrderResultItem: {
    width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 8px', border: 'none',
    background: 'transparent', borderRadius: 10, textAlign: 'right', color: '#EAF0FB',
  },
  globalOrderResultTitle: { fontSize: 12.5, fontWeight: 800, color: '#EAF0FB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  globalOrderResultMeta: { fontSize: 11, color: '#7C879E', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  globalOrderEmpty: { padding: '12px', color: '#8B96AD', fontSize: 12, textAlign: 'center' },

  // ── واجهة موظف المخزن ──
  warehouseWrap: { flex: 1, overflow: 'auto', padding: '24px 18px', maxWidth: 760, margin: '0 auto', width: '100%' },
  warehouseHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 12,
    paddingTop: 'env(safe-area-inset-top, 0px)',
  },
  warehouseGrid: { display: 'flex', flexDirection: 'column', gap: 14 },
  warehouseCard: {
    background: 'linear-gradient(180deg,#141B2C,#111725)', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 18, padding: 18, boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -8px rgba(0,0,0,0.5)',
  },
  warehouseCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  warehouseCardNo: { fontSize: 13, fontWeight: 800, color: '#60A5FA', fontFamily: 'monospace' },
  warehouseCardDate: { fontSize: 11.5, color: '#5E6986' },
  warehouseBigType: {
    fontSize: 19, fontWeight: 800, color: '#EAF0FB', lineHeight: 1.5, letterSpacing: '-0.01em',
    overflowWrap: 'anywhere', whiteSpace: 'pre-wrap',
  },
  warehouseFilterBar: { display: 'flex', gap: 8, marginBottom: 18 },
  warehouseFilterChip: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
    padding: '11px 8px', background: '#141B2C', border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 13, color: '#8B96AD', fontSize: 13.5, fontWeight: 700,
  },
  warehouseFilterChipActive: {
    background: 'linear-gradient(135deg, rgba(59,130,246,0.18), rgba(59,130,246,0.06))',
    borderColor: 'rgba(59,130,246,0.45)', color: '#EAF0FB',
  },
  warehouseFilterCount: {
    minWidth: 22, height: 22, borderRadius: 11, background: 'rgba(255,255,255,0.08)',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    fontSize: 11.5, fontWeight: 800, padding: '0 6px',
  },
  warehouseFilterCountActive: { background: '#3B82F6', color: '#fff' },
  warehouseReprepNote: {
    display: 'flex', alignItems: 'flex-start', gap: 10, marginTop: 12,
    background: 'linear-gradient(135deg, rgba(244,91,105,0.22), rgba(244,91,105,0.08))',
    border: '1px solid rgba(244,91,105,0.55)', borderRadius: 14, padding: '12px 14px',
    color: '#FFD0D6', boxShadow: '0 0 0 1px rgba(244,91,105,0.08), 0 10px 26px -18px rgba(244,91,105,0.9)',
  },
  warehouseReprepTitle: { fontSize: 13, fontWeight: 900, color: '#FF8A98', marginBottom: 3 },
  warehouseReprepText: { fontSize: 15, fontWeight: 800, color: '#FFF1F3', lineHeight: 1.55, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  warehouseItemsBox: {
    marginTop: 12, background: 'rgba(240,168,104,0.06)', border: '1px solid rgba(240,168,104,0.18)',
    borderRadius: 12, padding: '12px 14px',
  },
  warehouseItemsLabel: { fontSize: 11.5, fontWeight: 700, color: '#F0A868', marginBottom: 5 },
  warehouseItemsText: { fontSize: 14.5, color: '#EAF0FB', lineHeight: 1.6, overflowWrap: 'anywhere', whiteSpace: 'pre-wrap' },
  warehouseBadge: {
    width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#F0A868,#E0833C)',
    color: '#2A1606', fontSize: 19, fontWeight: 800, display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 14px -4px rgba(240,168,104,0.6)',
  },
  warehouseActions: { display: 'flex', gap: 10, marginTop: 16 },
  warehouseDoneBtn: {
    flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '15px',
    background: 'linear-gradient(135deg,#4ADE80,#16A34A)', border: 'none', borderRadius: 13,
    color: '#06210F', fontSize: 15, fontWeight: 800, boxShadow: '0 3px 14px -3px rgba(74,222,128,0.5)',
  },
  warehouseRejectBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '15px',
    background: 'rgba(244,91,105,0.12)', border: '1px solid rgba(244,91,105,0.3)', borderRadius: 13,
    color: '#F45B69', fontSize: 14, fontWeight: 700,
  },

  // ── Modal ──
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
  },
  modal: {
    background: 'linear-gradient(180deg,#161E30,#121826)', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 20, width: '100%', maxWidth: 460, maxHeight: '88vh', overflowY: 'auto',
    boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 16px 50px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)', position: 'relative', zIndex: 1,
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)',
  },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#EAF0FB', margin: 0 },
  modalClose: { background: 'transparent', border: 'none', color: '#5E6986', display: 'flex' },
  modalBody: { padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 7 },
  formLabel: { fontSize: 12, fontWeight: 600, color: '#8B96AD' },
  formInput: {
    background: '#0A0E17', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9,
    padding: '11px 14px', color: '#EAF0FB', fontSize: 13, fontFamily: "'Cairo', sans-serif",
  },
  roleToggle: { display: 'flex', gap: 8 },
  roleBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px', background: '#0A0E17', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 9, color: '#8B96AD', fontSize: 12, fontWeight: 600,
  },
  roleBtnActive: { background: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.3)', color: '#60A5FA' },
  permsGrid: { display: 'flex', flexDirection: 'column', gap: 4 },
  permCheckRow: { display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#C4CEE0', padding: '6px 0', cursor: 'pointer' },
  modalFooter: { display: 'flex', gap: 10, padding: '18px 22px', borderTop: '1px solid rgba(255,255,255,0.06)' },
  modalCancelBtn: {
    flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 9, color: '#8B96AD', fontSize: 13, fontWeight: 600,
  },
  modalSaveBtn: {
    flex: 1, padding: '11px', background: 'linear-gradient(135deg,#60A5FA,#1D4ED8)',
    border: 'none', borderRadius: 9, color: '#ffffff', fontSize: 13, fontWeight: 700,
    boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
  },
  detailGridRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    paddingBottom: 12, borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  detailGridLabel: { fontSize: 12.5, color: '#5E6986', flexShrink: 0 },
  detailGridValue: { fontSize: 13.5, color: '#EAF0FB', fontWeight: 600, textAlign: 'left', overflowWrap: 'anywhere' },
  detailActionBtn: {
    flex: 1, minWidth: 90, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '11px 10px', background: '#1A2235', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 10, color: '#C4CEE0', fontSize: 12.5, fontWeight: 700,
  },
  statsBottomBtns: { display: 'flex', gap: 10, marginTop: 18 },
  statsSmallBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, flex: 1, padding: '13px',
    background: '#141B2C', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 13,
    color: '#C4CEE0', fontSize: 13, fontWeight: 700,
  },
  statsSummaryBtn: {
    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flex: 1.4, padding: '13px',
    background: 'linear-gradient(135deg,#60A5FA,#1D4ED8)', border: 'none', borderRadius: 13,
    color: '#fff', fontSize: 14, fontWeight: 800, boxShadow: '0 3px 14px -3px rgba(59,130,246,0.5)',
  },
  summaryRow: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    padding: '13px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8,
  },
  summaryRowSub: { background: 'transparent', border: 'none', padding: '6px 20px', marginBottom: 2 },
  summaryRowLabel: { fontSize: 13.5, fontWeight: 600 },
  summaryRowValue: { fontSize: 18, fontWeight: 800 },
  summaryHint: { fontSize: 11.5, color: '#5E6986', textAlign: 'center', marginTop: 10 },
  bestSellerRow: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 },
  bestSellerRank: {
    width: 28, height: 28, borderRadius: 9, background: 'rgba(59,130,246,0.15)', color: '#60A5FA',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0,
  },
  bestSellerType: { fontSize: 13.5, fontWeight: 700, color: '#EAF0FB', marginBottom: 5, overflowWrap: 'anywhere' },
  bestSellerTrack: { height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' },
  bestSellerFill: { height: '100%', background: 'linear-gradient(90deg,#3B82F6,#60A5FA)', borderRadius: 4 },
  bestSellerCount: { fontSize: 15, fontWeight: 800, color: '#60A5FA', minWidth: 28, textAlign: 'center', flexShrink: 0 },
  convertedRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  convertedCustomer: { fontSize: 14, fontWeight: 700, color: '#EAF0FB' },
  convertedSub: { fontSize: 12, color: '#93C5FD', marginTop: 2 },
  convertedMeta: { fontSize: 11, color: '#5E6986', marginTop: 3 },
  convertedTotal: { fontSize: 14, fontWeight: 800, color: '#60A5FA', flexShrink: 0 },
  neglectedRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '12px', marginBottom: 8,
    borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
    cursor: 'pointer',
  },
  neglectedRowSel: { background: 'rgba(59,130,246,0.1)', borderColor: 'rgba(59,130,246,0.4)' },
  neglectedCheck: {
    width: 24, height: 24, borderRadius: 7, border: '1.5px solid rgba(255,255,255,0.2)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: '#fff',
  },
  neglectedCheckOn: { background: '#3B82F6', borderColor: '#3B82F6' },
};
