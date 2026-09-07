import React from 'react';
import { Package, ShoppingCart, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import './reference-home.css';

const HOUR_MS = 3600000;
const LATE_HOURS = 48;

// نفس قاعدة التأخير المعتمدة بباقي الأقسام
function isLate(o) {
  if (!o || o.converted) return false;
  if (o.status === 'delivered' || o.status === 'returned' || o.status === 'cancelled') return false;
  if (o.deliveryStep || o.deliveryStatus) return false;
  const ref = o.deliveryUpdatedAt || o.printedAt || o.createdAt || o.date;
  if (!ref) return false;
  return (Date.now() - new Date(ref).getTime()) / HOUR_MS >= LATE_HOURS;
}

const STAGE_LABEL = { ready: 'جديدة', prep: 'قيد التجهيز', delivery: 'لدى شركة التوصيل' };
function statusLabel(o) {
  if (o.status === 'delivered') return 'تم التسليم';
  if (o.status === 'returned') return 'راجعة';
  if (o.status === 'cancelled') return 'ملغاة';
  return STAGE_LABEL[o.stage || (o.printed ? 'prep' : 'ready')] || 'جديدة';
}
function productOf(o) {
  const raw = String(o.items || o.orderType || '').split('\n')[0].trim();
  return raw ? raw.slice(0, 40) : '';
}
function dayKey(v) {
  const d = new Date(v || 0);
  return Number.isNaN(d.getTime()) ? '' : d.toDateString();
}

export default function ReferenceHomeView({ orders = [], conversations = [], currentUser, onNavigate, onOpenOrder }) {
  const all = Array.isArray(orders) ? orders : [];
  const live = all.filter((o) => !o.converted);
  const stageOf = (o) => o.stage || (o.printed ? 'prep' : 'ready');

  const delivered = live.filter((o) => o.status === 'delivered').length;
  const preparing = live.filter((o) => o.status !== 'delivered' && stageOf(o) === 'prep').length;
  const readyCount = live.filter((o) => o.status !== 'delivered' && stageOf(o) === 'ready').length;
  const inDelivery = live.filter((o) => o.status !== 'delivered' && stageOf(o) === 'delivery').length;
  const lateCount = live.filter(isLate).length;
  const totalRevenue = live.filter((o) => o.status === 'delivered').reduce((s, o) => s + (Number(o.total) || 0), 0);
  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(Number(n) || 0));

  const todayKey = new Date().toDateString();
  const yKey = (() => { const d = new Date(); d.setDate(d.getDate() - 1); return d.toDateString(); })();
  const todayOrders = live.filter((o) => dayKey(o.createdAt || o.date) === todayKey);
  const yesterdayOrders = live.filter((o) => dayKey(o.createdAt || o.date) === yKey);
  const trend = (t, y) => {
    if (!y) return t ? '+' + t : '—';
    const pct = Math.round(((t - y) / y) * 100);
    return (pct > 0 ? '+' : '') + pct + '%';
  };
  const ordersTrend = trend(todayOrders.length, yesterdayOrders.length);
  const deliveredTrend = trend(
    todayOrders.filter((o) => o.status === 'delivered').length,
    yesterdayOrders.filter((o) => o.status === 'delivered').length,
  );
  const revenueTrend = trend(
    Math.round(todayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0)),
    Math.round(yesterdayOrders.reduce((s, o) => s + (Number(o.total) || 0), 0)),
  );

  const latest = [...live]
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
    .slice(0, 5);

  const productCounts = new Map();
  live.forEach((o) => { const n = productOf(o); if (n) productCounts.set(n, (productCounts.get(n) || 0) + 1); });
  const topProducts = [...productCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  const maxTop = Math.max(1, ...topProducts.map(([, c]) => c));

  const govCounts = new Map();
  live.forEach((o) => { const g = String(o.governorateName || '').trim(); if (g) govCounts.set(g, (govCounts.get(g) || 0) + 1); });
  const topGov = [...govCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const daily = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i));
    const key = d.toDateString();
    return {
      label: d.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' }),
      count: live.filter((o) => dayKey(o.createdAt || o.date) === key).length,
    };
  });
  const maxDaily = Math.max(1, ...daily.map((x) => x.count));
  const points = daily.map((x, i) => `${(i / (daily.length - 1)) * 100},${86 - (x.count / maxDaily) * 66}`).join(' ');

  const unread = (Array.isArray(conversations) ? conversations : []).reduce((s, c) => s + (Number(c.unreadCount ?? c.unread_count) || 0), 0);

  const kpis = [
    { icon: Package, label: 'إجمالي الطلبات', value: fmt(live.length), trend: '', color: '#9a54ff', to: 'orders' },
    { icon: ShoppingCart, label: 'طلبات اليوم', value: fmt(todayOrders.length), trend: ordersTrend, color: '#3f8cff', to: 'orders' },
    { icon: Clock, label: 'قيد التجهيز', value: fmt(preparing), trend: '', color: '#ff9e36', to: 'orders' },
    { icon: CheckCircle2, label: 'تم التسليم', value: fmt(delivered), trend: deliveredTrend, color: '#28d69f', to: 'orders' },
    { icon: TrendingUp, label: 'مبيعات مكتملة', value: fmt(totalRevenue), trend: revenueTrend, color: '#bc4cff', to: 'stats' },
  ];

  return <div className="rx-dashboard" dir="rtl">
    <div className="rx-hero">
      <div>
        <div className="rx-greeting">👋 مرحباً <b>{currentUser?.name || 'فهد'}</b></div>
        <div className="rx-subtitle">هنا نظرة سريعة على نشاط متجرك اليوم</div>
      </div>
      <div className="rx-date">{new Date().toLocaleDateString('ar-IQ', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    </div>

    <div className="rx-kpis">{kpis.map(({ icon: Icon, ...k }) => (
      <button key={k.label} className="rx-kpi" onClick={() => onNavigate(k.to)}>
        <div className="rx-kpi-icon" style={{ '--a': k.color }}><Icon size={18} /></div>
        <div className="rx-kpi-label">{k.label}</div>
        <div className="rx-kpi-value">{k.value}</div>
        <div className="rx-kpi-foot">{k.trend
          ? <><span className={String(k.trend).startsWith('-') ? 'down' : 'up'}>{k.trend}</span><span>عن أمس</span></>
          : <span>الحالي</span>}</div>
      </button>
    ))}</div>

    <div className="rx-mid">
      <section className="rx-panel rx-map">
        <div className="rx-head"><b>الطلبات حسب المحافظة</b><span>الكل</span></div>
        <div className="rx-gov">
          {topGov.length ? topGov.map(([g, c]) => (
            <div className="rx-bar" key={g}>
              <div><span>{g}</span><b>{c} طلب</b></div>
              <i><u style={{ width: `${(c / Math.max(1, topGov[0][1])) * 100}%` }} /></i>
            </div>
          )) : <div className="rx-empty">لا توجد محافظات مسجّلة بعد</div>}
        </div>
      </section>

      <section className="rx-panel rx-status">
        <div className="rx-head"><b>حالة الطلبات</b></div>
        <div className="rx-donut"><div><strong>{fmt(live.length)}</strong><small>إجمالي الطلبات</small></div></div>
        <div className="rx-status-list">
          <span><i className="v" />جديدة <b>{readyCount}</b></span>
          <span><i className="g" />قيد التجهيز <b>{preparing}</b></span>
          <span><i className="a" />لدى شركة التوصيل <b>{inDelivery}</b></span>
          <span><i className="b" />تم التسليم <b>{delivered}</b></span>
        </div>
      </section>

      <section className="rx-panel rx-latest">
        <div className="rx-head"><b>آخر الطلبات</b></div>
        {latest.length ? latest.map((o, i) => (
          <button key={o.id || i} className="rx-order" onClick={() => onOpenOrder(o)}>
            <div className="rx-avatar">{String(o.customer || 'ع').trim().slice(0, 1)}</div>
            <div><b>{o.customer || `طلب #${o.orderNo || ''}`}</b><small>{productOf(o) || `#${o.orderNo || ''}`}</small></div>
            <em>{statusLabel(o)}</em>
          </button>
        )) : <div className="rx-empty">لا توجد طلبات</div>}
        <button className="rx-more" onClick={() => onNavigate('orders')}>عرض الكل</button>
      </section>
    </div>

    <div className="rx-bottom">
      <section className="rx-panel rx-chart">
        <div className="rx-head"><b>الطلبات خلال آخر ٧ أيام</b><span>الطلبات</span></div>
        <div className="rx-line">
          <svg viewBox="0 0 700 180" preserveAspectRatio="none">
            <defs><linearGradient id="area"><stop offset="0" stopColor="#a04cff" stopOpacity=".4" /><stop offset="1" stopColor="#a04cff" stopOpacity="0" /></linearGradient></defs>
            <polygon points={`0,180 ${points.replaceAll(' ', ',')} 100,180`} fill="url(#area)" />
            <polyline points={points} fill="none" stroke="#b758ff" strokeWidth="3" vectorEffect="non-scaling-stroke" />
          </svg>
          <div>{daily.map((x) => <span key={x.label}>{x.label}</span>)}</div>
        </div>
      </section>

      <section className="rx-panel rx-top">
        <div className="rx-head"><b>الأكثر طلباً</b></div>
        {topProducts.length ? topProducts.map(([n, c]) => (
          <div className="rx-bar" key={n}>
            <div><span>{n}</span><b>{c} طلب</b></div>
            <i><u style={{ width: `${(c / maxTop) * 100}%` }} /></i>
          </div>
        )) : <div className="rx-empty">لا توجد بيانات</div>}
        <button className="rx-more" onClick={() => onNavigate('stats')}>عرض الكل</button>
      </section>

      <section className="rx-panel rx-response">
        <div className="rx-head"><b>تحتاج انتباهك</b></div>
        <div className="rx-ring"><strong>{lateCount}</strong><span>طلب متأخر</span></div>
        <small>{unread ? `${unread} رسالة غير مقروءة` : 'لا توجد رسائل غير مقروءة'}</small>
      </section>
    </div>
  </div>;
}
