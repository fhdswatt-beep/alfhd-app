export default function referenceUiTransform() {
  return {
    name: 'alfhd-approved-reference-ui',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replace(/\\/g,'/').endsWith('/src/App.jsx')) return null;
      let out = code;
      const firstImport = "import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';";
      if (out.includes(firstImport) && !out.includes("./ReferenceHomeView.jsx")) out = out.replace(firstImport, firstImport + "\nimport ReferenceHomeView from './ReferenceHomeView.jsx';");

      // Add Home without depending on the exact historical nav array formatting.
      if (!out.includes("{ id: 'home', label: 'الرئيسية'")) {
        out = out.replace(" const navItems = [", " const navItems = [\n  { id: 'home', label: 'الرئيسية', icon: Home },");
      }
      out = out.replace("{ id: 'stats', label: 'الإحصائيات', icon: BarChart3, permId: 'stats' }", "{ id: 'stats', label: 'التقارير', icon: BarChart3, permId: 'stats' }");
      out = out.replace("const [activeView, setActiveView] = useState('conversations');", "const [activeView, setActiveView] = useState('home');");

      // The production App renders conversations without a permission clause here.
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
      out = out.replace('className={`alfhd-main-area${activeView === \'conversations\' ? \' alfhd-main-conv\' : \'\'}`}', 'className={`alfhd-main-area alfhd-main${activeView === \'conversations\' ? \' alfhd-main-conv\' : \'\'}`}');
      return { code: out, map: null };
    }
  };
}
