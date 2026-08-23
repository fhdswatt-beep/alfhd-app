from pathlib import Path

APP = Path('src/App.jsx')
text = APP.read_text(encoding='utf-8')
changes = []


def replace_once(name: str, before: str, after: str) -> None:
    global text
    if after in text:
        return
    if before not in text:
        raise SystemExit(f'Cannot apply {name}: expected source pattern not found')
    text = text.replace(before, after, 1)
    changes.append(name)


replace_once(
    'scroll_restore_stability',
    """  function restoreOrdersScroll() {\n    let pos = ordersScrollPosRef.current || 0;\n    try { pos = Number(sessionStorage.getItem(ORDERS_SCROLL_KEY) || pos) || 0; } catch (_e) {}\n    requestAnimationFrame(() => {\n      const mainEl = document.querySelector('.alfhd-main-area');\n      if (mainEl) mainEl.scrollTop = pos;\n      else window.scrollTo(0, pos);\n    });\n  }""",
    """  function restoreOrdersScroll() {\n    let pos = ordersScrollPosRef.current || 0;\n    try { pos = Number(sessionStorage.getItem(ORDERS_SCROLL_KEY) || pos) || 0; } catch (_e) {}\n    const apply = () => {\n      const mainEl = document.querySelector('.alfhd-main-area');\n      if (mainEl) mainEl.scrollTop = pos;\n      else window.scrollTo(0, pos);\n    };\n    requestAnimationFrame(() => requestAnimationFrame(apply));\n    setTimeout(apply, 60);\n    setTimeout(apply, 180);\n  }""",
)

replace_once(
    'direct_order_edit',
    """        <div style={styles.orderCardActions} className=\"alfhd-no-print\">\n          <button onClick={() => { rememberOrdersScroll(); setDetailOrder(o); }} style={{ ...styles.orderActionBtn, flex: 1.6 }} title=\"عرض التفاصيل\">\n            <Eye size={14} /> <span style={{ fontSize: 12, fontWeight: 700 }}>التفاصيل</span>\n          </button>""",
    """        <div style={styles.orderCardActions} className=\"alfhd-no-print\">\n          <button onClick={() => { rememberOrdersScroll(); setDetailOrder(o); }} style={{ ...styles.orderActionBtn, flex: 1.4 }} title=\"عرض التفاصيل\">\n            <Eye size={14} /> <span style={{ fontSize: 12, fontWeight: 700 }}>التفاصيل</span>\n          </button>\n          <button onClick={() => startEditOrder(o)} style={{ ...styles.orderActionBtn, flex: 1.2, color: '#4C8DFF', borderColor: 'rgba(76,141,255,0.25)' }} title=\"تعديل الطلب مباشرة\">\n            <Edit3 size={14} /> <span style={{ fontSize: 12, fontWeight: 700 }}>تعديل</span>\n          </button>""",
)

replace_once(
    'stats_source_classification',
    """  const breakdown = useMemo(() => {\n    const converted = scopedOrders.filter((o) => o.converted);\n    const fromChat = scopedOrders.filter((o) => !o.converted && o.source === 'chat');\n    const manual = scopedOrders.filter((o) => !o.converted && o.source !== 'chat');""",
    """  const breakdown = useMemo(() => {\n    const converted = scopedOrders.filter((o) => o.converted);\n    const fromChat = scopedOrders.filter((o) => !o.converted && o.source === 'chat');\n    const manual = scopedOrders.filter((o) => !o.converted && o.source === 'manual');\n    const automated = scopedOrders.filter((o) => !o.converted && o.source === 'ai');""",
)

replace_once(
    'stats_automated_result',
    """      manual: manual.length,\n      external: scopedExtCount,""",
    """      manual: manual.length,\n      automated: automated.length,\n      external: scopedExtCount,""",
)

replace_once(
    'overall_stats',
    """  const overall = useMemo(() => {\n    const delivered = scopedOrders.filter((o) => o.status === 'delivered');\n    const pending = scopedOrders.filter((o) => o.status === 'pending');\n    const returned = scopedOrders.filter((o) => o.status === 'returned');\n    const revenue = delivered.reduce((s, o) => s + o.total, 0);\n    const deliveryRate = scopedOrders.length ? Math.round((delivered.length / scopedOrders.length) * 100) : 0;\n    const returnRate = scopedOrders.length ? Math.round((returned.length / scopedOrders.length) * 100) : 0;\n    return { delivered: delivered.length, pending: pending.length, returned: returned.length, revenue, deliveryRate, returnRate };\n  }, [scopedOrders]);""",
    """  const overall = useMemo(() => {\n    const operational = scopedOrders.filter((o) => !o.converted);\n    const delivered = operational.filter((o) => o.status === 'delivered');\n    const pending = operational.filter((o) => o.status === 'pending' && o.stage === 'delivery');\n    const returned = operational.filter((o) => o.status === 'returned');\n    const revenue = delivered.reduce((s, o) => s + (Number(o.total) || 0), 0);\n    const completed = delivered.length + returned.length;\n    const deliveryRate = completed ? Math.round((delivered.length / completed) * 100) : 0;\n    const returnRate = completed ? Math.round((returned.length / completed) * 100) : 0;\n    return { delivered: delivered.length, pending: pending.length, returned: returned.length, revenue, deliveryRate, returnRate };\n  }, [scopedOrders]);""",
)

