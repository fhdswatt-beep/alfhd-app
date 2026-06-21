import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  MessageSquare, Package, Users, Settings, LogOut, Search,
  Plus, Filter, BarChart3, CheckCircle2, Clock, XCircle,
  Truck, Printer, ChevronDown, X, Shield, ShieldCheck, ShieldOff,
  Eye, EyeOff, Trash2, Edit3, UserPlus, Bell, Facebook,
  ArrowUpRight, ArrowDownRight, Sparkles, Bot, UserCheck,
  Pin, MoreVertical, Phone, MapPin, Calendar, RefreshCw
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
    lastMsg: row.last_message || '',
    time: row.last_message_time
      ? new Date(row.last_message_time).toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
      : '',
    unread: row.unread_count || 0,
    tab: row.tab || 'normal',
    orderId: row.order_id,
  };
}

// ──────────────────────────────────────────────
// ثوابت التصميم
// ──────────────────────────────────────────────
const STATUS_CONFIG = {
  pending:   { label: 'قيد التوصيل', color: '#D4A655', bg: 'rgba(212,166,85,0.12)', icon: Truck },
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
          <stop offset="0%" stopColor="#E8C277" />
          <stop offset="100%" stopColor="#B8843A" />
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
        <div style={styles.loginLogoArea}>
          <div style={styles.logoGlow} />
          <FahdLogo size={72} />
        </div>
        <h1 style={styles.loginTitle}>AlFhd</h1>
        <p style={styles.loginSubtitle}>إدارة طلبات</p>

        <div style={{ width: '100%', marginTop: 36 }}>
          <div style={styles.inputGroup}>
            <label style={styles.inputLabel}>أدخل الرمز المكوّن من 6 أرقام</label>
            <input
              type="password"
              inputMode="numeric"
              value={code}
              onChange={handleChange}
              placeholder="••••••"
              style={{
                ...styles.codeInput,
                borderColor: error ? '#F45B69' : code ? '#D4A655' : 'rgba(212,166,85,0.2)',
              }}
              autoFocus
            />
            {error && <p style={styles.errorText}>الرمز غير صحيح، حاول مجدداً</p>}
          </div>
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
        <header style={styles.mobileHeader}>
          <div style={styles.mobileHeaderBrand}>
            <FahdLogo size={28} />
            <span style={styles.mobileHeaderTitle}>AlFhd</span>
          </div>
          <button onClick={onLogout} style={styles.mobileLogoutBtn}>
            <LogOut size={16} />
          </button>
        </header>
        <nav style={styles.bottomNav}>
          {navItems.map((item) => {
            if (item.adminOnly && currentUser.role !== 'admin') return null;
            const Icon = item.icon;
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
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
    <aside style={styles.sidebar}>
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
// عرض المحادثات
// ──────────────────────────────────────────────
function ConversationsView({ conversations, pages, orders }) {
  const [activeTab, setActiveTab] = useState('normal');
  const [selectedPage, setSelectedPage] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedConv, setSelectedConv] = useState(null);

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

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header">
        <div>
          <h2 style={styles.viewTitle}>المحادثات</h2>
          <p style={styles.viewSubtitle}>إدارة محادثات صفحاتك في مكان واحد</p>
        </div>
        <div style={styles.pageSelectWrap}>
          <Facebook size={15} color="#D4A655" />
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
        <div style={styles.convList} className="alfhd-conv-list">
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
                  style={{
                    ...styles.convItem,
                    ...(selectedConv?.id === c.id ? styles.convItemActive : {}),
                  }}
                >
                  <div style={styles.convAvatar}>{c.avatar}</div>
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

        <div style={styles.convDetail}>
          {selectedConv ? (
            <>
              <div style={styles.detailHeader}>
                <div style={styles.convAvatarLg}>{selectedConv.avatar}</div>
                <div>
                  <div style={styles.detailName}>{selectedConv.customer}</div>
                  <div style={styles.detailPage}>
                    {pages.find((p) => p.id === selectedConv.pageId)?.name}
                  </div>
                </div>
              </div>

              <div style={styles.detailMsgArea}>
                <div style={styles.msgBubbleIn}>{selectedConv.lastMsg}</div>
              </div>

              {linkedOrder && (
                <div style={styles.linkedOrderCard}>
                  <div style={styles.linkedOrderHeader}>
                    <Pin size={14} color="#D4A655" />
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
                      <span style={{ ...styles.linkedOrderValue, color: '#D4A655', fontWeight: 700 }}>
                        {linkedOrder.total.toLocaleString()} د.ع
                      </span>
                    </div>
                  </div>
                </div>
              )}
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
function OrdersView({ orders, pages, setOrders }) {
  const [selectedPage, setSelectedPage] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

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
      revenue: scoped.filter((o) => o.status === 'delivered').reduce((s, o) => s + o.total, 0),
    };
  }, [orders, selectedPage]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  };

  const updateStatus = async (id, status) => {
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));
    try {
      await sbUpdate('alfhd_orders', id, { status });
    } catch (e) {
      console.error('Failed to update order status:', e);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={styles.viewWrap}>
      <div style={styles.viewHeader} className="alfhd-view-header">
        <div>
          <h2 style={styles.viewTitle}>الطلبات</h2>
          <p style={styles.viewSubtitle}>متابعة كاملة لطلبات تطبيق الفهود للتوصيل</p>
        </div>
        <button onClick={handlePrint} style={styles.printBtn}>
          <Printer size={15} />
          طباعة الطلبات المضافة
        </button>
      </div>

      <div style={styles.statsRow} className="alfhd-stats-row">
        <StatCard icon={Package} label="إجمالي الطلبات" value={stats.total} color="#D4A655" />
        <StatCard icon={Truck} label="قيد التوصيل" value={stats.pending} color="#D4A655" />
        <StatCard icon={CheckCircle2} label="مستلمة" value={stats.delivered} color="#4ADE80" />
        <StatCard icon={XCircle} label="راجعة" value={stats.returned} color="#F45B69" />
      </div>

      <div style={styles.ordersToolbar}>
        <div style={styles.pageSelectWrap}>
          <Facebook size={15} color="#D4A655" />
          <select value={selectedPage} onChange={(e) => setSelectedPage(e.target.value)} style={styles.pageSelect}>
            <option value="all">كل الصفحات</option>
            {pages.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <ChevronDown size={14} color="#6B6760" />
        </div>

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

      <div style={styles.ordersTable}>
        <div style={styles.tableHeaderRow} className="alfhd-orders-table-header">
          <div style={{ width: 28 }} />
          <div style={styles.th}>رقم الطلب</div>
          <div style={styles.th}>العميل</div>
          <div style={styles.th}>المنتجات</div>
          <div style={styles.th}>المبلغ</div>
          <div style={styles.th}>مرجع الفهود</div>
          <div style={styles.th}>الحالة</div>
          <div style={styles.th}>التاريخ</div>
        </div>

        {filtered.length === 0 ? (
          <div style={styles.emptyState}>
            <Package size={32} color="#3A372F" />
            <p>لا توجد طلبات مطابقة</p>
          </div>
        ) : (
          filtered.map((o) => (
            <div key={o.id} style={styles.tableRow} className="alfhd-orders-row">
              <input
                type="checkbox"
                checked={selectedIds.includes(o.id)}
                onChange={() => toggleSelect(o.id)}
                style={styles.checkbox}
              />
              <div style={{ ...styles.td, fontWeight: 700, color: '#E8E6E1' }}>#{o.orderNo}</div>
              <div style={styles.td}>
                <div>{o.customer}</div>
                <div style={styles.tdSub}>{o.phone}</div>
              </div>
              <div style={{ ...styles.td, color: '#9A958C' }}>{o.items}</div>
              <div style={{ ...styles.td, fontWeight: 700, color: '#D4A655' }}>
                {o.total.toLocaleString()} د.ع
              </div>
              <div style={{ ...styles.td, fontFamily: 'monospace', fontSize: 12, color: '#6B6760' }}>
                {o.fahdRef}
              </div>
              <div style={styles.td}>
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
              <div style={{ ...styles.td, color: '#6B6760', fontSize: 12 }}>{o.date}</div>
            </div>
          ))
        )}
      </div>
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

      <div style={styles.statsRow} className="alfhd-stats-row">
        <StatCard icon={Package} label="إجمالي الطلبات" value={overall.total} color="#D4A655" />
        <StatCard icon={CheckCircle2} label="نسبة التسليم" value={`${overall.deliveryRate}%`} color="#4ADE80" />
        <StatCard icon={XCircle} label="نسبة الإرجاع" value={overall.total ? `${Math.round((overall.returned / overall.total) * 100)}%` : '0%'} color="#F45B69" />
        <StatCard icon={Sparkles} label="إجمالي الإيرادات" value={`${overall.revenue.toLocaleString()} د.ع`} color="#D4A655" />
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
                { label: 'قيد التوصيل', value: overall.pending, color: '#D4A655' },
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
                color: p.connected ? '#4ADE80' : '#D4A655',
              }}>
                <div style={{
                  width: 6, height: 6, borderRadius: '50%',
                  background: p.connected ? '#4ADE80' : '#D4A655',
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
                background: u.role === 'admin' ? 'linear-gradient(135deg,#E8C277,#B8843A)' : '#1C1F28',
                color: u.role === 'admin' ? '#0B0D12' : '#D4A655',
              }}>
                {u.name[0]}
              </div>
              <div style={{ flex: 1 }}>
                <div style={styles.userCardName}>{u.name}</div>
                <div style={styles.userCardRole}>
                  {u.role === 'admin' ? (
                    <><ShieldCheck size={12} color="#4ADE80" /> صلاحية كاملة</>
                  ) : (
                    <><Shield size={12} color="#D4A655" /> صلاحية محددة ({u.permissions.length})</>
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
            <ConversationsView conversations={conversations} pages={pages} orders={orders} />
          )}
          {activeView === 'orders' && (
            <OrdersView orders={orders} pages={pages} setOrders={setOrders} />
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
      * { box-sizing: border-box; font-family: 'Cairo', sans-serif; }
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
      input:focus, select:focus { outline: none; }
      button { font-family: 'Cairo', sans-serif; cursor: pointer; }

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
    backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(212,166,85,0.06) 0%, transparent 40%), radial-gradient(circle at 80% 70%, rgba(212,166,85,0.04) 0%, transparent 40%)',
    pointerEvents: 'none',
  },
  loginCard: {
    position: 'relative', zIndex: 1,
    background: '#13161F', border: '1px solid rgba(212,166,85,0.15)',
    borderRadius: 20, padding: '48px 40px', width: '100%', maxWidth: 380,
    display: 'flex', flexDirection: 'column', alignItems: 'center',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
  },
  loginLogoArea: { position: 'relative', marginBottom: 4 },
  logoGlow: {
    position: 'absolute', inset: -20, borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(212,166,85,0.25) 0%, transparent 70%)',
    filter: 'blur(8px)',
  },
  loginTitle: {
    fontSize: 34, fontWeight: 800, color: '#E8E6E1', margin: '16px 0 2px',
    letterSpacing: '0.02em', fontFamily: "'Cairo', sans-serif",
  },
  loginSubtitle: { fontSize: 14, color: '#6B6760', letterSpacing: '0.08em', margin: 0 },
  inputGroup: { width: '100%', marginBottom: 18 },
  inputLabel: { display: 'block', fontSize: 12, color: '#9A958C', marginBottom: 8, fontWeight: 600 },
  codeInput: {
    width: '100%', background: '#0B0D12', border: '1.5px solid',
    borderRadius: 10, padding: '14px 16px', fontSize: 20, color: '#E8E6E1',
    textAlign: 'center', letterSpacing: '0.3em', transition: 'border-color 0.2s',
  },
  errorText: { color: '#F45B69', fontSize: 12, marginTop: 8, textAlign: 'center' },
  rememberRow: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22, cursor: 'pointer' },
  checkbox: { width: 16, height: 16, accentColor: '#D4A655', cursor: 'pointer' },
  loginBtn: {
    width: '100%', background: 'linear-gradient(135deg,#E8C277,#B8843A)',
    border: 'none', borderRadius: 10, padding: '14px', fontSize: 15,
    fontWeight: 700, color: '#0B0D12', transition: 'opacity 0.2s, transform 0.15s',
  },
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
    background: 'rgba(212,166,85,0.1)', color: '#E8C277', fontWeight: 700,
  },
  navActiveDot: { position: 'absolute', left: 10, width: 5, height: 5, borderRadius: '50%', background: '#D4A655' },
  sidebarFooter: { paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' },
  userBadge: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px', marginBottom: 8 },
  userAvatar: {
    width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#E8C277,#B8843A)',
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
  bottomNavItemActive: { color: '#E8C277' },
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
    background: 'rgba(212,166,85,0.1)', borderColor: 'rgba(212,166,85,0.3)', color: '#E8C277',
  },
  convTabCount: {
    background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: '1px 7px', fontSize: 11, fontWeight: 700,
  },
  convTabCountActive: { background: 'rgba(212,166,85,0.25)', color: '#E8C277' },

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
  convItemActive: { background: 'rgba(212,166,85,0.08)' },
  convAvatar: {
    width: 40, height: 40, borderRadius: 12, background: '#1C1F28', color: '#D4A655',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0,
  },
  convItemTop: { display: 'flex', justifyContent: 'space-between', marginBottom: 3 },
  convCustomer: { fontSize: 13, fontWeight: 700, color: '#E8E6E1' },
  convTime: { fontSize: 11, color: '#6B6760' },
  convItemBottom: { display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' },
  convLastMsg: { fontSize: 12, color: '#6B6760', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 },
  unreadBadge: {
    background: '#D4A655', color: '#0B0D12', borderRadius: 20, fontSize: 10, fontWeight: 800,
    padding: '1px 6px', minWidth: 16, textAlign: 'center', flexShrink: 0,
  },
  convPageTag: { fontSize: 10, color: '#3A372F', marginTop: 4 },

  convDetail: {
    background: '#0E1016', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16,
    padding: 24, display: 'flex', flexDirection: 'column',
  },
  detailHeader: { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.05)', marginBottom: 18 },
  convAvatarLg: {
    width: 48, height: 48, borderRadius: 14, background: '#1C1F28', color: '#D4A655',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 18,
  },
  detailName: { fontSize: 16, fontWeight: 700, color: '#E8E6E1' },
  detailPage: { fontSize: 12, color: '#6B6760' },
  detailMsgArea: { flex: 1, marginBottom: 18 },
  msgBubbleIn: {
    background: '#14171F', borderRadius: '4px 16px 16px 16px', padding: '12px 16px',
    fontSize: 13, color: '#C8C4BB', maxWidth: '70%', lineHeight: 1.6,
  },
  linkedOrderCard: {
    background: 'rgba(212,166,85,0.06)', border: '1px solid rgba(212,166,85,0.2)',
    borderRadius: 14, padding: 16,
  },
  linkedOrderHeader: { display: 'flex', alignItems: 'center', gap: 7, fontSize: 12, fontWeight: 700, color: '#D4A655', marginBottom: 12 },
  linkedOrderBody: { display: 'flex', flexDirection: 'column', gap: 9 },
  linkedOrderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  linkedOrderLabel: { fontSize: 12, color: '#6B6760' },
  linkedOrderValue: { fontSize: 13, color: '#E8E6E1', fontWeight: 600 },

  emptyState: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: '50px 20px', color: '#6B6760', fontSize: 13 },
  emptyStateLg: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, flex: 1, color: '#6B6760', fontSize: 14 },

  // ── Orders ──
  printBtn: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '11px 18px',
    background: '#14171F', border: '1px solid rgba(212,166,85,0.25)', borderRadius: 10,
    color: '#D4A655', fontSize: 13, fontWeight: 700,
  },
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 },
  statCard: {
    display: 'flex', alignItems: 'center', gap: 12, background: '#0E1016',
    border: '1px solid rgba(255,255,255,0.05)', borderRadius: 14, padding: '16px 18px',
  },
  statIconWrap: { width: 38, height: 38, borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  statValue: { fontSize: 20, fontWeight: 800, color: '#E8E6E1', lineHeight: 1.2 },
  statLabel: { fontSize: 11, color: '#6B6760', marginTop: 2 },

  ordersToolbar: { display: 'flex', gap: 12, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' },
  filterChips: { display: 'flex', gap: 6 },
  chip: {
    padding: '8px 14px', background: '#14171F', border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: 9, color: '#9A958C', fontSize: 12, fontWeight: 600,
  },
  chipActive: { background: 'rgba(212,166,85,0.12)', borderColor: 'rgba(212,166,85,0.3)', color: '#E8C277' },

  ordersTable: {
    background: '#0E1016', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16, overflow: 'hidden',
  },
  tableHeaderRow: {
    display: 'grid', gridTemplateColumns: '28px 1fr 1.4fr 1.6fr 1fr 1.2fr 1fr 0.9fr',
    gap: 10, padding: '14px 20px', background: '#14171F', alignItems: 'center',
  },
  th: { fontSize: 11, fontWeight: 700, color: '#6B6760', textTransform: 'uppercase', letterSpacing: '0.03em' },
  tableRow: {
    display: 'grid', gridTemplateColumns: '28px 1fr 1.4fr 1.6fr 1fr 1.2fr 1fr 0.9fr',
    gap: 10, padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,0.04)', alignItems: 'center',
  },
  td: { fontSize: 13, color: '#C8C4BB' },
  tdSub: { fontSize: 11, color: '#6B6760', marginTop: 2 },
  statusSelect: {
    border: '1px solid', borderRadius: 8, padding: '6px 10px', fontSize: 12,
    fontWeight: 700, appearance: 'none', cursor: 'pointer', fontFamily: "'Cairo', sans-serif",
  },

  // ── Stats ──
  chartCard: {
    background: '#0E1016', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 16,
    padding: 24, marginBottom: 20,
  },
  chartTitle: { fontSize: 15, fontWeight: 700, color: '#E8E6E1', margin: '0 0 18px' },
  barChartArea: { display: 'flex', flexDirection: 'column', gap: 16 },
  barChartRow: { display: 'grid', gridTemplateColumns: '180px 1fr 120px', gap: 14, alignItems: 'center' },
  barChartLabel: { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#C8C4BB', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' },
  barChartTrack: { height: 10, background: '#14171F', borderRadius: 6, overflow: 'hidden' },
  barChartFill: { height: '100%', background: 'linear-gradient(90deg,#B8843A,#E8C277)', borderRadius: 6, transition: 'width 0.5s ease' },
  barChartValue: { fontSize: 12, fontWeight: 700, color: '#D4A655', textAlign: 'left' },

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
    background: 'linear-gradient(135deg,#E8C277,#B8843A)', border: 'none', borderRadius: 10,
    color: '#0B0D12', fontSize: 13, fontWeight: 700,
  },
  addPageCard: {
    display: 'flex', gap: 10, marginBottom: 18, background: '#0E1016',
    border: '1px solid rgba(212,166,85,0.2)', borderRadius: 12, padding: 12,
  },
  addPageInput: {
    flex: 1, background: '#14171F', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
    padding: '10px 14px', color: '#E8E6E1', fontSize: 13, fontFamily: "'Cairo', sans-serif",
  },
  confirmBtn: {
    background: '#D4A655', border: 'none', borderRadius: 8, padding: '0 18px',
    color: '#0B0D12', fontWeight: 700, fontSize: 13,
  },
  cancelBtn: {
    background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    padding: '0 12px', color: '#9A958C',
  },
  fbErrorBox: {
    display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16,
    background: 'rgba(244,91,105,0.08)', border: '1px solid rgba(244,91,105,0.25)',
    borderRadius: 12, padding: '12px 16px', color: '#F45B69', fontSize: 13, lineHeight: 1.6,
  },
  fbExchangingBox: {
    marginBottom: 16, background: 'rgba(212,166,85,0.08)', border: '1px solid rgba(212,166,85,0.2)',
    borderRadius: 12, padding: '12px 16px', color: '#D4A655', fontSize: 13,
  },
  fbCandidatesWrap: {
    marginBottom: 20, background: '#0E1016', border: '1px solid rgba(212,166,85,0.2)',
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
    background: 'rgba(212,166,85,0.1)', color: '#D4A655', fontSize: 10, fontWeight: 600,
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
    background: '#13161F', border: '1px solid rgba(212,166,85,0.15)', borderRadius: 18,
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
  roleBtnActive: { background: 'rgba(212,166,85,0.12)', borderColor: 'rgba(212,166,85,0.3)', color: '#E8C277' },
  permsGrid: { display: 'flex', flexDirection: 'column', gap: 4 },
  permCheckRow: { display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#C8C4BB', padding: '6px 0', cursor: 'pointer' },
  modalFooter: { display: 'flex', gap: 10, padding: '18px 22px', borderTop: '1px solid rgba(255,255,255,0.05)' },
  modalCancelBtn: {
    flex: 1, padding: '11px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 9, color: '#9A958C', fontSize: 13, fontWeight: 600,
  },
  modalSaveBtn: {
    flex: 1, padding: '11px', background: 'linear-gradient(135deg,#E8C277,#B8843A)',
    border: 'none', borderRadius: 9, color: '#0B0D12', fontSize: 13, fontWeight: 700,
  },
};
