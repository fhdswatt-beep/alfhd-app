export default function referenceUiTransform() {
  return {
    name: 'alfhd-approved-reference-ui',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replace(/\\/g,'/').endsWith('/src/App.jsx')) return null;
      let out = code;
      const firstImport = "import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';";
      if (out.includes(firstImport) && !out.includes("./ReferenceHomeView.jsx")) out = out.replace(firstImport, firstImport + "\nimport ReferenceHomeView from './ReferenceHomeView.jsx';");
      if (out.includes(firstImport) && !out.includes("./ApprovedSectionChrome.jsx")) out = out.replace(firstImport, firstImport + "\nimport ApprovedSectionChrome from './ApprovedSectionChrome.jsx';");

      const aiHelper = [
        "async function aiRuntimeControl(action, payload = {}, currentUser = null) {",
        " const userId = currentUser?.id || '';",
        " const userCode = currentUser?.code || '';",
        " if (!userId || !userCode) throw new Error('جلسة المستخدم غير صالحة');",
        " const res = await fetch(SUPABASE_URL + '/functions/v1/ai-runtime-control', {",
        "  method: 'POST',",
        "  headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' },",
        "  body: JSON.stringify({ action, user_id: userId, user_code: userCode, ...payload }),",
        " });",
        " const text = await res.text();",
        " let data = null; try { data = text ? JSON.parse(text) : null; } catch (_e) { data = null; }",
        " if (!res.ok) throw new Error(data?.reason || ('ai-runtime-control failed: ' + res.status));",
        " return data;",
        "}",
        "",
      ].join('\n');
      if (!out.includes('async function aiRuntimeControl(') && out.includes('function fileToBase64(file)')) {
        out = out.replace('function fileToBase64(file)', aiHelper + 'function fileToBase64(file)');
      }
      out = out.replace("const row = await sbRpc('get_ai_runtime_status');", "const row = await aiRuntimeControl('status', {}, currentUser);");
      out = out.replace("const data = await sbRpc('set_ai_runtime', { p_enabled: turnOnAll });", "const data = await aiRuntimeControl('set_runtime', { enabled: turnOnAll }, currentUser);");
      out = out.replace("const data = await sbRpc('set_ai_conversation_enabled', { p_conv: convId, p_enabled: next });", "const data = await aiRuntimeControl('set_conversation', { conversation_id: convId, enabled: next }, currentUser);");

      if (!out.includes("{ id: 'home', label: 'الرئيسية'")) out = out.replace(" const navItems = [", " const navItems = [\n  { id: 'home', label: 'الرئيسية', icon: Home },");
      out = out.replace("{ id: 'stats', label: 'الإحصائيات', icon: BarChart3, permId: 'stats' }", "{ id: 'stats', label: 'التقارير', icon: BarChart3, permId: 'stats' }");
      out = out.replace("const [activeView, setActiveView] = useState('conversations');", "const [activeView, setActiveView] = useState('home');");

      const convMarker = "          {activeView === 'conversations' && (";
      if (out.includes(convMarker) && !out.includes("<ReferenceHomeView")) {
        const home = `          {activeView === 'home' && (\n            <ReferenceHomeView\n              orders={orders}\n              conversations={conversations}\n              currentUser={authedUser}\n              onNavigate={setActiveView}\n              onOpenOrder={(order) => { setPendingOpenOrderId(order.id); setActiveView('orders'); }}\n            />\n          )}\n\n`;
        out = out.replace(convMarker, home + convMarker);
      }

      if (out.includes("const allowed = {\n      conversations:")) out = out.replace("const allowed = {\n      conversations:", "const allowed = {\n      home: true,\n      conversations:");
      out = out.replace("const first = ['conversations', 'orders', 'stats', 'pages', 'users', 'ai_assistant', 'warehouse']", "const first = ['home', 'conversations', 'orders', 'stats', 'pages', 'users', 'ai_assistant', 'warehouse']");

      out = out.replace('<aside style={styles.sidebar} className="alfhd-no-print">', '<aside style={styles.sidebar} className="alfhd-no-print alfhd-sidebar">');
      out = out.replace('<header style={styles.mobileHeader} className="alfhd-no-print">', '<header style={styles.mobileHeader} className="alfhd-no-print alfhd-topbar">');
      out = out.replace('<nav style={styles.bottomNav} className="alfhd-no-print">', '<nav style={styles.bottomNav} className="alfhd-no-print alfhd-bottom-nav">');
      out = out.replace('className={`alfhd-main-area${activeView === \'conversations\' ? \' alfhd-main-conv\' : \'\'}`}', 'className={`alfhd-main-area alfhd-main alfhd-view-${activeView}${activeView === \'conversations\' ? \' alfhd-main-conv\' : \'\'}`}');
      out = out.replace('className="orders-v2"', 'className="orders-v2 approved-orders-view"');
      out = out.replace('className="alfhd-conv-fullscreen"', 'className="alfhd-conv-fullscreen approved-conversations-view"');

      const sectionRoot = '<div key={activeView} className="alfhd-section-enter">';
      if (out.includes(sectionRoot) && !out.includes('<ApprovedSectionChrome')) {
        out = out.replace(sectionRoot, `${sectionRoot}\n            <ApprovedSectionChrome view={activeView} orders={orders} conversations={conversations} pages={pages} currentUser={authedUser} />`);
      }

      function functionBounds(name) {
        const start = out.indexOf(`function ${name}`); if (start < 0) return null;
        const brace = out.indexOf('{', start); if (brace < 0) return null;
        let depth=0, quote=null, esc=false, line=false, block=false;
        for(let i=brace;i<out.length;i++){const c=out[i],n=out[i+1];if(line){if(c==='\n')line=false;continue;}if(block){if(c==='*'&&n==='/'){block=false;i++;}continue;}if(quote){if(esc){esc=false;continue;}if(c==='\\'){esc=true;continue;}if(c===quote)quote=null;continue;}if(c==='/'&&n==='/'){line=true;i++;continue;}if(c==='/'&&n==='*'){block=true;i++;continue;}if(c==='"'||c==="'"||c==='`'){quote=c;continue;}if(c==='{')depth++;if(c==='}'){depth--;if(depth===0)return{start,brace,end:i+1};}}
        return null;
      }
      function rebuildView(name,key,title,subtitle){
        const b=functionBounds(name); if(!b)return; let body=out.slice(b.brace,b.end); if(body.includes(`data-approved-view=\"${key}\"`))return;
        const r=body.lastIndexOf('return ('); if(r<0)return; const root=body.indexOf('<div',r); if(root<0)return; const rootEnd=body.indexOf('>',root); if(rootEnd<0)return;
        const open=body.slice(root,rootEnd+1); const marked=open.replace('<div',`<div data-approved-view=\"${key}\"`);
        const hero=`\n      <section className=\"approved-native-hero\"><div className=\"approved-native-hero-copy\"><span className=\"approved-native-kicker\">ALFHD CONTROL CENTER</span><h2>${title}</h2><p>${subtitle}</p></div><div className=\"approved-native-signal\"><i></i><span>مباشر</span></div></section>`;
        body=body.slice(0,root)+marked+hero+body.slice(rootEnd+1); out=out.slice(0,b.brace)+body+out.slice(b.end);
      }
      rebuildView('WarehouseView','warehouse','المخزن','إدارة المنتجات والمبيعات والديون والموردين من مساحة تشغيل واحدة');
      rebuildView('StatsView','stats','التقارير','قراءة فورية للأداء والحركة التشغيلية والنتائج');
      rebuildView('UsersView','users','الموظفون','إدارة الفريق والصلاحيات والحسابات ضمن نفس النظام');
      rebuildView('PagesView','pages','الصفحات','إدارة قنوات التواصل والصفحات المرتبطة بالنظام');
      rebuildView('AiAssistantView','ai','الذكاء','التحكم بالمساعد والردود والسلوك الذكي من لوحة موحدة');

      const whViews=[['WhDashboard','dashboard'],['WhProducts','products'],['WhSales','sales'],['WhSuppliers','suppliers'],['WhDebts','debts'],['WhEmployees','employees'],['WhReports','reports']];
      for(const [name,key] of whViews){
        const b=functionBounds(name); if(!b)continue; let body=out.slice(b.brace,b.end); if(body.includes(`data-wh-view=\"${key}\"`))continue;
        const r=body.lastIndexOf('return(')>=0?body.lastIndexOf('return('):body.lastIndexOf('return ('); if(r<0)continue; const root=body.indexOf('<div',r); if(root<0)continue; const rootEnd=body.indexOf('>',root); if(rootEnd<0)continue;
        const open=body.slice(root,rootEnd+1); const marked=open.replace('<div',`<div data-wh-view=\"${key}\"`); body=body.slice(0,root)+marked+body.slice(rootEnd+1); out=out.slice(0,b.brace)+body+out.slice(b.end);
      }

      return { code: out, map: null };
    }
  };
}
