import React from 'react';
import { Home, MessageSquare, Package, Warehouse, MoreHorizontal, Bell, Plus, BarChart3, ClipboardList, Box, ChevronLeft, CarFront } from 'lucide-react';

const SUPABASE_URL = 'https://wqfuovvebgipiowaarbo.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJIUzI1NiIsInJlZiI6IndxZnVvdnZlYmdpcGlvd2FhcmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTM2ODEsImV4cCI6MjA5NzQ4OTY4MX0.xeQ80kco6TOpbyMnYonzSCBDI3Hn_EKiavKKfC7kLl8';
const HEADERS = { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` };

function getSession() {
  try {
    const raw = localStorage.getItem('alfhd_session') || sessionStorage.getItem('alfhd_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function number(v) {
  const n = Number(String(v ?? 0).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(n) ? n : 0;
}
function fmt(v) { return new Intl.NumberFormat('en-US').format(Math.round(number(v))); }
function orderNo(o, i) { return o.order_no || o.orderNo || o.fahd_ref || o.fahdRef || `#${1058 - i}`; }
function customer(o) { return o.customer || o.customer_name || o.customerName || 'عميل'; }
function product(o) { return o.order_type || o.orderType || o.items || o.product_name || o.productName || 'طلب جديد'; }
function created(o) { return o.created_at || o.createdAt || o.date || null; }
function stageLabel(o) {
  if (o.prep_status === 'rejected' || o.prepStatus === 'rejected') return 'مرفوض';
  if (o.converted) return 'مؤرشف';
  const s = String(o.stage || o.status || '').toLowerCase();
  if (/deliver|shipping|ofd/.test(s)) return 'لدى التوصيل';
  if (/prep|print/.test(s) || o.printed) return 'قيد المعالجة';
  return 'جديد';
}

function useMobile() {
  const [mobile, setMobile] = React.useState(() => typeof window !== 'undefined' && window.innerWidth < 861);
  React.useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 861);
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return mobile;
}

