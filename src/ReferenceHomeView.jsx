import React, { Suspense, lazy, useEffect, useMemo, useRef, useState } from 'react';
import { Package, ShoppingCart, Clock, CheckCircle2, Truck, AlertTriangle, MessageSquare } from 'lucide-react';
import './fhd-theme.css';

const Hero3D = lazy(() => import('./Hero3D.jsx'));

const HOUR_MS = 3600000;
const LATE_WARN_HOURS = 30;
const LATE_HOURS = 48;

function lateHours(o) {
  if (!o || o.converted) return 0;
  if (o.status === 'delivered' || o.status === 'returned' || o.status === 'cancelled') return 0;
  const ref = o.deliveryUpdatedAt || o.printedAt || o.createdAt || o.date;
  if (!ref) return 0;
  const h = (Date.now() - new Date(ref).getTime()) / HOUR_MS;
  return Number.isFinite(h) ? h : 0;
}

const STAGE_LABEL = { ready: 'جديدة', prep: 'قيد التجهيز', delivery: 'لدى التوصيل' };
const STAGE_CLASS = { ready: 'b-new', prep: 'b-prep', delivery: 'b-ship' };

function statusInfo(o) {
  if (o.status === 'delivered') return { text: 'تم التسليم', cls: 'b-done' };
  if (o.status === 'returned') return { text: 'راجعة', cls: 'b-bad' };
  if (o.status === 'cancelled') return { text: 'ملغاة', cls: 'b-bad' };
  const st = o.stage || (o.printed ? 'prep' : 'ready');
  return { text: STAGE_LABEL[st] || 'جديدة', cls: STAGE_CLASS[st] || 'b-new' };
}

function productOf(o) {
  const raw = String(o.items || o.orderType || '').split('\n')[0].trim();
  return raw ? raw.slice(0, 40) : '';
}
function dayKey(v) {
  const d = new Date(v || 0);
  return Number.isNaN(d.getTime()) ? '' : d.toDateString();
}
const nf = new Intl.NumberFormat('en-US');
const fmt = (n) => nf.format(Math.round(Number(n) || 0));

function useCountUp(target) {
  const [val, setVal] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const reduce = typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const start = from.current;
    if (reduce || start === target) { from.current = target; setVal(target); return undefined; }
    const t0 = performance.now();
    const dur = 750;
    let raf = 0;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const e = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(start + (target - start) * e));
      if (p < 1) raf = requestAnimationFrame(tick);
      else from.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return val;
}

function Counter({ value }) {
  const v = useCountUp(Number(value) || 0);
  return <span className="num">{fmt(v)}</span>;
}

function Hero({ name }) {
  const [show3d, setShow3d] = useState(false);
  useEffect(() => {
    const id = window.setTimeout(() => setShow3d(true), 400);
    return () => window.clearTimeout(id);
  }, []);

  const fallback = <div className="fhd-hero-3d-fallback">الفهد</div>;

  return (
    <div className="fhd-hero fhd-rise">
      <div className="fhd-hero-text">
        <div className="fhd-hero-hi">أهلاً بك مجدداً</div>
        <div className="fhd-hero-name">{name || 'فهد'}</div>
        <div className="fhd-hero-sub">هذي نظرة سريعة على حركة متجرك اليوم</div>
        <div className="fhd-hero-date">
          {new Date().toLocaleDateString('ar-IQ', { weekday: 'long', day: 'numeric', month: 'long' })}
        </div>
      </div>
      <div className="fhd-hero-3d">
        {show3d ? <Suspense fallback={fallback}><Hero3D /></Suspense> : fallback}
      </div>
    </div>
  );
}

