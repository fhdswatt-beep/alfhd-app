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
    'stats_delivery_pending',
    "const pending = operational.filter((o) => o.status === 'pending');",
    "const pending = operational.filter((o) => o.status === 'pending' && o.stage === 'delivery');",
)

replace_once(
    'best_sellers_delivered_only',
    """  const bestSellers = useMemo(() => {\n    const counts = {};\n    scopedOrders.forEach((o) => {\n      const key = (o.orderType || '').trim();\n      if (!key) return;\n      counts[key] = (counts[key] || 0) + 1;\n    });\n    return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);\n  }, [scopedOrders]);""",
    """  const bestSellers = useMemo(() => {\n    // الأكثر مبيعاً = طلبات مسلّمة فعلياً فقط؛ المعلّق والراجع لا يدخلان في ترتيب المبيعات.\n    const counts = {};\n    scopedOrders.filter((o) => !o.converted && o.status === 'delivered').forEach((o) => {\n      const key = (o.orderType || '').trim();\n      if (!key) return;\n      counts[key] = (counts[key] || 0) + 1;\n    });\n    return Object.entries(counts).map(([type, count]) => ({ type, count })).sort((a, b) => b.count - a.count);\n  }, [scopedOrders]);""",
)

replace_once(
    'view_wrap_no_transform',
    "viewWrap: { animation: 'alfhdFadeOnly 0.18s ease both', maxWidth: 1480, margin: '0 auto', padding: '16px 20px' },",
    "viewWrap: { maxWidth: 1480, margin: '0 auto', padding: '16px 20px', animation: 'none', transform: 'none', willChange: 'auto' },",
)

replace_once(
    'section_transition_no_transform',
    """      /* انتقال ناعم بين الأقسام */\n      @keyframes sectionFade {\n        0%   { opacity: 0; transform: translateX(12px); }\n        100% { opacity: 1; transform: translateX(0); }\n      }\n      .alfhd-section-enter { animation: sectionFade 0.35s var(--ease-tg-out) both; }\n      /* مهم: الـ transform (حتى الصفري) يكسر position:fixed للعناصر الداخلية.\n         على الموبايل نستخدم تلاشي بلا حركة حتى تشتغل شاشة المحادثة الكاملة صح. */\n      @keyframes alfhdFadeOnly { from { opacity: 0; } to { opacity: 1; } }\n      @media (max-width: 860px) {\n        .alfhd-section-enter {\n          animation: alfhdFadeOnly 0.25s ease both !important;\n          transform: none !important;\n        }\n      }""",
    """      /* انتقال آمن بين الأقسام: بدون transform حتى تبقى النوافذ fixed بالنسبة للشاشة. */\n      @keyframes sectionFade { from { opacity: 0; } to { opacity: 1; } }\n      @keyframes alfhdFadeOnly { from { opacity: 0; } to { opacity: 1; } }\n      .alfhd-section-enter {\n        animation: sectionFade 0.22s ease both;\n        transform: none !important;\n        will-change: opacity;\n      }""",
)

replace_once(
    'modal_viewport_isolation',
    "modalOverlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '12px', overflow: 'hidden' },",
    "modalOverlay: { position: 'fixed', inset: 0, width: '100vw', height: '100dvh', background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '12px', overflow: 'hidden', isolation: 'isolate' },",
)

replace_once(
    'scroll_restore_stability',
    """    requestAnimationFrame(() => requestAnimationFrame(apply));\n    setTimeout(apply, 80);""",
    """    requestAnimationFrame(() => requestAnimationFrame(apply));\n    setTimeout(apply, 60);\n    setTimeout(apply, 180);""",
)

replace_once(
    'direct_order_edit',
    """          <button onClick={() => { rememberOrdersScroll(); setDetailOrder(o); }} style={{ ...styles.orderActionBtn, flex: 1.6 }} title=\"عرض التفاصيل\">\n            <Eye size={14} /> <span style={{ fontSize: 12, fontWeight: 700 }}>التفاصيل</span>\n          </button>""",
    """          <button onClick={() => { rememberOrdersScroll(); setDetailOrder(o); }} style={{ ...styles.orderActionBtn, flex: 1.4 }} title=\"عرض التفاصيل\">\n            <Eye size={14} /> <span style={{ fontSize: 12, fontWeight: 700 }}>التفاصيل</span>\n          </button>\n          <button onClick={() => startEditOrder(o)} style={{ ...styles.orderActionBtn, flex: 1.2, color: '#4C8DFF', borderColor: 'rgba(76,141,255,0.25)' }} title=\"تعديل الطلب مباشرة\">\n            <Edit3 size={14} /> <span style={{ fontSize: 12, fontWeight: 700 }}>تعديل</span>\n          </button>""",
)

# Normalize monetary sums so a string value can never concatenate into the total.
if "reduce((s, o) => s + o.total, 0)" in text:
    text = text.replace("reduce((s, o) => s + o.total, 0)", "reduce((s, o) => s + (Number(o.total) || 0), 0)")
    changes.append('numeric_revenue_sums')

if changes:
    APP.write_text(text, encoding='utf-8')
    print('Applied:', ', '.join(changes))
else:
    print('Foundation rehabilitation already applied; no changes needed.')
