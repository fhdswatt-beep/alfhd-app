# Native Full UI Rebuild — Design

## Goal
Rebuild every visible section of the existing alfhd app from the inside out while preserving the exact existing business functions, data sources, state transitions, handlers, permissions, printing flows, Jenni integration, conversations, warehouse operations, sales/debts/employees/pages/AI/stats/settings behavior.

## Non-negotiable constraints
- No parallel shell over `App.jsx`.
- No replacement Supabase client or alternate data loading path.
- No auth/RLS/session changes as part of UI work.
- Existing state, handlers, mutations, filters, printing and external integrations remain the source of truth.
- UI can move/recompose controls, but an existing function cannot disappear.
- New UI must render real existing data, not mock or duplicated data.
- Mobile and desktop are first-class.
- Publish through GitHub `main`; Vercel deploys automatically.

## Visual direction
Dark premium application UI inspired by the previously approved Rive-like direction: deep graphite surfaces, restrained blue/violet glow, strong information hierarchy, dense but calm operational cards, tactile controls, rounded layered panels, subtle motion, clear status colors, and mobile-native navigation behavior.

## Architecture
Keep `App.jsx` as the business/state owner. Rebuild visible JSX section-by-section using native view structures that call the same existing handlers and consume the same existing state. Shared visual tokens/classes live in `src/native-ui-v2.css`; they do not create a second data or application layer.

## Functional parity rule
Before replacing a section, inventory every visible action and conditional action in the legacy section. The replacement must map each action to the same handler. A section is not complete until its parity checklist is satisfied.

## Delivery order
1. Orders: header, stage navigation, filters, cards, prep/delivery states, details/actions.
2. Conversations: list, tabs, search, thread, composer, customer/order context.
3. Warehouse: products, variants/colors/seats, stock operations, suppliers.
4. Sales, debts, employees and salary flows.
5. Pages, AI, statistics and settings.
6. Global shell/navigation, modals, empty/loading/error states, responsive polish.

## Verification
For every section: production build must pass; existing handlers remain referenced; real data remains visible; primary and conditional actions remain reachable; no new data/auth layer is introduced. Only then merge/publish.