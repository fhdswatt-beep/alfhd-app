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
    total: Number(row.total) || 0,
    status: row.status,
    date: row.order_date,
    fahdRef: row.fahd_ref,
    source: row.source || 'manual',
    conversationId: row.conversation_id || null,
    converted: !!row.converted,
    convertedAt: row.converted_at || null,
    createdAt: row.created_at || row.order_date,
    printed: !!row.printed,
    printBatchId: row.print_batch_id || null,
    printedAt: row.printed_at || null,
  };
}

function mapUserFromDb(row) {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    role: row.role,
    permissions: row.permissions || [],
    active: row.active,
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
  pending:   { label: 'قيد التوصيل', color: '#2F8EFF', bg: 'rgba(47,142,255,0.12)', icon: Truck },
  returned:  { label: 'راجع',        color: '#F45B69', bg: 'rgba(244,91,105,0.12)', icon: XCircle },
  delivered: { label: 'مستلم',       color: '#4ADE80', bg: 'rgba(74,222,128,0.12)', icon: CheckCircle2 },
};

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
          <stop offset="0%" stopColor="#6FB6FF" />
          <stop offset="100%" stopColor="#1A5FB4" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" stroke="url(#fahdGrad)" strokeWidth="1.5" opacity="0.4" />
      <path
        d="M50 18 C35 18 24 30 22 45 C21 52 24 58 28 63 L32 58 C29 54 27 50 28 45 C29 35 38 26 50 26 C62 26 71 35 72 45 C73 50 71 54 68 58 L72 63 C76 58 79 52 78 45 C76 30 65 18 50 18 Z"
        fill="url(#fahdGrad)"
      />
      <circle cx="40" cy="42" r="3" fill="#0B0D12" />
      <circle cx="60" cy="42" r="3" fill="#0B0D12" />
      <path d="M50 48 L46 55 L54 55 Z" fill="#0B0D12" opacity="0.7" />
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
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const hiddenInputRef = React.useRef(null);

  const attemptLogin = (value) => {
    const entered = value.trim();
    const match = users.find((u) => u.code === entered && u.active);
    if (match) {
      onLogin(match);
    } else {
      setError(true);
      setShake(true);
      setCode('');
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6);
    setCode(value);
    setError(false);
    if (value.length === 6) {
      attemptLogin(value);
    }
  };

  return (
    <div style={styles.loginWrap}>
      <div style={styles.loginBgPattern} />
      <div
        className="alfhd-login-card"
        style={{
          ...styles.loginCard,
          animation: shake ? 'shake 0.4s ease' : 'none',
        }}
      >
        <div style={styles.loginCardAccent} />
        <div style={styles.loginLogoArea}>
          <div style={styles.logoGlow} />
          <FahdLogo size={64} />
        </div>
        <h1 style={styles.loginTitle}>AlFhd</h1>
        <p style={styles.loginSubtitle}>منصّة إدارة الطلبات والمحادثات</p>

        <div style={{ width: '100%', marginTop: 38 }}>
          <label style={styles.inputLabel}>أدخل رمز الدخول المكوّن من 6 أرقام</label>
          <div style={styles.pinBoxesWrap} onClick={() => hiddenInputRef.current?.focus()}>
            {Array.from({ length: 6 }).map((_, i) => (
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
            />
          </div>
          {error && <p style={styles.errorText}>الرمز غير صحيح، حاول مجدداً</p>}
        </div>
      </div>
      <p style={styles.loginFooter}>AlFhd Order Management © 2026</p>
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
    { id: 'users', label: 'المستخدمين', icon: Users, adminOnly: true },
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
  const dim = size === 'lg' ? 17 : 14;
  return (
    <div style={{
      position: 'absolute', bottom: -2, left: -2, width: dim, height: dim,
      borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: isWhatsApp ? '#25D366' : '#006AFF',
      border: '2px solid #0B0D12', boxShadow: '0 1px 3px rgba(0,0,0,0.4)',
    }}>
      {isWhatsApp ? (
        <svg width={dim * 0.55} height={dim * 0.55} viewBox="0 0 24 24" fill="white">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.79.47 3.47 1.29 4.93L2 22l5.31-1.39a9.87 9.87 0 0 0 4.73 1.2h.01c5.46 0 9.91-4.45 9.91-9.91S17.5 2 12.04 2zm0 17.92h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.1.82.83-3.03-.2-.31a8.16 8.16 0 0 1-1.27-4.36c0-4.54 3.7-8.24 8.25-8.24 2.2 0 4.27.86 5.83 2.42a8.18 8.18 0 0 1 2.41 5.83c0 4.55-3.7 8.2-8.26 8.2z" />
        </svg>
      ) : (
        <svg width={dim * 0.55} height={dim * 0.55} viewBox="0 0 24 24" fill="white">
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
          style={{ ...wrapStyle, objectFit: 'cover', background: '#1C1F28' }}
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
function ConversationsView({ conversations, pages, orders, setConversations, pendingOpenConvId, clearPendingOpenConvId, onCreateOrderFromConv }) {
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
    }
    clearPendingOpenConvId?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingOpenConvId, conversations]);

  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [composerText, setComposerText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [recording, setRecording] = useState(false);

  const fileInputRef = React.useRef(null);
  const mediaRecorderRef = React.useRef(null);
  const audioChunksRef = React.useRef([]);
  const scrollRef = React.useRef(null);

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      if (c.tab !== activeTab) return false;
      if (selectedPage !== 'all' && c.pageId !== selectedPage) return false;
      if (search && !c.customer.includes(search)) return false;
      return true;
    });
  }, [conversations, activeTab, selectedPage, search]);

  const counts = useMemo(() => {
    const base = { normal: 0, pinned: 0, handoff: 0 };
    conversations.forEach((c) => {
      if (selectedPage === 'all' || c.pageId === selectedPage) base[c.tab]++;
    });
    return base;
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
    const interval = setInterval(() => loadMessages(selectedConv.id), 4000);
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
    if (!res.ok) throw new Error(`فشل رفع الملف: ${res.status}`);
    return `${SUPABASE_URL}/storage/v1/object/public/chat-media/${filename}`;
  }

  async function sendToFacebook(payload) {
    const res = await fetch(FB_SEND_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
      alert('تعذّر إرسال الصورة، تأكد من إنشاء Storage Bucket باسم chat-media وجعله عاماً (Public)');
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
      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
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
          alert('تعذّر إرسال التسجيل الصوتي');
        } finally {
          setSendingMsg(false);
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch (e) {
      alert('تعذّر الوصول إلى الميكروفون، تأكد من السماح بالإذن من المتصفح');
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header">
        <div>
          <h2 style={styles.viewTitle}>المحادثات</h2>
          <p style={styles.viewSubtitle}>إدارة محادثات صفحاتك في مكان واحد</p>
        </div>
        <div style={styles.pageSelectWrap}>
          <Facebook size={15} color="#2F8EFF" />
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
          <ChevronDown size={14} color="#6B6760" />
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
              style={{ ...styles.convTab, ...(active ? styles.convTabActive : {}) }}
            >
              <Icon size={15} />
              {tab.label}
              <span style={{
                ...styles.convTabCount,
                ...(active ? styles.convTabCountActive : {}),
              }}>
                {counts[tab.id]}
              </span>
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
            <Search size={15} color="#6B6760" />
            <input
              placeholder="بحث باسم العميل..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          {filtered.length === 0 ? (
            <div style={styles.emptyState}>
              <MessageSquare size={32} color="#3A372F" />
              <p>لا توجد محادثات هنا</p>
            </div>
          ) : (
            filtered.map((c) => {
              const page = pages.find((p) => p.id === c.pageId);
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedConv(c)}
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
                    <div style={styles.convPageTag}>{page?.avatar} {page?.name}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>

        <div
          style={styles.convDetail}
          className={`alfhd-conv-detail${selectedConv ? ' alfhd-conv-detail-active-mobile' : ''}`}
        >
          {selectedConv ? (
            <>
              <div style={styles.detailHeader}>
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
                <div style={styles.linkedOrderCard}>
                  <div style={styles.linkedOrderHeader}>
                    <Pin size={14} color="#2F8EFF" />
                    <span>طلب مثبّت بهذه المحادثة</span>
                  </div>
                  <div style={styles.linkedOrderBody}>
                    <div style={styles.linkedOrderRow}>
                      <span style={styles.linkedOrderLabel}>رقم الطلب</span>
                      <span style={styles.linkedOrderValue}>#{linkedOrder.orderNo}</span>
                    </div>
                    <div style={styles.linkedOrderRow}>
                      <span style={styles.linkedOrderLabel}>الحالة</span>
                      <StatusPill status={linkedOrder.status} />
                    </div>
                    <div style={styles.linkedOrderRow}>
                      <span style={styles.linkedOrderLabel}>المنتجات</span>
                      <span style={styles.linkedOrderValue}>{linkedOrder.items}</span>
                    </div>
                    <div style={styles.linkedOrderRow}>
                      <span style={styles.linkedOrderLabel}>المبلغ</span>
                      <span style={{ ...styles.linkedOrderValue, color: '#2F8EFF', fontWeight: 700 }}>
                        {linkedOrder.total.toLocaleString()} د.ع
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div style={styles.chatScroll} ref={scrollRef} className="alfhd-chat-scroll">
                {loadingMsgs ? (
                  <div style={styles.emptyStateLg}>
                    <RefreshCw size={22} color="#3A372F" style={{ animation: 'spin 1s linear infinite' }} />
                  </div>
                ) : messages.length === 0 ? (
                  <div style={styles.emptyStateLg}>
                    <MessageSquare size={32} color="#3A372F" />
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
                      }}
                    >
                      <div style={m.direction === 'outgoing' ? styles.msgBubbleOut : styles.msgBubbleIn}>
                        {m.type === 'image' && m.mediaUrl && (
                          <img src={m.mediaUrl} alt="" style={styles.msgImage} />
                        )}
                        {m.type === 'audio' && m.mediaUrl && (
                          <audio controls src={m.mediaUrl} style={styles.msgAudio} />
                        )}
                        {m.content && <div>{m.content}</div>}
                        <div style={styles.msgTime}>{m.time}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div style={styles.composerBar}>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handlePickImage}
                  style={{ display: 'none' }}
                />
                <button
                  style={styles.composerIconBtn}
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sendingMsg}
                  title="إرسال صورة"
                >
                  <Image size={18} />
                </button>
                <button
                  style={{
                    ...styles.composerIconBtn,
                    ...(recording ? styles.composerIconBtnActive : {}),
                  }}
                  onClick={recording ? stopRecording : startRecording}
                  title={recording ? 'إيقاف التسجيل وإرسال' : 'تسجيل صوتي'}
                >
                  {recording ? <Square size={16} /> : <Mic size={18} />}
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
              </div>
            </>
          ) : (
            <div style={styles.emptyStateLg}>
              <MessageSquare size={40} color="#3A372F" />
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

// ──────────────────────────────────────────────
// عرض الطلبات
// ──────────────────────────────────────────────
function OrdersView({ orders, pages, setOrders, conversations, setConversations, onViewConversation, pendingNewOrderFromConv, clearPendingNewOrderFromConv }) {
  const [selectedPage, setSelectedPage] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingOrder, setEditingOrder] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const ocrInputRef = React.useRef(null);
  const [section, setSection] = useState('ready');
  const [printTarget, setPrintTarget] = useState(null);

  useEffect(() => {
    if (!pendingNewOrderFromConv) return;
    const conv = pendingNewOrderFromConv;
    setEditingOrder({
      id: null,
      pageId: conv.pageId || pages[0]?.id || '',
      customer: conv.customer || '',
      phone: '',
      address: '',
      items: '',
      total: '',
      status: 'pending',
      conversationId: conv.id || '',
    });
    clearPendingNewOrderFromConv?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingNewOrderFromConv]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (selectedPage !== 'all' && o.pageId !== selectedPage) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search && !o.customer.includes(search) && !o.orderNo.includes(search)) return false;
      return true;
    });
  }, [orders, selectedPage, statusFilter, search]);

  const stats = useMemo(() => {
    const scoped = selectedPage === 'all' ? orders : orders.filter((o) => o.pageId === selectedPage);
    return {
      total: scoped.length,
      pending: scoped.filter((o) => o.status === 'pending').length,
      delivered: scoped.filter((o) => o.status === 'delivered').length,
      returned: scoped.filter((o) => o.status === 'returned').length,
    };
  }, [orders, selectedPage]);

  const updateStatus = async (id, status) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    try {
      await sbUpdate('alfhd_orders', id, { status });
    } catch (e) {
      console.error('Failed to update order status:', e);
    }
  };

  function startNewOrder() {
    setEditingOrder({
      id: null, pageId: pages[0]?.id || '', customer: '', phone: '', address: '',
      items: '', total: '', status: 'pending', conversationId: '',
    });
  }

  function startEditOrder(o) {
    setEditingOrder({ ...o, total: String(o.total), conversationId: o.conversationId || '' });
  }

  async function handleDelete(o) {
    if (!window.confirm(`هل تريد حذف الطلب #${o.orderNo}؟ لا يمكن التراجع عن هذا الإجراء، ولن يُحتسب بعدها ضمن الإحصائيات.`)) return;
    setOrders((prev) => prev.filter((x) => x.id !== o.id));
    try {
      await sbDelete('alfhd_orders', o.id);
    } catch (e) {
      console.error('delete order error:', e);
      alert('تعذّر حذف الطلب من القاعدة، تحقق من اتصالك وحاول مرة أخرى');
    }
  }

  function buildOrderShareText(o) {
    const page = pages.find((p) => p.id === o.pageId);
    return [
      `طلب جديد #${o.orderNo}`,
      page ? `الصفحة: ${page.name}` : null,
      `العميل: ${o.customer}`,
      o.phone ? `الهاتف: ${o.phone}` : null,
      o.address ? `العنوان: ${o.address}` : null,
      `المنتجات: ${o.items}`,
      `المبلغ: ${Number(o.total).toLocaleString()} د.ع`,
    ].filter(Boolean).join('\n');
  }

  async function markOrderConverted(id) {
    setOrders((prev) => prev.map((x) => (x.id === id ? { ...x, converted: true, convertedAt: new Date().toISOString() } : x)));
    try {
      await sbUpdate('alfhd_orders', id, { converted: true, converted_at: new Date().toISOString() });
    } catch (e) {
      console.error('convert order error:', e);
    }
  }

  async function handleShare(o) {
    const text = buildOrderShareText(o);
    try {
      if (navigator.share) {
        await navigator.share({ title: `طلب #${o.orderNo}`, text });
        await markOrderConverted(o.id);
        return;
      }
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
        alert('تم نسخ تفاصيل الطلب، الصقها بأي تطبيق تحب (واتساب، تليجرام، رسائل نصية...)');
        await markOrderConverted(o.id);
        return;
      }
      window.prompt('انسخ تفاصيل الطلب يدوياً:', text);
      await markOrderConverted(o.id);
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
      console.error('pin conversation to order error:', e);
    }
  }

  async function handleSaveOrder() {
    if (!editingOrder.customer.trim()) { alert('أدخل اسم العميل'); return; }
    if (!editingOrder.pageId) { alert('اختر الصفحة المرتبطة بالطلب'); return; }
    setSaving(true);
    try {
      if (editingOrder.id) {
        const payload = {
          page_id: editingOrder.pageId,
          customer_name: editingOrder.customer,
          phone: editingOrder.phone,
          address: editingOrder.address,
          items: editingOrder.items,
          total: Number(editingOrder.total) || 0,
          status: editingOrder.status,
          conversation_id: editingOrder.conversationId || null,
          source: editingOrder.conversationId ? 'chat' : (editingOrder.source || 'manual'),
        };
        await sbUpdate('alfhd_orders', editingOrder.id, payload);
        setOrders((prev) => prev.map((o) => (o.id === editingOrder.id ? {
          ...o,
          pageId: editingOrder.pageId, customer: editingOrder.customer, phone: editingOrder.phone,
          address: editingOrder.address, items: editingOrder.items, total: Number(editingOrder.total) || 0,
          status: editingOrder.status, conversationId: editingOrder.conversationId || null,
          source: editingOrder.conversationId ? 'chat' : (o.source || 'manual'),
        } : o)));
        if (editingOrder.conversationId) {
          await pinConversationToOrder(editingOrder.conversationId, editingOrder.id);
        }
      } else {
        const payload = {
          order_no: String(Date.now()).slice(-6),
          page_id: editingOrder.pageId,
          customer_name: editingOrder.customer,
          phone: editingOrder.phone,
          address: editingOrder.address,
          items: editingOrder.items,
          total: Number(editingOrder.total) || 0,
          status: editingOrder.status || 'pending',
          order_date: new Date().toISOString().slice(0, 10),
          fahd_ref: `FHD-${Math.floor(10000 + Math.random() * 89999)}`,
          conversation_id: editingOrder.conversationId || null,
          source: editingOrder.conversationId ? 'chat' : 'manual',
        };
        const created = await sbInsert('alfhd_orders', payload);
        if (created?.[0]) {
          setOrders((prev) => [mapOrderFromDb(created[0]), ...prev]);
          if (editingOrder.conversationId) {
            await pinConversationToOrder(editingOrder.conversationId, created[0].id);
          }
        }
      }
      setEditingOrder(null);
    } catch (e) {
      console.error('save order error:', e);
      alert('تعذّر حفظ الطلب، تحقق من اتصالك وحاول مرة أخرى');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mediaType }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) throw new Error(data?.error || 'فشل الاستخراج');
      setEditingOrder({
        id: null,
        pageId: pages[0]?.id || '',
        customer: data.order?.customer_name || '',
        phone: data.order?.phone || '',
        address: data.order?.address || '',
        items: data.order?.items || '',
        total: data.order?.total ? String(data.order.total) : '',
        status: 'pending',
        conversationId: '',
      });
    } catch (e) {
      console.error('ocr error:', e);
      alert('تعذّر استخراج تفاصيل الطلب من الصورة تلقائياً، تقدر تدخلها يدوياً بالنموذج الحين');
      setEditingOrder({
        id: null, pageId: pages[0]?.id || '', customer: '', phone: '', address: '',
        items: '', total: '', status: 'pending', conversationId: '',
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
      .map(([batchId, batchOrders]) => ({
        batchId,
        orders: batchOrders,
        printedAt: batchOrders[0]?.printedAt || null,
      }))
      .sort((a, b) => new Date(b.printedAt || 0) - new Date(a.printedAt || 0));
  }

  async function markOrdersPrinted(ids) {
    if (ids.length === 0) return;
    const batchId = `batch-${Date.now()}`;
    const printedAt = new Date().toISOString();
    setOrders((prev) => prev.map((o) => (
      ids.includes(o.id) ? { ...o, printed: true, printBatchId: batchId, printedAt } : o
    )));
    try {
      await Promise.all(ids.map((id) => sbUpdate('alfhd_orders', id, {
        printed: true, print_batch_id: batchId, printed_at: printedAt,
      })));
    } catch (e) {
      console.error('mark printed error:', e);
    }
  }

  function triggerPrint(target, idsToMark) {
    setPrintTarget(target);
    setTimeout(() => {
      window.print();
      setPrintTarget(null);
      if (idsToMark?.length) markOrdersPrinted(idsToMark);
    }, 60);
  }

  function handlePrintReady() {
    const ids = readyOrders.map((o) => o.id);
    if (ids.length === 0) { alert('لا توجد طلبات جاهزة للطباعة حالياً'); return; }
    triggerPrint('ready', ids);
  }

  function handleReprintBatch(batchId) {
    triggerPrint(batchId, null);
  }

  const readyOrders = filtered.filter((o) => !o.printed);
  const deliveryOrders = filtered.filter((o) => o.printed);
  const batches = useMemo(() => groupByBatch(deliveryOrders), [deliveryOrders]);

  function renderOrderCard(o) {
    const page = pages.find((p) => p.id === o.pageId);
    return (
      <div key={o.id} style={styles.orderCard} className="alfhd-order-card">
        <div style={styles.orderCardTop}>
          <span style={styles.orderCardPageTag}>{page?.avatar} {page?.name || 'بدون صفحة'}</span>
          <span style={styles.orderCardNo}>#{o.orderNo}</span>
        </div>

        <div style={styles.orderCardCustomer}>{o.customer}</div>
        {o.phone && <div style={styles.orderCardSub}>{o.phone}</div>}
        {o.address && <div style={styles.orderCardSub}>{o.address}</div>}

        <div style={styles.orderCardItems}>{o.items}</div>

        <div style={styles.orderCardBottomRow}>
          <span style={styles.orderCardTotal}>{Number(o.total).toLocaleString()} د.ع</span>
          <select
            value={o.status}
            onChange={(e) => updateStatus(o.id, e.target.value)}
            style={{
              ...styles.statusSelect,
              color: STATUS_CONFIG[o.status].color,
              borderColor: STATUS_CONFIG[o.status].color + '44',
              background: STATUS_CONFIG[o.status].bg,
            }}
          >
            {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>{cfg.label}</option>
            ))}
          </select>
        </div>

        <div style={styles.orderCardMeta}>
          <span>{o.date}</span>
          <span style={{ fontFamily: 'monospace' }}>{o.fahdRef}</span>
          {o.printed && <span style={styles.printedBadge}><Printer size={10} /> مطبوعة</span>}
          {o.converted && <span style={styles.convertedBadge}>محوّلة</span>}
        </div>

        <div style={styles.orderCardActions} className="alfhd-no-print">
          <button onClick={() => startEditOrder(o)} style={styles.orderActionBtn} title="تعديل">
            <Edit3 size={14} />
          </button>
          <button onClick={() => handleDelete(o)} style={{ ...styles.orderActionBtn, color: '#F45B69' }} title="حذف">
            <Trash2 size={14} />
          </button>
          <button onClick={() => handleShare(o)} style={styles.orderActionBtn} title="مشاركة تفاصيل الطلب">
            <Send size={14} />
          </button>
          {o.conversationId && (
            <button onClick={() => onViewConversation?.(o.conversationId)} style={styles.orderActionBtn} title="عرض المحادثة">
              <MessageSquare size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header alfhd-no-print">
        <div>
          <h2 style={styles.viewTitle}>الطلبات</h2>
          <p style={styles.viewSubtitle}>متابعة كاملة لطلبات صفحاتك مع طباعة وتحويل مباشر</p>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input type="file" accept="image/*" ref={ocrInputRef} onChange={handlePickOcrImage} style={{ display: 'none' }} />
          <button onClick={() => ocrInputRef.current?.click()} style={styles.secondaryBtn} disabled={ocrLoading}>
            {ocrLoading ? <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Image size={15} />}
            إضافة بالصورة
          </button>
          <button onClick={startNewOrder} style={styles.secondaryBtn}>
            <Plus size={15} />
            إضافة طلب
          </button>
          {section === 'ready' && (
            <button onClick={handlePrintReady} style={styles.printBtn}>
              <Printer size={15} />
              طباعة الآن
            </button>
          )}
        </div>
      </div>

      <div style={styles.statsRow} className="alfhd-stats-row alfhd-no-print">
        <StatCard icon={Package} label="إجمالي الطلبات" value={stats.total} color="#2F8EFF" />
        <StatCard icon={Truck} label="قيد التوصيل" value={stats.pending} color="#2F8EFF" />
        <StatCard icon={CheckCircle2} label="مستلمة" value={stats.delivered} color="#4ADE80" />
        <StatCard icon={XCircle} label="راجعة" value={stats.returned} color="#F45B69" />
      </div>

      <div style={styles.sectionTabs} className="alfhd-no-print">
        <button
          onClick={() => setSection('ready')}
          style={{ ...styles.sectionTab, ...(section === 'ready' ? styles.sectionTabActive : {}) }}
        >
          جاهزة للطباعة
          <span style={{ ...styles.convTabCount, ...(section === 'ready' ? styles.convTabCountActive : {}) }}>
            {orders.filter((o) => !o.printed && (selectedPage === 'all' || o.pageId === selectedPage)).length}
          </span>
        </button>
        <button
          onClick={() => setSection('delivery')}
          style={{ ...styles.sectionTab, ...(section === 'delivery' ? styles.sectionTabActive : {}) }}
        >
          لدى شركة التوصيل
          <span style={{ ...styles.convTabCount, ...(section === 'delivery' ? styles.convTabCountActive : {}) }}>
            {orders.filter((o) => o.printed && (selectedPage === 'all' || o.pageId === selectedPage)).length}
          </span>
        </button>
      </div>

      <div style={styles.ordersToolbar} className="alfhd-no-print">
        <div style={styles.pageSelectWrap}>
          <Facebook size={15} color="#2F8EFF" />
          <select value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)} style={styles.pageSelect}>
            <option value="all">كل الصفحات</option>
            {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown size={14} color="#6B6760" />
        </div>

        {section === 'delivery' && (
          <div style={styles.filterChips}>
            {['all', 'pending', 'delivered', 'returned'].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                style={{ ...styles.chip, ...(statusFilter === s ? styles.chipActive : {}) }}
              >
                {s === 'all' ? 'الكل' : STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        )}

        <div style={styles.searchBox}>
          <Search size={15} color="#6B6760" />
          <input
            placeholder="رقم الطلب أو اسم العميل..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.searchInput}
          />
        </div>
      </div>

      {section === 'ready' ? (
        <div
          style={styles.ordersGrid}
          className={`alfhd-orders-grid${printTarget === 'ready' ? ' alfhd-print-area' : ''}`}
        >
          {readyOrders.length === 0 ? (
            <div style={styles.emptyState}>
              <Package size={32} color="#3A372F" />
              <p>لا توجد طلبات جاهزة للطباعة حالياً</p>
            </div>
          ) : readyOrders.map(renderOrderCard)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {batches.length === 0 ? (
            <div style={styles.emptyState}>
              <Truck size={32} color="#3A372F" />
              <p>لا توجد طلبات لدى شركة التوصيل بعد</p>
            </div>
          ) : (
            batches.map((batch) => (
              <div key={batch.batchId} style={styles.batchBlock}>
                <div style={styles.batchHeader} className="alfhd-no-print">
                  <div style={styles.batchHeaderInfo}>
                    <Printer size={14} color="#2F8EFF" />
                    <span>دفعة طباعة — {batch.orders.length} طلب</span>
                    {batch.printedAt && (
                      <span style={styles.batchHeaderTime}>
                        {new Date(batch.printedAt).toLocaleString('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    )}
                  </div>
                  <button onClick={() => handleReprintBatch(batch.batchId)} style={styles.secondaryBtn}>
                    <Printer size={14} />
                    إعادة طباعة
                  </button>
                </div>
                <div
                  style={styles.ordersGrid}
                  className={`alfhd-orders-grid${printTarget === batch.batchId ? ' alfhd-print-area' : ''}`}
                >
                  {batch.orders.map(renderOrderCard)}
                </div>
              </div>
            ))
          )}
        </div>
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
                <select
                  value={editingOrder.pageId}
                  onChange={(e) => setEditingOrder({ ...editingOrder, pageId: e.target.value })}
                  style={styles.formInput}
                >
                  {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>اسم العميل</label>
                <input value={editingOrder.customer} onChange={(e) => setEditingOrder({ ...editingOrder, customer: e.target.value })} style={styles.formInput} placeholder="اسم الزبون" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>رقم الهاتف</label>
                <input value={editingOrder.phone} onChange={(e) => setEditingOrder({ ...editingOrder, phone: e.target.value })} style={styles.formInput} placeholder="07XXXXXXXXX" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>العنوان</label>
                <input value={editingOrder.address} onChange={(e) => setEditingOrder({ ...editingOrder, address: e.target.value })} style={styles.formInput} placeholder="المحافظة - المنطقة" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>المنتجات</label>
                <textarea
                  value={editingOrder.items}
                  onChange={(e) => setEditingOrder({ ...editingOrder, items: e.target.value })}
                  style={{ ...styles.formInput, minHeight: 70, resize: 'vertical' }}
                  placeholder="وصف المنتجات والكميات"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>المبلغ (د.ع)</label>
                <input type="number" value={editingOrder.total} onChange={(e) => setEditingOrder({ ...editingOrder, total: e.target.value })} style={styles.formInput} placeholder="0" />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>الحالة</label>
                <select value={editingOrder.status} onChange={(e) => setEditingOrder({ ...editingOrder, status: e.target.value })} style={styles.formInput}>
                  {Object.entries(STATUS_CONFIG).map(([key, cfg]) => <option key={key} value={key}>{cfg.label}</option>)}
                </select>
              </div>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>ربط بمحادثة (اختياري)</label>
                <select
                  value={editingOrder.conversationId || ''}
                  onChange={(e) => setEditingOrder({ ...editingOrder, conversationId: e.target.value })}
                  style={styles.formInput}
                >
                  <option value="">بدون ربط</option>
                  {conversations.map((c) => <option key={c.id} value={c.id}>{c.customer}</option>)}
                </select>
              </div>
            </div>
            <div style={styles.modalFooter}>
              <button onClick={() => setEditingOrder(null)} style={styles.modalCancelBtn}>إلغاء</button>
              <button onClick={handleSaveOrder} style={styles.modalSaveBtn} disabled={saving}>
                {saving ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div style={styles.statCard}>
      <div style={{ ...styles.statIconWrap, background: color + '14', color }}>
        <Icon size={18} />
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
function StatsView({ orders, pages, conversations }) {
  const [dailyFilter, setDailyFilter] = useState('today');

  const DAILY_FILTERS = [
    { id: 'today', label: 'اليوم' },
    { id: 'yesterday', label: 'أمس' },
    { id: 'dayBeforeYesterday', label: 'أول أمس' },
    { id: 'week', label: 'هذا الأسبوع' },
    { id: 'month', label: 'هذا الشهر' },
  ];

  function startOfDay(d) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }

  function isInDailyRange(dateStr, range) {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return false;
    const now = new Date();
    const today = startOfDay(now);
    if (range === 'today') return startOfDay(d).getTime() === today.getTime();
    if (range === 'yesterday') {
      const y = new Date(today); y.setDate(y.getDate() - 1);
      return startOfDay(d).getTime() === y.getTime();
    }
    if (range === 'dayBeforeYesterday') {
      const y2 = new Date(today); y2.setDate(y2.getDate() - 2);
      return startOfDay(d).getTime() === y2.getTime();
    }
    if (range === 'week') {
      const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 7);
      return d >= weekAgo && d <= now;
    }
    if (range === 'month') {
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }
    return true;
  }

  const dailyOrders = useMemo(
    () => orders.filter((o) => isInDailyRange(o.createdAt, dailyFilter)),
    [orders, dailyFilter]
  );

  const dailyBreakdown = useMemo(() => {
    const converted = dailyOrders.filter((o) => o.converted);
    const fromChat = dailyOrders.filter((o) => !o.converted && o.source === 'chat');
    const manual = dailyOrders.filter((o) => !o.converted && o.source !== 'chat');
    return { total: dailyOrders.length, converted: converted.length, fromChat: fromChat.length, manual: manual.length };
  }, [dailyOrders]);

  const overall = useMemo(() => {
    const delivered = orders.filter((o) => o.status === 'delivered');
    const pending = orders.filter((o) => o.status === 'pending');
    const returned = orders.filter((o) => o.status === 'returned');
    const revenue = delivered.reduce((s, o) => s + o.total, 0);
    const deliveryRate = orders.length ? Math.round((delivered.length / orders.length) * 100) : 0;
    return { total: orders.length, delivered: delivered.length, pending: pending.length, returned: returned.length, revenue, deliveryRate };
  }, [orders]);

  const perPage = useMemo(() => {
    return pages.map((p) => {
      const pOrders = orders.filter((o) => o.pageId === p.id);
      const pConvs = conversations.filter((c) => c.pageId === p.id);
      return {
        ...p,
        orderCount: pOrders.length,
        revenue: pOrders.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0),
        convCount: pConvs.length,
      };
    });
  }, [pages, orders, conversations]);

  const maxRevenue = Math.max(...perPage.map((p) => p.revenue), 1);

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header">
        <div>
          <h2 style={styles.viewTitle}>الإحصائيات</h2>
          <p style={styles.viewSubtitle}>نظرة شاملة على أداء جميع الصفحات</p>
        </div>
      </div>

      <div style={styles.dailyStatsCard}>
        <div style={styles.dailyStatsHeader}>
          <h3 style={styles.chartTitle}>إحصائية الطلبات اليومية</h3>
          <div style={styles.filterChips}>
            {DAILY_FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setDailyFilter(f.id)}
                style={{ ...styles.chip, ...(dailyFilter === f.id ? styles.chipActive : {}) }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
        <div style={styles.statsRow} className="alfhd-stats-row">
          <StatCard icon={Package} label="إجمالي الطلبات بالفترة" value={dailyBreakdown.total} color="#2F8EFF" />
          <StatCard icon={MessageSquare} label="من المحادثات" value={dailyBreakdown.fromChat} color="#5B8DEF" />
          <StatCard icon={Edit3} label="مضافة يدوياً" value={dailyBreakdown.manual} color="#4ADE80" />
          <StatCard icon={Send} label="طلبات محوّلة" value={dailyBreakdown.converted} color="#A78BFA" />
        </div>
      </div>

      <div style={styles.statsRow} className="alfhd-stats-row">
        <StatCard icon={Package} label="إجمالي الطلبات" value={overall.total} color="#2F8EFF" />
        <StatCard icon={CheckCircle2} label="نسبة التسليم" value={`${overall.deliveryRate}%`} color="#4ADE80" />
        <StatCard icon={XCircle} label="نسبة الإرجاع" value={overall.total ? `${Math.round((overall.returned / overall.total) * 100)}%` : '0%'} color="#F45B69" />
        <StatCard icon={Sparkles} label="إجمالي الإيرادات" value={`${overall.revenue.toLocaleString()} د.ع`} color="#2F8EFF" />
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
                <div
                  style={{
                    ...styles.barChartFill,
                    width: `${(p.revenue / maxRevenue) * 100}%`,
                  }}
                />
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
                { label: 'قيد التوصيل', value: overall.pending, color: '#2F8EFF' },
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
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#E8E6E1' }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: '#6B6760' }}>{p.orderCount} طلب</div>
                  </div>
                </div>
                <div style={styles.pageStatBadge}>{p.convCount} محادثة</div>
              </div>
            ))}
          </div>
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
        <circle cx="80" cy="80" r={radius} fill="none" stroke="#1C1F28" strokeWidth="18" />
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
        <text x="80" y="76" textAnchor="middle" fontSize="22" fontWeight="700" fill="#E8E6E1">{total}</text>
        <text x="80" y="94" textAnchor="middle" fontSize="11" fill="#6B6760">طلب</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {data.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 10, height: 10, borderRadius: 3, background: d.color }} />
            <span style={{ fontSize: 12, color: '#9A958C' }}>{d.label}</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#E8E6E1' }}>{d.value}</span>
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
          <div key={p.id} style={styles.pageCard}>
            <div style={styles.pageCardAvatar}>{p.avatar}</div>
            <div style={{ flex: 1 }}>
              <div style={styles.pageCardName}>{p.name}</div>
              <div style={{
                ...styles.pageCardStatus,
                color: p.connected ? '#4ADE80' : '#2F8EFF',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: p.connected ? '#4ADE80' : '#2F8EFF',
                }} />
                {p.connected ? 'متصلة فعلياً بفيسبوك' : 'بانتظار ربط Access Token'}
              </div>
            </div>
            <button onClick={() => removePage(p.id)} style={styles.iconBtnDanger}>
              <Trash2 size={15} />
            </button>
            {p.connected && (
              <button
                onClick={() => subscribePage(p.id)}
                style={styles.subscribeBtn}
                disabled={subscribingId === p.id}
              >
                {subscribingId === p.id ? '...' : 'تفعيل استقبال الرسائل'}
              </button>
            )}
          </div>
        ))}

        {pages.length === 0 && (
          <div style={styles.emptyStateLg}>
            <Facebook size={40} color="#3A372F" />
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

function UsersView({ users, setUsers }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [form, setForm] = useState({ name: '', code: '', role: 'limited', permissions: [] });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const openAdd = () => {
    setForm({ name: '', code: '', role: 'limited', permissions: [] });
    setEditingUser(null);
    setFormError('');
    setShowAdd(true);
  };

  const openEdit = (user) => {
    setForm({ name: user.name, code: user.code, role: user.role, permissions: user.permissions });
    setEditingUser(user);
    setFormError('');
    setShowAdd(true);
  };

  const togglePermission = (permId) => {
    setForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permId)
        ? prev.permissions.filter((p) => p !== permId)
        : [...prev.permissions, permId],
    }));
  };

  const saveUser = async () => {
    if (!form.name.trim() || !form.code.trim() || saving) return;

    // تحقق أن الرمز فريد (غير مستخدم من مستخدم آخر)
    const codeTaken = users.some((u) => u.code === form.code.trim() && u.id !== editingUser?.id);
    if (codeTaken) {
      setFormError('هذا الرمز مستخدم من قبل مستخدم آخر');
      return;
    }

    setSaving(true);
    setFormError('');

    try {
      if (editingUser) {
        const [updated] = await sbUpdate('alfhd_users', editingUser.id, {
          name: form.name.trim(),
          code: form.code.trim(),
          role: form.role,
          permissions: form.permissions,
        });
        setUsers((prev) => prev.map((u) => u.id === editingUser.id ? mapUserFromDb(updated) : u));
      } else {
        const [created] = await sbInsert('alfhd_users', {
          name: form.name.trim(),
          code: form.code.trim(),
          role: form.role,
          permissions: form.permissions,
          active: true,
        });
        setUsers((prev) => [...prev, mapUserFromDb(created)]);
      }
      setShowAdd(false);
    } catch (e) {
      console.error('Failed to save user:', e);
      setFormError('خطأ: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const newActive = !target.active;
    setUsers((prev) => prev.map((u) => u.id === id ? { ...u, active: newActive } : u));
    try {
      await sbUpdate('alfhd_users', id, { active: newActive });
    } catch (e) {
      console.error('Failed to toggle user active state:', e);
    }
  };

  const deleteUser = async (id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    try {
      await sbDelete('alfhd_users', id);
    } catch (e) {
      console.error('Failed to delete user:', e);
    }
  };

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header">
        <div>
          <h2 style={styles.viewTitle}>إدارة المستخدمين</h2>
          <p style={styles.viewSubtitle}>تحكم كامل بصلاحيات الوصول لفريقك</p>
        </div>
        <button onClick={openAdd} style={styles.addBtn}>
          <UserPlus size={16} />
          إضافة مستخدم
        </button>
      </div>

      <div style={styles.usersGrid} className="alfhd-users-grid">
        {users.map((u) => (
          <div key={u.id} style={{ ...styles.userCard, opacity: u.active ? 1 : 0.5 }}>
            <div style={styles.userCardTop}>
              <div style={{
                ...styles.userCardAvatar,
                background: u.role === 'admin' ? 'linear-gradient(135deg,#6FB6FF,#1A5FB4)' : '#1C1F28',
                color: u.role === 'admin' ? '#0B0D12' : '#2F8EFF',
              }}>
                {u.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.userCardName}>{u.name}</div>
                <div style={styles.userCardRole}>
                  {u.role === 'admin' ? (
                    <><ShieldCheck size={12} color="#4ADE80" /> صلاحية كاملة</>
                  ) : (
                    <><Shield size={12} color="#2F8EFF" /> صلاحية محددة ({u.permissions.length})</>
                  )}
                </div>
              </div>
              <div style={{
                ...styles.activeDot,
                background: u.active ? '#4ADE80' : '#6B6760',
              }} />
            </div>

            {u.role !== 'admin' && (
              <div style={styles.userPermsList}>
                {u.permissions.length === 0 ? (
                  <span style={{ fontSize: 11, color: '#6B6760' }}>لا توجد صلاحيات مفعّلة</span>
                ) : (
                  u.permissions.map((pId) => {
                    const perm = PERMISSIONS_LIST.find((p) => p.id === pId);
                    return perm ? (
                      <span key={pId} style={styles.permTag}>{perm.label}</span>
                    ) : null;
                  })
                )}
              </div>
            )}

            <div style={styles.userCardActions}>
              <button onClick={() => openEdit(u)} style={styles.userActionBtn}>
                <Edit3 size={13} /> تعديل
              </button>
              <button onClick={() => toggleActive(u.id)} style={styles.userActionBtn}>
                {u.active ? <EyeOff size={13} /> : <Eye size={13} />}
                {u.active ? 'تعطيل' : 'تفعيل'}
              </button>
              {u.role !== 'admin' && (
                <button onClick={() => deleteUser(u.id)} style={{ ...styles.userActionBtn, color: '#F45B69' }}>
                  <Trash2 size={13} /> حذف
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAdd && (
        <div style={styles.modalOverlay} onClick={() => setShowAdd(false)}>
          <div style={styles.modal} className="alfhd-modal" onClick={(e) => e.stopPropagation()}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>{editingUser ? 'تعديل المستخدم' : 'إضافة مستخدم جديد'}</h3>
              <button onClick={() => setShowAdd(false)} style={styles.modalClose}><X size={18} /></button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.formGroup}>
                <label style={styles.formLabel}>الاسم</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  style={styles.formInput}
                  placeholder="اسم الموظف"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>رمز الدخول الخاص به</label>
                <input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  style={styles.formInput}
                  placeholder="رمز رقمي"
                />
              </div>

              <div style={styles.formGroup}>
                <label style={styles.formLabel}>نوع الصلاحية</label>
                <div style={styles.roleToggle}>
                  <button
                    onClick={() => setForm({ ...form, role: 'admin' })}
                    style={{ ...styles.roleBtn, ...(form.role === 'admin' ? styles.roleBtnActive : {}) }}
                  >
                    <ShieldCheck size={14} /> كاملة
                  </button>
                  <button
                    onClick={() => setForm({ ...form, role: 'limited' })}
                    style={{ ...styles.roleBtn, ...(form.role === 'limited' ? styles.roleBtnActive : {}) }}
                  >
                    <Shield size={14} /> محددة
                  </button>
                </div>
              </div>

              {form.role === 'limited' && (
                <div style={styles.formGroup}>
                  <label style={styles.formLabel}>الصلاحيات المحددة</label>
                  <div style={styles.permsGrid}>
                    {PERMISSIONS_LIST.map((perm) => (
                      <label key={perm.id} style={styles.permCheckRow}>
                        <input
                          type="checkbox"
                          checked={form.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          style={styles.checkbox}
                        />
                        <span>{perm.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formError && (
                <p style={{ color: '#F45B69', fontSize: 12, margin: 0 }}>{formError}</p>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button onClick={() => setShowAdd(false)} style={styles.modalCancelBtn}>إلغاء</button>
              <button onClick={saveUser} style={styles.modalSaveBtn} disabled={saving}>
                {saving ? 'جارٍ الحفظ...' : 'حفظ'}
              </button>
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

  const goToConversation = useCallback((convId) => {
    setPendingOpenConvId(convId);
    setActiveView('conversations');
  }, []);

  const goToNewOrderFromConversation = useCallback((conv) => {
    setPendingNewOrderFromConv(conv);
    setActiveView('orders');
  }, []);


  const [pages, setPages] = useState(SEED_PAGES);
  const [conversations, setConversations] = useState(SEED_CONVERSATIONS);
  const [orders, setOrders] = useState(SEED_ORDERS);
  const [users, setUsers] = useState(SEED_USERS);
  const [storageReady, setStorageReady] = useState(false);

  // ── حالة تسجيل الدخول ──
  const [authedUser, setAuthedUser] = useState(null);

  // جلب المحادثات الحقيقية من Supabase (يُستخدم عند التحميل وعند كل تحديث دوري)
  const refreshConversations = useCallback(async () => {
    try {
      const dbConversations = await sbSelect(
        'alfhd_conversations',
        '&order=last_message_time.desc'
      );
      if (dbConversations) {
        setConversations(dbConversations.map(mapConversationFromDb));
      }
    } catch (e) {
      console.error('Supabase conversations load error:', e);
    }
  }, []);

  // تحميل البيانات الحقيقية من Supabase (لا يمنع عرض الواجهة أبداً)
  useEffect(() => {
    (async () => {
      try {
        const [dbPages, dbOrders, dbUsers] = await Promise.all([
          sbSelect('alfhd_pages', '&order=created_at.asc'),
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

  // تحديث المحادثات تلقائياً كل 8 ثواني عشان الرسائل الجديدة تظهر بدون تحديث الصفحة يدوياً
  useEffect(() => {
    const interval = setInterval(refreshConversations, 8000);
    return () => clearInterval(interval);
  }, [refreshConversations]);

  // سحب فعّال للرسائل الجديدة من فيسبوك مباشرة كل 7 ثواني طالما التطبيق مفتوح
  // (إضافة لمهمة الـ Cron الخارجية، لتقليل وقت وصول الرسائل بشكل كبير)
  const pollFacebookNow = useCallback(async () => {
    try {
      await fetch(FB_POLL_FUNCTION_URL, { method: 'GET' });
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

  // استرجاع الجلسة المحفوظة محلياً (الجلسة فقط، مو البيانات نفسها)
  useEffect(() => {
    if (!storageReady) return;
    try {
      const savedSession = JSON.parse(sessionStorage.getItem('alfhd_session') || 'null');
      if (savedSession?.userId) {
        const found = users.find((u) => u.id === savedSession.userId && u.active);
        if (found) setAuthedUser(found);
      }
    } catch (e) { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageReady]);

  const handleLogin = (user) => {
    setAuthedUser(user);
    try {
      sessionStorage.setItem('alfhd_session', JSON.stringify({ userId: user.id }));
    } catch (e) { /* ignore */ }
  };

  const handleLogout = () => {
    setAuthedUser(null);
    try {
      sessionStorage.removeItem('alfhd_session');
    } catch (e) { /* ignore */ }
  };

  const hasPermission = (permId) => {
    if (!authedUser) return false;
    if (authedUser.role === 'admin') return true;
    return authedUser.permissions?.includes(permId);
  };

  // ── شاشة الدخول ──
  if (!authedUser) {
    return (
      <>
        <GlobalStyles />
        <LoginScreen users={users} onLogin={handleLogin} />
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
            />
          )}
          {activeView === 'orders' && (
            <OrdersView
              orders={orders}
              pages={pages}
              setOrders={setOrders}
              conversations={conversations}
              setConversations={setConversations}
              onViewConversation={goToConversation}
              pendingNewOrderFromConv={pendingNewOrderFromConv}
              clearPendingNewOrderFromConv={() => setPendingNewOrderFromConv(null)}
            />
          )}
          {activeView === 'stats' && (
            <StatsView orders={orders} pages={pages} conversations={conversations} />
          )}
          {activeView === 'users' && authedUser.role === 'admin' && (
            <UsersView users={users} setUsers={setUsers} />
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
      body { margin: 0; }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: #2A2D38; border-radius: 10px; }
      ::-webkit-scrollbar-thumb:hover { background: #3A3D48; }
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
      input:focus, select:focus, textarea:focus { outline: none; }
      button {
        font-family: 'Cairo', sans-serif; cursor: pointer;
        transition: transform 0.12s ease, opacity 0.12s ease, background 0.15s ease, border-color 0.15s ease;
      }
      button:active { transform: scale(0.95); }
      button:disabled { opacity: 0.55; cursor: default; transform: none; }
      .alfhd-conv-item, .alfhd-order-card {
        transition: border-color 0.15s ease, transform 0.12s ease, background 0.15s ease;
      }
      .alfhd-conv-item:active { transform: scale(0.985); background: rgba(255,255,255,0.02); }
      .alfhd-chat-scroll {
        -webkit-overflow-scrolling: touch;
        scroll-behavior: smooth;
      }
      .alfhd-chat-bubble-row { animation: msgPop 0.22s cubic-bezier(0.22, 1, 0.36, 1); }
      .alfhd-bottom-nav-item, .alfhd-nav-item {
        transition: color 0.18s ease, background 0.18s ease;
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
          max-height: 360px !important;
        }
        .alfhd-conv-list-hidden-mobile {
          display: none !important;
        }
        .alfhd-conv-detail-active-mobile {
          position: fixed !important;
          top: 58px !important;
          right: 0 !important;
          left: 0 !important;
          bottom: 0 !important;
          z-index: 90 !important;
          border-radius: 0 !important;
          border: none !important;
          padding: 12px 14px !important;
          animation: chatSlideIn 0.22s cubic-bezier(0.22, 1, 0.36, 1) !important;
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

      /* ── طباعة الطلبات ── */
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
    background: '#0B0D12', position: 'relative', overflow: 'hidden',
    direction: 'rtl', padding: 20,
  },
  loginBgPattern: {
    position: 'absolute', inset: 0,
    backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(47,142,255,0.06) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(47,142,255,0.04) 0%, transparent 40%)',
    pointerEvents: 'none',
  },
  loginCard: {
    position: 'relative', zIndex: 1,
    background: 'linear-gradient(180deg, #161A24 0%, #11141C 100%)',
    border: '1px solid rgba(47,142,255,0.15)',
    borderRadius: 22, padding: '50px 38px 42px', width: '100%', maxWidth: 400,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 24px 70px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.03)',
    overflow: 'hidden',
  },
  loginCardAccent: {
    position: 'absolute', top: 0, right: 0, left: 0, height: 3,
    background: 'linear-gradient(90deg, transparent, #6FB6FF, transparent)',
  },
  loginLogoArea: { position: 'relative', marginBottom: 4 },
  logoGlow: {
    position: 'absolute', inset: -20, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(47,142,255,0.25) 0%, transparent 70%)',
    filter: 'blur(8px)',
  },
  loginTitle: {
    fontSize: 32, fontWeight: 800, color: '#E8E6E1', margin: '18px 0 4px',
    letterSpacing: '0.02em', fontFamily: "'Cairo', sans-serif",
  },
  loginSubtitle: { fontSize: 13, color: '#6B6760', letterSpacing: '0.03em', margin: 0 },
  inputLabel: { display: 'block', fontSize: 12, color: '#9A958C', marginBottom: 14, fontWeight: 600, textAlign: 'center' },
  pinBoxesWrap: { position: 'relative', display: 'flex', gap: 9, justifyContent: 'center', cursor: 'text' },
  pinBox: {
    width: 42, height: 52, borderRadius: 12, background: '#0B0D12',
    border: '1.5px solid rgba(47,142,255,0.18)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontSize: 22, color: '#6FB6FF', fontWeight: 700,
    transition: 'border-color 0.15s, transform 0.12s, background 0.15s',
  },
  pinBoxActive: { borderColor: '#2F8EFF', transform: 'translateY(-2px)' },
  pinBoxFilled: { borderColor: 'rgba(47,142,255,0.55)', background: 'rgba(47,142,255,0.07)' },
  pinBoxError: { borderColor: '#F45B69' },
  pinHiddenInput: {
    position: 'absolute', inset: 0, opacity: 0, width: '100%', height: '100%',
    border: 'none', padding: 0, margin: 0, cursor: 'text',
  },
  errorText: { color: '#F45B69', fontSize: 12, marginTop: 14, textAlign: 'center' },
  checkbox: { width: 16, height: 16, accentColor: '#2F8EFF', cursor: 'pointer' },
  loginFooter: { marginTop: 28, fontSize: 11, color: '#3A372F', position: 'relative', zIndex: 1 },

  // ── App layout ──
  appWrap: {
    display: 'flex', minHeight: '100vh', background: '#0B0D12',
    direction: 'rtl', color: '#E8E6E1', fontFamily: "'Cairo', sans-serif",
  },
  sidebar: {
    width: 260, background: '#0E1016', borderLeft: '1px solid rgba(255,255,255,0.05)',
    display: 'flex', flexDirection: 'column', padding: '24px 16px', flexShrink: 0,
  },
  sidebarHeader: { display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 16 },
  sidebarBrand: { fontSize: 17, fontWeight: 800, color: '#E8E6E1' },
  sidebarBrandSub: { fontSize: 10, color: '#6B6760' },
  sidebarNav: { display: 'flex', flexDirection: 'column', gap: 3, flex: 1 },
  navItem: {
    display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px',
    borderRadius: 10, border: 'none', background: 'transparent', color: '#9A958C',
    fontSize: 14, fontWeight: 500, textAlign: 'right', position: 'relative',
    transition: 'all 0.15s',
  },
  navItemActive: {
    background: 'rgba(47,142,255,0.1)', color: '#6FB6FF', fontWeight: 700,
  },
  navActiveDot: { position: 'absolute', left: 10, width: 5, height: 5, borderRadius: '50%', background: '#2F8EFF' },
  sidebarFooter: { paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' },
  userBadge: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px', marginBottom: 8 },
  userAvatar: {
    width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6FB6FF,#1A5FB4)',
    color: '#0B0D12', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontWeight: 700, fontSize: 14, flexShrink: 0,
  },
  userName: { fontSize: 13, fontWeight: 700, color: '#E8E6E1', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  userRole: { fontSize: 11, color: '#6B6760' },
  logoutBtn: {
    display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px',
    background: 'transparent', border: '1px solid rgba(244,91,105,0.2)', borderRadius: 10,
    color: '#F45B69', fontSize: 13, fontWeight: 600,
  },

  // ── Mobile header + bottom nav ──
  mobileHeader: {
    position: 'fixed', top: 0, right: 0, left: 0, height: 58, zIndex: 100,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#0E1016', borderBottom: '1px solid rgba(255,255,255,0.06)',
    padding: '0 16px', direction: 'rtl',
  },
  mobileHeaderBrand: { display: 'flex', alignItems: 'center', gap: 8 },
  mobileHeaderTitle: { fontSize: 16, fontWeight: 800, color: '#E8E6E1' },
  mobileLogoutBtn: {
    width: 34, height: 34, borderRadius: 9, background: 'rgba(244,91,105,0.1)',
    border: 'none', color: '#F45B69', display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  bottomNav: {
    position: 'fixed', bottom: 0, right: 0, left: 0, zIndex: 100,
    display: 'flex', justifyContent: 'space-around', alignItems: 'center',
    background: '#0E1016', borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '8px 4px', direction: 'rtl',
  },
  bottomNavItem: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
    background: 'transparent', border: 'none', color: '#6B6760', padding: '6px 8px',
    flex: 1, minWidth: 0,
  },
  bottomNavItemActive: { color: '#6FB6FF' },
  bottomNavLabel: { fontSize: 10, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' },

  mainArea: { flex: 1, overflow: 'auto', padding: '32px 36px' },
  viewWrap: { animation: 'fadeUp 0.3s ease', maxWidth: 1400 },
  viewHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, flexWrap: 'wrap', gap: 14 },
  viewTitle: { fontSize: 24, fontWeight: 800, color: '#E8E6E1', margin: 0 },
  viewSubtitle: { fontSize: 13, color: '#6B6760', margin: '4px 0 0' },

  pageSelectWrap: {
    display: 'flex', alignItems: 'center', gap: 8, background: '#14171F',
    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '8px 12px',
  },
  pageSelect: {
    background: 'transparent', border: 'none', color: '#E8E6E1', fontSize: 13,
    fontWeight: 600, appearance: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif",
  },

  // ── Conversations ──
  convTabs: { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  convTab: {
    display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px',
    background: '#14171F', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10,
    color: '#9A958C', fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
  },
  convTabActive: {
    background: 'rgba(47,142,255,0.1)', borderColor: 'rgba(47,142,255,0.3)', color: '#6FB6FF',
  },
  convTabCount: {
    background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700,
  },
  convTabCountActive: { background: 'rgba(47,142,255,0.25)', color: '#6FB6FF' },

  convLayout: { display: 'grid', gridTemplateColumns: '360px 1fr', gap: 20, minHeight: 500 },
  convList: {
    background: '#0E1016', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16,
    padding: 14, display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 600, overflow: 'auto',
  },
  searchBox: {
    display: 'flex', alignItems: 'center', gap: 8, background: '#14171F',
    border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '9px 12px', marginBottom: 8,
  },
  searchInput: {
    background: 'transparent', border: 'none', color: '#E8E6E1', fontSize: 13,
    width: '100%', fontFamily: "'Cairo', sans-serif",
  },
  convItem: {
    display: 'flex', gap: 10, padding: 12, background: 'transparent', border: 'none',
    borderRadius: 12, textAlign: 'right', alignItems: 'flex-start', transition: 'background 0.15s',
  },
  convItemActive: { background: 'rgba(47,142,255,0.08)' },
  convAvatar: {
    width: 40, height: 40, borderRadius: 12, background: '#1C1F28', color: '#2F8EFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0,
  },
  convItemTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 3 },
  convCustomer: { fontSize: 13, fontWeight: 700, color: '#E8E6E1' },
  convTime: { fontSize: 11, color: '#6B6760' },
  convItemBottom: { display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' },
  convLastMsg: { fontSize: 12, color: '#6B6760', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  unreadBadge: {
    background: '#2F8EFF', color: '#0B0D12', borderRadius: 20, fontSize: 10, fontWeight: 800,
    padding: '1px 6px', minWidth: 16, textAlign: 'center', flexShrink: 0,
  },
  convPageTag: { fontSize: 10, color: '#3A372F', marginTop: 4 },

  convDetail: {
    background: '#0E1016', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16,
    padding: 24, display: 'flex', flexDirection: 'column', minHeight: 560,
  },
  detailHeader: { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 14 },
  convBackBtn: {
    display: 'none', width: 34, height: 34, borderRadius: 10, background: '#14171F',
    border: '1px solid rgba(255,255,255,0.06)', color: '#C8C4BB', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  convAvatarLg: {
    width: 48, height: 48, borderRadius: 14, background: '#1C1F28', color: '#2F8EFF',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18, flexShrink: 0,
  },
  detailName: { fontSize: 16, fontWeight: 700, color: '#E8E6E1' },
  detailPage: { fontSize: 12, color: '#6B6760' },
  pinOrderBtn: {
    display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px',
    background: 'rgba(47,142,255,0.1)', border: '1px solid rgba(47,142,255,0.3)',
    borderRadius: 9, color: '#2F8EFF', fontSize: 12, fontWeight: 700, flexShrink: 0,
  },
  chatScroll: {
    flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column',
    padding: '6px 2px', minHeight: 240, maxHeight: 480,
  },
  msgBubbleIn: {
    background: '#14171F', borderRadius: '16px 4px 16px 16px', padding: '10px 14px',
    fontSize: 13, color: '#E8E6E1', maxWidth: '72%', lineHeight: 1.6,
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  msgBubbleOut: {
    background: 'rgba(47,142,255,0.16)', border: '1px solid rgba(47,142,255,0.22)',
    borderRadius: '4px 16px 16px 16px', padding: '10px 14px',
    fontSize: 13, color: '#F3E6C8', maxWidth: '72%', lineHeight: 1.6,
    display: 'flex', flexDirection: 'column', gap: 4,
  },
  msgImage: { width: '100%', maxWidth: 220, borderRadius: 10, display: 'block' },
  msgAudio: { width: 220, maxWidth: '100%', height: 36 },
  msgTime: { fontSize: 10, color: '#6B6760', alignSelf: 'flex-end' },
  composerBar: {
    display: 'flex', alignItems: 'center', gap: 8, marginTop: 14,
    background: '#14171F', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 14, padding: 8,
  },
  composerIconBtn: {
    width: 36, height: 36, borderRadius: 10, background: 'transparent',
    border: 'none', color: '#9A958C', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0,
  },
  composerIconBtnActive: { background: 'rgba(244,91,105,0.15)', color: '#F45B69' },
  composerInput: {
    flex: 1, background: 'transparent', border: 'none', color: '#E8E6E1',
    fontSize: 13, padding: '6px 4px', fontFamily: "'Cairo', sans-serif",
  },
  composerSendBtn: {
    width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #6FB6FF, #2F8EFF)',
    border: 'none', color: '#ffffff', display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, boxShadow: '0 2px 10px rgba(47,142,255,0.35)',
  },
  linkedOrderCard: {
    background: 'rgba(47,142,255,0.06)', border: '1px solid rgba(47,142,255,0.2)',
    borderRadius: 14, padding: 16, marginBottom: 14,
  },
  linkedOrderHeader: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#2F8EFF', marginBottom: 12 },
  linkedOrderBody: { display: 'flex', flexDirection: 'column', gap: 9 },
  linkedOrderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  linkedOrderLabel: { fontSize: 12, color: '#6B6760' },
  linkedOrderValue: { fontSize: 13, color: '#E8E6E1', fontWeight: 600 },

  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '50px 20px', color: '#6B6760', fontSize: 13 },
  emptyStateLg: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, flex: 1, color: '#6B6760', fontSize: 14 },

  // ── Orders ──
  printBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px',
    background: '#14171F', border: '1px solid rgba(47,142,255,0.25)', borderRadius: 10,
    color: '#2F8EFF', fontSize: 13, fontWeight: 700,
  },
  secondaryBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px',
    background: '#14171F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10,
    color: '#C8C4BB', fontSize: 13, fontWeight: 700,
  },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 },
  statCard: {
    display: 'flex', alignItems: 'center', gap: 12, background: '#0E1016',
    border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '16px 18px',
  },
  statIconWrap: { width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontSize: 20, fontWeight: 800, color: '#E8E6E1', lineHeight: 1.2 },
  statLabel: { fontSize: 11, color: '#6B6760', marginTop: 2 },

  sectionTabs: { display: 'flex', gap: 8, marginBottom: 18 },
  sectionTab: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px',
    background: '#0E1016', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 11,
    color: '#9A958C', fontSize: 13, fontWeight: 700,
  },
  sectionTabActive: { background: 'rgba(47,142,255,0.1)', borderColor: 'rgba(47,142,255,0.3)', color: '#6FB6FF' },
  ordersToolbar: { display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' },
  filterChips: { display: 'flex', gap: 6 },
  chip: {
    padding: '8px 14px', background: '#14171F', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 9, color: '#9A958C', fontSize: 12, fontWeight: 600,
  },
  chipActive: { background: 'rgba(47,142,255,0.12)', borderColor: 'rgba(47,142,255,0.3)', color: '#6FB6FF' },

  ordersGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16,
  },
  orderCard: {
    background: '#0E1016', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16,
    padding: 16, display: 'flex', flexDirection: 'column', gap: 8,
    transition: 'border-color 0.15s, transform 0.15s',
  },
  orderCardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 },
  orderCardPageTag: {
    fontSize: 11, fontWeight: 700, color: '#2F8EFF', background: 'rgba(47,142,255,0.08)',
    border: '1px solid rgba(47,142,255,0.18)', borderRadius: 20, padding: '3px 10px',
  },
  orderCardNo: { fontSize: 12, fontWeight: 700, color: '#6B6760', fontFamily: 'monospace' },
  orderCardCustomer: { fontSize: 15, fontWeight: 700, color: '#E8E6E1' },
  orderCardSub: { fontSize: 12, color: '#9A958C' },
  orderCardItems: {
    fontSize: 12, color: '#C8C4BB', background: '#14171F', borderRadius: 10,
    padding: '8px 10px', marginTop: 4, lineHeight: 1.5,
  },
  orderCardBottomRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  orderCardTotal: { fontSize: 15, fontWeight: 800, color: '#2F8EFF' },
  orderCardMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 10, color: '#3A372F', marginTop: 2, flexWrap: 'wrap', gap: 6 },
  convertedBadge: {
    background: 'rgba(91,141,239,0.14)', color: '#5B8DEF', border: '1px solid rgba(91,141,239,0.3)',
    borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700,
  },
  printedBadge: {
    display: 'inline-flex', alignItems: 'center', gap: 3,
    background: 'rgba(74,222,128,0.12)', color: '#4ADE80', border: '1px solid rgba(74,222,128,0.3)',
    borderRadius: 20, padding: '1px 8px', fontSize: 10, fontWeight: 700,
  },
  batchBlock: {
    background: '#0E1016', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 18,
  },
  batchHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10,
  },
  batchHeaderInfo: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#E8E6E1' },
  batchHeaderTime: { fontSize: 11, color: '#6B6760', fontWeight: 500 },
  orderCardActions: {
    display: 'flex', gap: 6, marginTop: 8, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.04)',
  },
  orderActionBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: 32, borderRadius: 9, background: '#14171F', border: '1px solid rgba(255,255,255,0.06)',
    color: '#9A958C',
  },
  statusSelect: {
    border: '1px solid', borderRadius: 8, padding: '6px 10px', fontSize: 12,
    fontWeight: 700, appearance: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif",
  },

  // ── Stats ──
  chartCard: {
    background: '#0E1016', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16,
    padding: 24, marginBottom: 20,
  },
  dailyStatsCard: {
    background: 'linear-gradient(160deg, rgba(47,142,255,0.07), rgba(14,16,22,0.4))',
    border: '1px solid rgba(47,142,255,0.18)', borderRadius: 16, padding: 22, marginBottom: 24,
  },
  dailyStatsHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, flexWrap: 'wrap', gap: 10,
  },
  chartTitle: { fontSize: 15, fontWeight: 700, color: '#E8E6E1', margin: '0 0 18px' },
  barChartArea: { display: 'flex', flexDirection: 'column', gap: 16 },
  barChartRow: { display: 'grid', gridTemplateColumns: '180px 1fr 120px', gap: 14, alignItems: 'center' },
  barChartLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#C8C4BB', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  barChartTrack: { height: 10, background: '#14171F', borderRadius: 6, overflow: 'hidden' },
  barChartFill: { height: '100%', background: 'linear-gradient(90deg,#1A5FB4,#6FB6FF)', borderRadius: 6, transition: 'width 0.5s ease' },
  barChartValue: { fontSize: 12, fontWeight: 700, color: '#2F8EFF', textAlign: 'left' },

  statsGrid2: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 },
  donutWrap: { display: 'flex', justifyContent: 'center', padding: '10px 0' },
  pageStatRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  pageStatInfo: { display: 'flex', alignItems: 'center', gap: 10 },
  pageStatBadge: {
    background: '#14171F', padding: '5px 12px', borderRadius: 20, fontSize: 11,
    fontWeight: 700, color: '#9A958C',
  },

  // ── Pages ──
  addBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px',
    background: 'linear-gradient(135deg,#6FB6FF,#1A5FB4)', border: 'none', borderRadius: 10,
    color: '#ffffff', fontSize: 13, fontWeight: 700, boxShadow: '0 2px 10px rgba(47,142,255,0.3)',
  },
  confirmBtn: {
    background: '#2F8EFF', border: 'none', borderRadius: 8, padding: '0 18px',
    color: '#ffffff', fontWeight: 700, fontSize: 13,
  },
  fbErrorBox: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
    background: 'rgba(244,91,105,0.08)', border: '1px solid rgba(244,91,105,0.25)',
    borderRadius: 12, padding: '12px 16px', color: '#F45B69', fontSize: 13, lineHeight: 1.6,
  },
  fbExchangingBox: {
    marginBottom: 16, background: 'rgba(47,142,255,0.08)', border: '1px solid rgba(47,142,255,0.2)',
    borderRadius: 12, padding: '12px 16px', color: '#2F8EFF', fontSize: 13,
  },
  fbCandidatesWrap: {
    marginBottom: 20, background: '#0E1016', border: '1px solid rgba(47,142,255,0.2)',
    borderRadius: 14, padding: 16,
  },
  fbCandidatesTitle: { fontSize: 13, fontWeight: 700, color: '#E8E6E1', marginBottom: 12 },
  fbCandidateRow: {
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  fbCandidateAvatarImg: { width: 38, height: 38, borderRadius: 10, objectFit: 'cover' },
  fbCandidateId: { fontSize: 11, color: '#6B6760', marginTop: 2 },
  pagesGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 },
  pageCard: {
    display: 'flex', alignItems: 'center', gap: 12, background: '#0E1016',
    border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: 16,
    flexWrap: 'wrap',
  },
  subscribeBtn: {
    width: '100%', marginTop: 4, background: 'rgba(74,222,128,0.1)',
    border: '1px solid rgba(74,222,128,0.25)', borderRadius: 8, padding: '8px 0',
    color: '#4ADE80', fontSize: 12, fontWeight: 700,
  },
  pageCardAvatar: {
    width: 44, height: 44, borderRadius: 12, background: '#14171F', display: 'flex',
    alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0,
  },
  pageCardName: { fontSize: 14, fontWeight: 700, color: '#E8E6E1' },
  pageCardStatus: { display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, marginTop: 4, fontWeight: 600 },
  iconBtnDanger: {
    width: 32, height: 32, borderRadius: 9, background: 'rgba(244,91,105,0.1)',
    border: 'none', color: '#F45B69', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },

  // ── Users ──
  usersGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 },
  userCard: {
    background: '#0E1016', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, padding: 18,
  },
  userCardTop: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  userCardAvatar: {
    width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center',
    justifyContent: 'center', fontWeight: 800, fontSize: 16, flexShrink: 0,
  },
  userCardName: { fontSize: 14, fontWeight: 700, color: '#E8E6E1' },
  userCardRole: { display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#9A958C', marginTop: 3 },
  activeDot: { width: 9, height: 9, borderRadius: '50%', flexShrink: 0 },
  userPermsList: { display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid rgba(255,255,255,0.05)' },
  permTag: {
    background: 'rgba(47,142,255,0.1)', color: '#2F8EFF', fontSize: 10, fontWeight: 600,
    padding: '4px 9px', borderRadius: 7,
  },
  userCardActions: { display: 'flex', gap: 8 },
  userActionBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
    padding: '8px', background: '#14171F', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 8, color: '#9A958C', fontSize: 11, fontWeight: 600,
  },

  // ── Modal ──
  modalOverlay: {
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20,
  },
  modal: {
    background: '#13161F', border: '1px solid rgba(47,142,255,0.15)', borderRadius: 18,
    width: '100%', maxWidth: 440, maxHeight: '85vh', overflow: 'auto', direction: 'rtl',
  },
  modalHeader: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '20px 22px', borderBottom: '1px solid rgba(255,255,255,0.05)',
  },
  modalTitle: { fontSize: 16, fontWeight: 700, color: '#E8E6E1', margin: 0 },
  modalClose: { background: 'transparent', border: 'none', color: '#6B6760', display: 'flex' },
  modalBody: { padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: 7 },
  formLabel: { fontSize: 12, fontWeight: 600, color: '#9A958C' },
  formInput: {
    background: '#0B0D12', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9,
    padding: '11px 14px', color: '#E8E6E1', fontSize: 13, fontFamily: "'Cairo', sans-serif",
  },
  roleToggle: { display: 'flex', gap: 8 },
  roleBtn: {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    padding: '10px', background: '#0B0D12', border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: 9, color: '#9A958C', fontSize: 12, fontWeight: 600,
  },
  roleBtnActive: { background: 'rgba(47,142,255,0.12)', borderColor: 'rgba(47,142,255,0.3)', color: '#6FB6FF' },
  permsGrid: { display: 'flex', flexDirection: 'column', gap: 4 },
  permCheckRow: { display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#C8C4BB', padding: '6px 0', cursor: 'pointer' },
  modalFooter: { display: 'flex', gap: 10, padding: '18px 22px', borderTop: '1px solid rgba(255,255,255,0.05)' },
  modalCancelBtn: {
    flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 9, color: '#9A958C', fontSize: 13, fontWeight: 600,
  },
  modalSaveBtn: {
    flex: 1, padding: '11px', background: 'linear-gradient(135deg,#6FB6FF,#1A5FB4)',
    border: 'none', borderRadius: 9, color: '#ffffff', fontSize: 13, fontWeight: 700,
    boxShadow: '0 2px 10px rgba(47,142,255,0.3)',
  },
};
