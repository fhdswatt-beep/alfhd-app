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

export default function ApprovedSectionChrome({ view, orders = [], conversations = [], pages = [], currentUser }) {
  if (!view || view === 'home' || view === 'conversations') return null;
  const m = META[view] || { title: 'AlFhd', sub: 'لوحة التشغيل', icon: Sparkles };
  const Icon = m.icon;
  const stats = view === 'orders'
    ? [['إجمالي الطلبات', orders.length], ['المحادثات', conversations.length], ['الصفحات', pages.length]]
    : view === 'stats'
      ? [['الطلبات', orders.length], ['المحادثات', conversations.length], ['الصفحات', pages.length]]
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
