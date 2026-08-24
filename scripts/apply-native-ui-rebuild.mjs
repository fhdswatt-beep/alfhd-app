import fs from 'node:fs';

const path = 'src/App.jsx';
let src = fs.readFileSync(path, 'utf8');

if (src.includes('className="orders-v2"')) {
  console.log('Orders V2 already applied');
  process.exit(0);
}

const start = `  return (\n    <div style={styles.viewWrap}>\n      {/* ── هيدر الطلبات ── */}\n`;
const end = `\n      {!isDelivery && (`;
const startAt = src.indexOf(start, src.indexOf(`const isDelivery = section === 'delivery';`));
const endAt = src.indexOf(end, startAt);
if (startAt < 0 || endAt < 0) throw new Error('Orders header markers not found');

const rebuilt = `  return (\n    <div style={styles.viewWrap} className="orders-v2">\n      <section className="orders-v2-hero alfhd-no-print">\n        <div>\n          <h2 className="orders-v2-title">الطلبات</h2>\n          <p className="orders-v2-subtitle">مركز تشغيل موحّد للطباعة والتجهيز والتوصيل — بنفس بيانات ووظائف النظام الحالية</p>\n          <div className="orders-v2-kpis">\n            {[\n              { label: 'طلبات اليوم', value: todayStats.total, color: '#6D7CFF' },\n              { label: 'طُبعت اليوم', value: todayStats.printed, color: '#F0A868' },\n              { label: 'سُلّمت اليوم', value: todayStats.delivered, color: '#55E6A5' },\n              { label: 'رواجع اليوم', value: todayStats.returned, color: '#F45B69' },\n            ].map((s) => (\n              <div className="orders-v2-kpi" key={s.label}>\n                <strong style={{ color: s.color }}>{s.value}</strong>\n                <span>{s.label}</span>\n              </div>\n            ))}\n          </div>\n        </div>\n\n        <div className="orders-v2-actions">\n          <div className="orders-v2-search">\n            <Search size={14} color="#8F98AA" />\n            <input value={globalOrderSearch} onChange={(e) => setGlobalOrderSearch(e.target.value)} placeholder="بحث سريع..." />\n            {globalOrderSearch.trim().length >= 2 && (\n              <div style={styles.globalOrderResultsBox}>\n                {globalOrderResults.length === 0 ? (\n                  <div style={styles.globalOrderEmpty}>لا توجد نتائج</div>\n                ) : globalOrderResults.map((o) => {\n                  const page = pages.find((p) => p.id === o.pageId);\n                  return (\n                    <button key={o.id} onClick={() => openOrderFromGlobalSearch(o)} style={styles.globalOrderResultItem}>\n                      <div style={{ minWidth: 0, flex: 1 }}>\n                        <div style={styles.globalOrderResultTitle}>{o.customer || 'بدون اسم'} <span>#{o.orderNo}</span></div>\n                        <div style={styles.globalOrderResultMeta}>{page?.name || 'بدون صفحة'} · {o.phone || 'بدون هاتف'}</div>\n                      </div>\n                      <OrderStagePill order={o} />\n                    </button>\n                  );\n                })}\n              </div>\n            )}\n          </div>\n          <input type="file" accept="image/*" ref={ocrInputRef} onChange={handlePickOcrImage} style={{ display: 'none' }} />\n          <button className="orders-v2-action" onClick={() => ocrInputRef.current?.click()} disabled={ocrLoading}>\n            {ocrLoading ? <RefreshCw size={14} /> : <Image size={14} />}\n            {ocrLoading ? 'جارٍ الاستخراج...' : 'إضافة بصورة'}\n          </button>\n          <button className="orders-v2-action primary" onClick={startNewOrder}><Plus size={15} /> طلب جديد</button>\n          {isReady && (\n            <button className="orders-v2-action success" onClick={handlePrintReady}><Printer size={15} /> طباعة الكل ({stageOrders.length})</button>\n          )}\n          <button className="orders-v2-action" onClick={() => setBatchHistoryOpen(true)} title="سجل الطباعة"><Clock size={16} /> سجل الطباعة</button>\n        </div>\n      </section>\n\n      <nav className="orders-v2-stagebar alfhd-no-print" aria-label="مراحل الطلبات">\n        {ORDER_STAGES.map((st) => (\n          <button key={st.id} onClick={() => { setSection(st.id); setStatusFilter('all'); }} className={\`orders-v2-stage \${section === st.id ? 'active' : ''}\`}>\n            <span>{st.label}</span>\n            {st.id !== 'delivery' && <span className="orders-v2-count">{stageCounts[st.id]}</span>}\n          </button>\n        ))}\n      </nav>\n`;

src = src.slice(0, startAt) + rebuilt + src.slice(endAt);

const tabsStart = src.indexOf(`      <div style={styles.sectionTabs} className="alfhd-no-print">`, startAt);
const filtersMarker = `\n      <OrderFilters`;
const tabsEnd = src.indexOf(filtersMarker, tabsStart);
if (tabsStart < 0 || tabsEnd < 0) throw new Error('Legacy orders tabs markers not found');
src = src.slice(0, tabsStart) + src.slice(tabsEnd + 1);

fs.writeFileSync(path, src);
console.log('Applied native Orders V2 JSX rebuild');
