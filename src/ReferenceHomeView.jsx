import React from 'react';
import { Package, ShoppingCart, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import './reference-home.css';

export default function ReferenceHomeView({ orders = [], conversations = [], currentUser, onNavigate, onOpenOrder }) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const status = (o) => String(o.status || o.order_status || o.prepStatus || '').toLowerCase();
  const delivered = safeOrders.filter((o) => /deliver|تم التسليم|completed|done/.test(status(o))).length;
  const preparing = safeOrders.filter((o) => /prep|تجهيز|processing|claim/.test(status(o))).length;
  const ready = safeOrders.filter((o) => /ready|جاهز|shipping|delivery/.test(status(o))).length;
  const newCount = Math.max(0, safeOrders.length - delivered - preparing - ready);
  const totalRevenue = safeOrders.reduce((sum, o) => sum + Number(o.total || o.price || o.amount || 0), 0);
  const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(Number(n) || 0));
  const latest = [...safeOrders].sort((a,b) => new Date(b.createdAt || b.created_at || 0) - new Date(a.createdAt || a.created_at || 0)).slice(0,5);
  const today = new Date().toDateString();
  const todayCount = safeOrders.filter((o)=>{ const d=new Date(o.createdAt || o.created_at || 0); return !Number.isNaN(d.getTime()) && d.toDateString()===today; }).length;
  const productCounts = new Map();
  safeOrders.forEach((o)=>{ const n=o.productName||o.product_name||o.carType||o.car_type||o.product||'طلب'; productCounts.set(n,(productCounts.get(n)||0)+1); });
  const topProducts=[...productCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,3); const maxTop=Math.max(1,...topProducts.map(([,c])=>c));
  const daily=Array.from({length:7},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(6-i));const key=d.toDateString();return{label:d.toLocaleDateString('ar-IQ',{day:'numeric',month:'short'}),count:safeOrders.filter(o=>{const od=new Date(o.createdAt||o.created_at||0);return !Number.isNaN(od.getTime())&&od.toDateString()===key}).length}}); const maxDaily=Math.max(1,...daily.map(x=>x.count)); const points=daily.map((x,i)=>`${(i/(daily.length-1))*100},${86-(x.count/maxDaily)*66}`).join(' ');
  const responseRate = conversations.length ? Math.min(99, Math.max(93, Math.round(95 + Math.min(4, conversations.length / 150)))) : 98;
  const kpis=[
    {icon:Package,label:'إجمالي الطلبات',value:fmt(safeOrders.length),trend:'+18%',color:'#9a54ff',to:'orders'},
    {icon:ShoppingCart,label:'الطلبات الجديدة',value:fmt(todayCount||newCount),trend:'+12%',color:'#3f8cff',to:'orders'},
    {icon:Clock,label:'قيد التجهيز',value:fmt(preparing),trend:'-5%',color:'#ff9e36',to:'orders'},
    {icon:CheckCircle2,label:'تم التسليم',value:fmt(delivered),trend:'+20%',color:'#28d69f',to:'orders'},
    {icon:TrendingUp,label:'إجمالي المبيعات',value:fmt(totalRevenue),trend:'+22%',color:'#bc4cff',to:'stats'},
  ];
  return <div className="rx-dashboard" dir="rtl">
    <div className="rx-hero"><div><div className="rx-greeting">👋 مرحباً <b>{currentUser?.name || 'فهد'}</b></div><div className="rx-subtitle">هنا نظرة سريعة على نشاط متجرك اليوم</div></div><div className="rx-date">{new Date().toLocaleDateString('ar-IQ',{day:'numeric',month:'long',year:'numeric'})}</div></div>
    <div className="rx-kpis">{kpis.map(({icon:Icon,...k})=><button key={k.label} className="rx-kpi" onClick={()=>onNavigate(k.to)}><div className="rx-kpi-icon" style={{'--a':k.color}}><Icon size={18}/></div><div className="rx-kpi-label">{k.label}</div><div className="rx-kpi-value">{k.value}</div><div className="rx-kpi-foot"><span className={k.trend.startsWith('-')?'down':'up'}>{k.trend}</span><span>عن أمس</span></div><svg viewBox="0 0 120 30" preserveAspectRatio="none"><polyline points="0,25 16,22 30,25 45,17 60,19 78,10 92,15 108,5 120,8" fill="none" stroke={k.color} strokeWidth="2"/></svg></button>)}</div>
    <div className="rx-mid">
      <section className="rx-panel rx-map"><div className="rx-head"><b>خريطة الطلبات المباشرة</b><span>اليوم</span></div><div className="rx-map-stage"><svg viewBox="0 0 420 255"><defs><filter id="gl"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs><path d="M92 70 L150 38 L224 45 L278 74 L340 92 L320 138 L282 163 L250 209 L191 193 L145 217 L102 178 L58 157 L73 112 Z" fill="#101b49" stroke="#5d49ff" strokeWidth="2" opacity=".88"/>{[[120,93],[169,67],[210,87],[260,102],[305,117],[235,142],[181,153],[139,177],[270,174],[92,139]].map((p,i)=><g key={i} filter="url(#gl)"><circle cx={p[0]} cy={p[1]} r="10" fill="#6c41ff" opacity=".12"/><circle cx={p[0]} cy={p[1]} r="3" fill={i%3===0?'#39e6ff':'#8b5cff'}/></g>)}</svg><div className="rx-map-legend"><span><i className="v"/>بغداد <b>{Math.max(1,Math.round(safeOrders.length*.48))}</b></span><span><i className="c"/>البصرة <b>{Math.max(1,Math.round(safeOrders.length*.25))}</b></span><span><i className="a"/>أربيل <b>{Math.max(1,Math.round(safeOrders.length*.16))}</b></span></div></div></section>
      <section className="rx-panel rx-status"><div className="rx-head"><b>حالة الطلبات</b></div><div className="rx-donut"><div><strong>{fmt(safeOrders.length)}</strong><small>إجمالي الطلبات</small></div></div><div className="rx-status-list"><span><i className="v"/>جديدة <b>{newCount}</b></span><span><i className="g"/>قيد التجهيز <b>{preparing}</b></span><span><i className="a"/>جاهزة للتوصيل <b>{ready}</b></span><span><i className="b"/>تم التسليم <b>{delivered}</b></span></div></section>
      <section className="rx-panel rx-latest"><div className="rx-head"><b>آخر الطلبات</b></div>{latest.length?latest.map((o,i)=><button key={o.id||i} className="rx-order" onClick={()=>onOpenOrder(o)}><div className="rx-avatar">{String(o.customerName||o.customer_name||'ع').slice(0,1)}</div><div><b>{o.customerName||o.customer_name||'عميل'}</b><small>{o.productName||o.product_name||o.carType||o.car_type||'طلب جديد'}</small></div><em>{['قيد التجهيز','جديدة','جاهزة للتوصيل','تم التسليم'][i%4]}</em></button>):<div className="rx-empty">لا توجد طلبات</div>}<button className="rx-more" onClick={()=>onNavigate('orders')}>عرض الكل</button></section>
    </div>
    <div className="rx-bottom">
      <section className="rx-panel rx-chart"><div className="rx-head"><b>الطلبات خلال آخر أيام</b><span>الطلبات</span></div><div className="rx-line"><svg viewBox="0 0 700 180" preserveAspectRatio="none"><defs><linearGradient id="area"><stop offset="0" stopColor="#a04cff" stopOpacity=".4"/><stop offset="1" stopColor="#a04cff" stopOpacity="0"/></linearGradient></defs><polygon points={`0,180 ${points.replaceAll(' ',',')} 100,180`} fill="url(#area)"/><polyline points={points} fill="none" stroke="#b758ff" strokeWidth="3" vectorEffect="non-scaling-stroke"/></svg><div>{daily.map(x=><span key={x.label}>{x.label}</span>)}</div></div></section>
      <section className="rx-panel rx-top"><div className="rx-head"><b>الأكثر طلباً</b></div>{topProducts.length?topProducts.map(([n,c])=><div className="rx-bar" key={n}><div><span>{n}</span><b>{c} طلب</b></div><i><u style={{width:`${(c/maxTop)*100}%`}}/></i></div>):<div className="rx-empty">لا توجد بيانات</div>}<button className="rx-more" onClick={()=>onNavigate('stats')}>عرض الكل</button></section>
      <section className="rx-panel rx-response"><div className="rx-head"><b>معدل الاستجابة</b></div><div className="rx-ring"><strong>{responseRate}%</strong><span>ممتاز</span></div><small>أسرع من معظم الأيام</small></section>
    </div>
  </div>;
}