export default function ApprovedMobileShell() {
  const mobile = useMobile();
  const [session, setSession] = React.useState(() => getSession());
  const [tab, setTab] = React.useState('home');
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const t = setInterval(() => {
      const next = getSession();
      setSession((prev) => {
        const a = prev?.userId || prev?.userData?.id;
        const b = next?.userId || next?.userData?.id;
        return a === b && !!prev === !!next ? prev : next;
      });
    }, 600);
    return () => clearInterval(t);
  }, []);

  const user = session?.userData || {};
  const workspaceId = user.workspaceId || user.workspace_id || null;

  const loadOrders = React.useCallback(async () => {
    if (!session) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('select', '*');
      params.set('order', 'created_at.desc');
      params.set('limit', '80');
      if (workspaceId) params.set('workspace_id', `eq.${workspaceId}`);
      const r = await fetch(`${SUPABASE_URL}/rest/v1/alfhd_orders?${params.toString()}`, { headers: HEADERS });
      const rows = await r.json();
      setOrders(Array.isArray(rows) ? rows : []);
    } catch { setOrders([]); }
    setLoading(false);
  }, [session, workspaceId]);

  React.useEffect(() => {
    if (!mobile || !session) return;
    loadOrders();
    const t = setInterval(loadOrders, 15000);
    return () => clearInterval(t);
  }, [mobile, session, loadOrders]);

  const navigateNative = (id) => {
    setTab(id);
    if (id === 'home') return;
    const labels = { conversations: 'المحادثات', orders: 'الطلبات', warehouse: 'المخزن' };
    const target = [...document.querySelectorAll('button.alfhd-bottom-nav-item, button.alfhd-nav-item')]
      .find((b) => b.textContent?.includes(labels[id] || ''));
    target?.click();
  };

  if (!mobile || !session) return null;

  const todayKey = new Date().toDateString();
  const todayOrders = orders.filter((o) => {
    const d = new Date(created(o) || 0);
    return !Number.isNaN(d.getTime()) && d.toDateString() === todayKey;
  });
  const processing = orders.filter((o) => /prep|print/i.test(String(o.stage || '')) || o.printed).length;
  const delivered = orders.filter((o) => /deliver|completed|done/i.test(String(o.status || o.stage || ''))).length;
  const revenue = orders.reduce((s, o) => s + number(o.total || o.amount || o.price), 0);
  const latest = orders.slice(0, 4);
  const hero = orders.find((o) => !o.converted) || orders[0];

  return (
    <>
      {tab === 'home' && (
        <section className="approved-home" dir="rtl">
          <div className="approved-home-scroll">
            <header className="approved-top">
              <div className="approved-avatar">{String(user.name || 'فهد').slice(0, 1)}</div>
              <button className="approved-icon-btn" aria-label="الإشعارات"><Bell size={21}/><i/></button>
            </header>

            <div className="approved-greeting">
              <h1>مرحبا {user.name || 'فهد'} 👋</h1>
              <p>أهلاً بك في الفهد لإدارة الطلبات</p>
            </div>

            <article className="approved-hero-card">
              <div className="approved-hero-copy">
                <small>طلب نشط</small>
                <strong>{hero ? orderNo(hero, 0) : '#1058'}</strong>
                <span>{hero ? product(hero) : 'هيونداي سوناتا 2023'}</span>
                <em>{hero ? stageLabel(hero) : 'قيد المعالجة'} <b/></em>
              </div>
              <div className="approved-car-stage" aria-hidden="true">
                <div className="approved-car-glow"/>
                <CarFront size={122} strokeWidth={1.15}/>
              </div>
              <button className="approved-hero-arrow" onClick={() => navigateNative('orders')}><ChevronLeft size={18}/></button>
            </article>

            <div className="approved-actions">
              <button onClick={() => navigateNative('orders')}><span><Plus/></span><b>طلب جديد</b></button>
              <button onClick={() => navigateNative('orders')}><span><ClipboardList/></span><b>الطلبات</b></button>
              <button onClick={() => navigateNative('warehouse')}><span><Box/></span><b>المخزون</b></button>
              <button onClick={() => navigateNative('orders')}><span><BarChart3/></span><b>التقارير</b></button>
            </div>

            <div className="approved-section-title"><h2>نظرة سريعة</h2><span>عرض الكل</span></div>
            <div className="approved-kpis">
              <div><small>إجمالي الطلبات</small><strong>{fmt(orders.length)}</strong><span>+12% <i>●</i></span><b><Package size={17}/></b></div>
              <div><small>طلبات قيد المعالجة</small><strong>{fmt(processing)}</strong><span>+8% <i>●</i></span><b><ClipboardList size={17}/></b></div>
              <div><small>الإيرادات</small><strong>{revenue ? `${fmt(revenue)} د.ع` : '—'}</strong><span>+15% <i>●</i></span><b><BarChart3 size={17}/></b></div>
              <div><small>تم التسليم اليوم</small><strong>{fmt(delivered || todayOrders.length)}</strong><span>+5% <i>●</i></span><b><Package size={17}/></b></div>
            </div>

            <div className="approved-section-title approved-latest-title"><h2>آخر الطلبات</h2><span>عرض الكل</span></div>
            <div className="approved-latest">
              {loading && !latest.length ? <div className="approved-empty">جارٍ تحميل الطلبات...</div> : latest.map((o, i) => (
                <button key={o.id || i} onClick={() => navigateNative('orders')}>
                  <div className="approved-thumb"><CarFront size={22}/></div>
                  <div className="approved-order-copy"><b>{product(o)}</b><small>{customer(o)} · {created(o) ? new Date(created(o)).toLocaleTimeString('ar-IQ',{hour:'2-digit',minute:'2-digit'}) : 'الآن'}</small></div>
                  <span className="approved-status">{stageLabel(o)}</span>
                  <strong>{orderNo(o, i)}</strong>
                  <ChevronLeft size={16}/>
                </button>
              ))}
              {!loading && !latest.length && <div className="approved-empty">لا توجد طلبات حالياً</div>}
            </div>
          </div>
        </section>
      )}

      <nav className="approved-bottom-nav" dir="rtl">
        <button className={tab==='home'?'active':''} onClick={() => navigateNative('home')}><Home/><span>الرئيسية</span></button>
        <button className={tab==='orders'?'active':''} onClick={() => navigateNative('orders')}><ClipboardList/><span>الطلبات</span></button>
        <button className={tab==='conversations'?'active':''} onClick={() => navigateNative('conversations')}><MessageSquare/><span>المحادثات</span></button>
        <button className={tab==='warehouse'?'active':''} onClick={() => navigateNative('warehouse')}><Box/><span>المخزون</span></button>
        <button onClick={() => document.querySelector('.alfhd-app-wrap > header button')?.click()}><MoreHorizontal/><span>المزيد</span></button>
      </nav>
    </>
  );
}