export default function ReferenceHomeView({ orders = [], conversations = [], currentUser, onNavigate, onOpenOrder }) {
  const all = Array.isArray(orders) ? orders : [];

  const d = useMemo(() => {
    const live = all.filter((o) => !o.converted);
    const stageOf = (o) => o.stage || (o.printed ? 'prep' : 'ready');
    const open = live.filter((o) => o.status !== 'delivered' && o.status !== 'returned' && o.status !== 'cancelled');

    const delivered = live.filter((o) => o.status === 'delivered').length;
    const preparing = open.filter((o) => stageOf(o) === 'prep').length;
    const readyCount = open.filter((o) => stageOf(o) === 'ready').length;
    const inDelivery = open.filter((o) => stageOf(o) === 'delivery').length;

    const hoursList = open.map(lateHours);
    const lateCount = hoursList.filter((h) => h >= LATE_HOURS).length;
    const warnCount = hoursList.filter((h) => h >= LATE_WARN_HOURS && h < LATE_HOURS).length;

    const revenue = live.filter((o) => o.status === 'delivered')
      .reduce((s, o) => s + (Number(o.total) || 0), 0);

    const todayKey = new Date().toDateString();
    const yKey = (() => { const x = new Date(); x.setDate(x.getDate() - 1); return x.toDateString(); })();
    const todayOrders = live.filter((o) => dayKey(o.createdAt || o.date) === todayKey);
    const yOrders = live.filter((o) => dayKey(o.createdAt || o.date) === yKey);
    const trend = (t, y) => {
      if (!y) return t ? '+' + t : '';
      const pct = Math.round(((t - y) / y) * 100);
      return (pct > 0 ? '+' : '') + pct + '%';
    };

    const latest = [...live]
      .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
      .slice(0, 5);

    const govCounts = new Map();
    live.forEach((o) => {
      const g = String(o.governorateName || '').trim();
      if (g) govCounts.set(g, (govCounts.get(g) || 0) + 1);
    });
    const topGov = [...govCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

    const productCounts = new Map();
    live.forEach((o) => {
      const n = productOf(o);
      if (n) productCounts.set(n, (productCounts.get(n) || 0) + 1);
    });
    const topProducts = [...productCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

    const daily = Array.from({ length: 7 }, (_, i) => {
      const x = new Date(); x.setDate(x.getDate() - (6 - i));
      const key = x.toDateString();
      return {
        label: x.toLocaleDateString('ar-IQ', { day: 'numeric', month: 'short' }),
        count: live.filter((o) => dayKey(o.createdAt || o.date) === key).length,
      };
    });

    const unread = (Array.isArray(conversations) ? conversations : [])
      .reduce((s, c) => s + (Number(c.unreadCount ?? c.unread_count) || 0), 0);

    return {
      live, delivered, preparing, readyCount, inDelivery, lateCount, warnCount,
      revenue, todayOrders, yOrders, trend, latest, topGov, topProducts, daily, unread,
    };
  }, [all, conversations]);

  const total = d.live.length;
  const kpis = [
    { icon: Package, label: 'إجمالي الطلبات', value: total, color: '#4f46e5', to: 'orders', foot: 'الحالي' },
    { icon: ShoppingCart, label: 'طلبات اليوم', value: d.todayOrders.length, color: '#0ea5e9', to: 'orders', trend: d.trend(d.todayOrders.length, d.yOrders.length) },
    { icon: Clock, label: 'قيد التجهيز', value: d.preparing, color: '#f59e0b', to: 'orders', foot: 'بانتظار الطباعة' },
    { icon: Truck, label: 'لدى التوصيل', value: d.inDelivery, color: '#8b5cf6', to: 'orders', foot: 'بالطريق' },
    { icon: CheckCircle2, label: 'تم التسليم', value: d.delivered, color: '#10b981', to: 'orders', foot: 'مكتملة' },
    { icon: MessageSquare, label: 'رسائل غير مقروءة', value: d.unread, color: '#f43f5e', to: 'conversations', foot: 'بالمحادثات' },
  ];

  const maxDaily = Math.max(1, ...d.daily.map((x) => x.count));
  const pts = d.daily.map((x, i) => [(i / (d.daily.length - 1)) * 300, 110 - (x.count / maxDaily) * 88]);
  const line = pts.map((p) => p.join(',')).join(' ');
  const area = `0,120 ${line} 300,120`;

  const statusRows = [
    { k: 'جديدة', v: d.readyCount, c: '#0ea5e9' },
    { k: 'قيد التجهيز', v: d.preparing, c: '#f59e0b' },
    { k: 'لدى التوصيل', v: d.inDelivery, c: '#8b5cf6' },
    { k: 'تم التسليم', v: d.delivered, c: '#10b981' },
  ];
  const donutTotal = Math.max(1, statusRows.reduce((s, r) => s + r.v, 0));
  let acc = 0;
  const C = 2 * Math.PI * 46;

  const alert = d.lateCount > 0
    ? { cls: '', icon: AlertTriangle, text: `${fmt(d.lateCount)} طلب تجاوز ٤٨ ساعة` }
    : d.warnCount > 0
      ? { cls: 'warn', icon: Clock, text: `${fmt(d.warnCount)} طلب قارب على ٣٠ ساعة` }
      : null;

  return (
    <div className="fhd" dir="rtl">
      <Hero name={currentUser?.name} />

      {alert && (
        <button className={`fhd-alert fhd-press ${alert.cls}`} onClick={() => onNavigate('orders')}>
          <alert.icon size={18} />
          {alert.text}
          <span>عرض الطلبات ←</span>
        </button>
      )}

      <div className="fhd-kpis">
        {kpis.map(({ icon: Icon, ...k }, i) => (
          <button
            key={k.label}
            className="fhd-kpi fhd-press fhd-rise"
            style={{ animationDelay: `${60 + i * 55}ms` }}
            onClick={() => onNavigate(k.to)}
          >
            <div className="fhd-kpi-ico" style={{ '--c': k.color }}><Icon size={18} /></div>
            <div className="fhd-kpi-label">{k.label}</div>
            <div className="fhd-kpi-value"><Counter value={k.value} /></div>
            <div className="fhd-kpi-foot">
              {k.trend
                ? <><span className={String(k.trend).startsWith('-') ? 'down' : 'up'}>{k.trend}</span><span>عن أمس</span></>
                : <span>{k.foot}</span>}
            </div>
          </button>
        ))}
      </div>

      <div className="fhd-stack">
        <section className="fhd-card fhd-rise" style={{ animationDelay: '160ms' }}>
          <div className="fhd-head">
            <h3>مبيعات مكتملة</h3>
            <button onClick={() => onNavigate('stats')}>التقارير</button>
          </div>
          <div className="fhd-kpi-value" style={{ fontSize: 30 }}><Counter value={d.revenue} /> <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--fhd-ink-3)' }}>د.ع</span></div>
          <div className="fhd-chart" style={{ marginTop: 10 }}>
            <svg viewBox="0 0 300 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="fhdArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#6366f1" stopOpacity=".35" />
                  <stop offset="1" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <polygon points={area} fill="url(#fhdArea)" />
              <polyline points={line} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="3" fill="#4f46e5" />)}
            </svg>
          </div>
          <div className="fhd-chart-x">{d.daily.map((x) => <span key={x.label}>{x.label}</span>)}</div>
        </section>

        <div className="fhd-grid-2" style={{ display: 'grid', gap: 14 }}>
          <section className="fhd-card fhd-rise" style={{ animationDelay: '210ms' }}>
            <div className="fhd-head">
              <h3>الطلبات حسب المحافظة</h3>
              <button onClick={() => onNavigate('stats')}>الكل</button>
            </div>
            {d.topGov.length ? (
              <div className="fhd-bars">
                {d.topGov.map(([g, c], i) => (
                  <div key={g}>
                    <div className="fhd-bar-top"><span>{g}</span><b className="num">{fmt(c)} طلب</b></div>
                    <div className="fhd-track">
                      <div
                        className="fhd-fill"
                        style={{
                          width: `${(c / Math.max(1, d.topGov[0][1])) * 100}%`,
                          background: ['#4f46e5', '#7c3aed', '#0ea5e9', '#10b981'][i % 4],
                          animationDelay: `${i * 90}ms`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : <div className="fhd-empty">لا توجد محافظات مسجّلة بعد</div>}
          </section>

          <section className="fhd-card fhd-rise" style={{ animationDelay: '260ms' }}>
            <div className="fhd-head"><h3>حالة الطلبات</h3></div>
            <div className="fhd-status">
              <div className="fhd-donut">
                <svg viewBox="0 0 108 108">
                  <circle cx="54" cy="54" r="46" fill="none" stroke="#eef0f6" strokeWidth="12" />
                  {statusRows.map((r) => {
                    const len = (r.v / donutTotal) * C;
                    const el = (
                      <circle
                        key={r.k}
                        cx="54" cy="54" r="46" fill="none"
                        stroke={r.c} strokeWidth="12" strokeLinecap="round"
                        strokeDasharray={`${Math.max(0, len - 2)} ${C}`}
                        strokeDashoffset={-acc}
                      />
                    );
                    acc += len;
                    return el;
                  })}
                </svg>
                <div className="fhd-donut-mid">
                  <b className="num">{fmt(total)}</b>
                  <small>إجمالي</small>
                </div>
              </div>
              <div className="fhd-legend">
                {statusRows.map((r) => (
                  <div key={r.k}><i style={{ background: r.c }} />{r.k}<b className="num">{fmt(r.v)}</b></div>
                ))}
              </div>
            </div>
          </section>
        </div>

        <section className="fhd-card fhd-rise" style={{ animationDelay: '310ms' }}>
          <div className="fhd-head">
            <h3>آخر الطلبات</h3>
            <button onClick={() => onNavigate('orders')}>عرض الكل</button>
          </div>
          {d.latest.length ? (
            <div className="fhd-list">
              {d.latest.map((o, i) => {
                const s = statusInfo(o);
                return (
                  <button key={o.id || i} className="fhd-row fhd-press" onClick={() => onOpenOrder(o)}>
                    <div className="fhd-av">{String(o.customer || 'ع').trim().slice(0, 1)}</div>
                    <div className="fhd-row-main">
                      <b>{o.customer || `طلب #${o.orderNo || ''}`}</b>
                      <small>{productOf(o) || `#${o.orderNo || ''}`}</small>
                    </div>
                    <span className={`fhd-badge ${s.cls}`}>{s.text}</span>
                  </button>
                );
              })}
            </div>
          ) : <div className="fhd-empty">لا توجد طلبات بعد</div>}
        </section>

        <section className="fhd-card fhd-rise" style={{ animationDelay: '360ms' }}>
          <div className="fhd-head">
            <h3>الأكثر طلباً</h3>
            <button onClick={() => onNavigate('warehouse')}>المخزن</button>
          </div>
          {d.topProducts.length ? (
            <div className="fhd-bars">
              {d.topProducts.map(([n, c], i) => (
                <div key={n}>
                  <div className="fhd-bar-top"><span>{n}</span><b className="num">{fmt(c)}</b></div>
                  <div className="fhd-track">
                    <div
                      className="fhd-fill"
                      style={{
                        width: `${(c / Math.max(1, d.topProducts[0][1])) * 100}%`,
                        background: 'linear-gradient(90deg,#7c3aed,#a855f7)',
                        animationDelay: `${i * 90}ms`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="fhd-empty">لا توجد بيانات كافية</div>}
        </section>
      </div>
    </div>
  );
}