replace_once(
    'summary_stats',
    """  const summary = useMemo(() => {\n    const booked = scopedOrders;\n    const converted = scopedOrders.filter((o) => o.converted);\n    const sentToCompany = scopedOrders.filter((o) => o.stage === 'delivery');\n    const sortingC = sentToCompany.filter((o) => o.deliveryStatus === 'sorting' || (!o.deliveryStatus && o.status === 'pending'));\n    const deliveredC = sentToCompany.filter((o) => o.status === 'delivered');\n    const returnedC = sentToCompany.filter((o) => o.status === 'returned');\n    const neglected = scopedOrders.filter((o) => o.printed && !o.converted && o.stage !== 'delivery');""",
    """  const summary = useMemo(() => {\n    const booked = scopedOrders;\n    const converted = scopedOrders.filter((o) => o.converted);\n    const operational = scopedOrders.filter((o) => !o.converted);\n    const sentToCompany = operational.filter((o) => o.jenniSent || o.jenniShipmentId || o.stage === 'delivery');\n    const sortingC = sentToCompany.filter((o) => o.status === 'pending' && o.stage === 'delivery');\n    const deliveredC = sentToCompany.filter((o) => o.status === 'delivered');\n    const returnedC = sentToCompany.filter((o) => o.status === 'returned');\n    const THREE_DAYS = 3 * 86400000;\n    const neglected = operational.filter((o) => {\n      if (o.stage !== 'prep' && o.stage !== 'delivery') return false;\n      if (o.deliveryStep || o.deliveryStatus) return false;\n      const ref = o.deliveryUpdatedAt || o.printedAt || o.createdAt || o.date;\n      return ref && (Date.now() - new Date(ref).getTime()) > THREE_DAYS;\n    });""",
)

replace_once(
    'best_sellers_delivered_only',
    """  const bestSellers = useMemo(() => {\n    const counts = {};\n    scopedOrders.forEach((o) => {\n      const key = (o.orderType || '').trim();\n      if (!key) return;\n      counts[key] = (counts[key] || 0) + 1;\n    });\n    return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);\n  }, [scopedOrders]);""",
    """  const bestSellers = useMemo(() => {\n    const counts = {};\n    scopedOrders.filter((o) => !o.converted && o.status === 'delivered').forEach((o) => {\n      const key = (o.orderType || '').trim();\n      if (!key) return;\n      counts[key] = (counts[key] || 0) + 1;\n    });\n    return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);\n  }, [scopedOrders]);""",
)

replace_once(
    'stats_ai_card',
    """        <StatCard icon={Edit3} label=\"مضافة يدوياً\" value={breakdown.manual} color=\"#4ADE80\" />\n        <StatCard icon={Send} label=\"طلبات محوّلة\" value={breakdown.converted} color=\"#A78BFA\" />""",
    """        <StatCard icon={Edit3} label=\"مضافة يدوياً\" value={breakdown.manual} color=\"#4ADE80\" />\n        <StatCard icon={Bot} label=\"من الذكاء\" value={breakdown.automated} color=\"#60A5FA\" />\n        <StatCard icon={Send} label=\"طلبات محوّلة\" value={breakdown.converted} color=\"#A78BFA\" />""",
)

replace_once(
    'view_wrap_no_transform',
    """  viewWrap: { animation: 'fadeUp 0.24s var(--ease-bounce) both', maxWidth: 1480, margin: '0 auto', padding: '16px 20px', willChange: 'opacity, transform' },""",
    """  viewWrap: { maxWidth: 1480, margin: '0 auto', padding: '16px 20px', animation: 'none', transform: 'none', willChange: 'auto' },""",
)

replace_once(
    'section_transition_no_transform',
    """      /* انتقال ناعم بين الأقسام */\n      @keyframes sectionFade {\n        0%   { opacity: 0; transform: translateX(12px); }\n        100% { opacity: 1; transform: translateX(0); }\n      }\n      .alfhd-section-enter { animation: sectionFade 0.35s var(--ease-tg-out) both; }\n      /* مهم: الـ transform (حتى الصفري) يكسر position:fixed للعناصر الداخلية.\n         على الموبايل نستخدم تلاشي بلا حركة حتى تشتغل شاشة المحادثة الكاملة صح. */\n      @keyframes alfhdFadeOnly { from { opacity: 0; } to { opacity: 1; } }\n      @media (max-width: 860px) {\n        .alfhd-section-enter {\n          animation: alfhdFadeOnly 0.25s ease both !important;\n          transform: none !important;\n        }\n      }""",
    """      /* انتقال آمن بين الأقسام: opacity فقط حتى لا ينكسر position:fixed للمودالات. */\n      @keyframes sectionFade { from { opacity: 0; } to { opacity: 1; } }\n      @keyframes alfhdFadeOnly { from { opacity: 0; } to { opacity: 1; } }\n      .alfhd-section-enter {\n        animation: sectionFade 0.22s ease both;\n        transform: none !important;\n        will-change: opacity;\n      }""",
)

replace_once(
    'modal_viewport_isolation',
    """  modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px', overflow: 'hidden' },""",
    """  modalOverlay: { position: 'fixed', inset: 0, width: '100vw', height: '100dvh', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '12px', overflow: 'hidden', isolation: 'isolate' },""",
)

# Normalize all simple revenue sums so string totals cannot concatenate.
if "reduce((s, o) => s + o.total, 0)" in text:
    text = text.replace("reduce((s, o) => s + o.total, 0)", "reduce((s, o) => s + (Number(o.total) || 0), 0)")
    changes.append('numeric_revenue_sums')

if changes:
    APP.write_text(text, encoding='utf-8')
    print('Applied:', ', '.join(changes))
else:
    print('Foundation rehabilitation already applied; no changes needed.')
