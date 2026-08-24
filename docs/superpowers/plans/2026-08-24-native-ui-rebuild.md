# Native UI Rebuild Implementation Plan

## Strategy
Use deterministic, reviewable transformations against `App.jsx` rather than replacing its data/business layer. Each phase changes visible JSX and shared presentation only.

### Phase 1 — Orders native rebuild
- Inventory all order actions from current JSX.
- Recompose orders header/action center/stage navigation into a premium command surface.
- Preserve handlers: `startNewOrder`, OCR picker, global search, print-all, batch history, stage/status filters.
- Preserve `renderOrderCard` action handlers and all prep/delivery conditional controls.
- Add responsive native UI stylesheet scoped to the rebuilt orders view.
- Build and verify.

### Phase 2 — Conversations
- Inventory tabs/search/thread/composer/order-context actions.
- Rebuild list/thread split view and mobile drill-in using the same conversation/message state and handlers.
- Build and verify.

### Phase 3 — Warehouse
- Inventory product/stock/color/seat/supplier actions.
- Rebuild product inventory and detail flows with same warehouse handlers.
- Build and verify.

### Phase 4 — Operational modules
- Sales, debts, employees, salary payments, suppliers.
- Preserve all create/edit/delete/payment actions.

### Phase 5 — Pages/AI/stats/settings
- Rebuild remaining administrative views with exact functional parity.

### Phase 6 — Global polish
- Unify modals/forms/toasts/loading/empty/error states.
- Responsive QA and production build.

## Safety
No Supabase schema, RLS, auth, session, data migration, or alternate fetching work is permitted in this plan.