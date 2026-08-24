export default function referenceUiTransform() {
  return {
    name: 'alfhd-approved-reference-ui',
    enforce: 'pre',
    transform(code, id) {
      if (!id.replace(/\\/g,'/').endsWith('/src/App.jsx')) return null;
      let out = code;
      const firstImport = "import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';";
      if (out.includes(firstImport) && !out.includes("./ReferenceHomeView.jsx")) {
        out = out.replace(firstImport, firstImport + "\nimport ReferenceHomeView from './ReferenceHomeView.jsx';");
      }
      const oldNav = ` const navItems = [\n  { id: 'conversations', label: 'المحادثات', icon: MessageSquare, permId: 'conversations' },\n  { id: 'orders', label: 'الطلبات', icon: Package, anyPerm: ['orders_view', 'orders_edit'] },\n  { id: 'stats', label: 'الإحصائيات', icon: BarChart3, permId: 'stats' },\n  { id: 'warehouse', label: 'المخزن', icon: Warehouse, adminOnly: true },\n ];`;
      const newNav = ` const navItems = [\n  { id: 'home', label: 'الرئيسية', icon: Home },\n  { id: 'conversations', label: 'المحادثات', icon: MessageSquare, permId: 'conversations' },\n  { id: 'orders', label: 'الطلبات', icon: Package, anyPerm: ['orders_view', 'orders_edit'] },\n  { id: 'warehouse', label: 'المخزن', icon: Warehouse, adminOnly: true },\n  { id: 'stats', label: 'التقارير', icon: BarChart3, permId: 'stats' },\n ];`;
      if (out.includes(oldNav)) out = out.replace(oldNav, newNav);
      out = out.replace("const [activeView, setActiveView] = useState('conversations');", "const [activeView, setActiveView] = useState('home');");
      const convMarker = "          {activeView === 'conversations' && hasPermission('conversations') && (";
      if (out.includes(convMarker) && !out.includes("<ReferenceHomeView")) {
        const home = `          {activeView === 'home' && (\n            <ReferenceHomeView\n              orders={orders}\n              conversations={conversations}\n              currentUser={authedUser}\n              onNavigate={setActiveView}\n              onOpenOrder={(order) => { setPendingOpenOrderId(order.id); setActiveView('orders'); }}\n            />\n          )}\n`;
        out = out.replace(convMarker, home + convMarker);
      }
      if (out.includes("const allowed = {\n      conversations:")) out = out.replace("const allowed = {\n      conversations:", "const allowed = {\n      home: true,\n      conversations:");
      out = out.replace("const first = ['conversations', 'orders', 'stats', 'pages', 'users', 'ai_assistant', 'warehouse']", "const first = ['home', 'conversations', 'orders', 'stats', 'pages', 'users', 'ai_assistant', 'warehouse']");
      return { code: out, map: null };
    }
  };
}
