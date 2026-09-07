import React from 'react';
import { Package, MessageSquare, Warehouse, BarChart3, Users, Facebook, Bot, Sparkles, Activity, ShieldCheck } from 'lucide-react';
import './approved-section-chrome.css';

const META = {
  orders: { title: 'الطلبات', sub: 'إدارة دورة الطلب من الإنشاء إلى التسليم', icon: Package },
  conversations: { title: 'المحادثات', sub: 'مركز تواصل مباشر مع الزبائن والصفحات', icon: MessageSquare },
  warehouse: { title: 'المخزن', sub: 'المنتجات والمبيعات والديون والموردون في مكان واحد', icon: Warehouse },
  stats: { title: 'التقارير', sub: 'قراءة الأداء والحركة التشغيلية والنتائج', icon: BarChart3 },
  users: { title: 'الموظفون', sub: 'إدارة الفريق والصلاحيات والحسابات', icon: Users },
  pages: { title: 'الصفحات', sub: 'القنوات والصفحات المرتبطة بالنظام', icon: Facebook },
  ai_assistant: { title: 'الذكاء', sub: 'الردود والسلوك الذكي والتحكم بالمساعد', icon: Bot },
  settings: { title: 'الإعدادات', sub: 'تهيئة النظام والتكاملات وخيارات التشغيل', icon: ShieldCheck },
};

const SB_URL = 'https://wqfuovvebgipiowaarbo.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxZnVvdnZlYmdpcGlvd2FhcmJvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MTM2ODEsImV4cCI6MjA5NzQ4OTY4MX0.xeQ80kco6TOpbyMnYonzSCBDI3Hn_EKiavKKfC7kLl8';
const SB_H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, 'Accept-Profile': 'public', Prefer: 'count=exact', Range: '0-0' };
const nf = (n) => (Number.isFinite(Number(n)) ? Number(n).toLocaleString('en-US') : '—');

async function exactCount(table, query = '') {
  try {
    const res = await fetch(`${SB_URL}/rest/v1/${table}?select=id${query}`, { headers: SB_H });
    const n = Number(String(res.headers.get('content-range') || '').split('/')[1]);
    return Number.isFinite(n) ? n : null;
  } catch (_e) { return null; }
}

function useLiveTotals(enabled) {
  const [totals, setTotals] = React.useState({ orders: null, conversations: null, today: null });
  React.useEffect(() => {
    if (!enabled) return undefined;
    let alive = true;
    const load = async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const iso = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString();
      const [orders, conversations, today] = await Promise.all([
        exactCount('alfhd_orders'),
        exactCount('alfhd_conversations'),
        exactCount('alfhd_orders', `&created_at=gte.${encodeURIComponent(iso)}`),
      ]);
      if (alive) setTotals({ orders, conversations, today });
    };
    load();
    const id = setInterval(load, 60000);
    const onFocus = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onFocus);
    return () => { alive = false; clearInterval(id); document.removeEventListener('visibilitychange', onFocus); };
  }, [enabled]);
  return totals;
}

export default function ApprovedSectionChrome({ view, orders = [], conversations = [], pages = [], currentUser }) {
  const needsTotals = view === 'orders' || view === 'stats';
  const totals = useLiveTotals(needsTotals);
  if (!view || view === 'home' || view === 'conversations') return null;
  const m = META[view] || { title: 'AlFhd', sub: 'لوحة التشغيل', icon: Sparkles };
  const Icon = m.icon;
  const ordersTotal = totals.orders ?? orders.length;
  const convTotal = totals.conversations ?? conversations.length;
  const stats = needsTotals
    ? [['إجمالي الطلبات', nf(ordersTotal)], ['طلبات اليوم', nf(totals.today ?? 0)], ['المحادثات', nf(convTotal)], ['الصفحات', nf(pages.length)]]
    : [['النظام', 'مباشر'], ['المستخدم', currentUser?.name || 'فهد'], ['الحالة', 'فعال']];

  return <section className="approved-section-chrome" data-section={view} dir="rtl">
    <div className="approved-section-chrome-main">
      <div className="approved-section-icon"><Icon size={20}/></div>
      <div className="approved-section-copy"><span><Activity size={11}/> ALFHD OPERATIONS</span><h1>{m.title}</h1><p>{m.sub}</p></div>
      <div className="approved-section-live"><i/> مباشر</div>
    </div>
    <div className="approved-section-metrics">{stats.map(([label,value])=><div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div>
  </section>;
}
