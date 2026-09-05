# Approved UI Integration + AI Runtime Control Design

## Goal
Bring the approved `backup-ui-2026-09-06` visual system onto the production app while preserving the data-connected `main` business logic, and restore a working AI runtime toggle without exposing privileged database RPCs directly to anonymous callers.

## Architecture
- Keep `main` as the source of truth for application data access and business logic.
- Reuse the approved visual layer from `backup-ui-2026-09-06`: Vite transform, section chrome component, CSS layers, and orders presentation changes that do not alter data/RPC behavior.
- Route AI runtime status/toggle/conversation-toggle requests through a dedicated `ai-runtime-control` Edge Function. The function performs custom user verification against the existing app user record, verifies admin/`ai_manage` permission, then invokes the existing protected RPCs with service-role privileges.
- Do not grant `anon` or `authenticated` direct EXECUTE on the privileged AI-control RPCs.

## Data Flow
1. React calls `aiRuntimeControl(action, payload, currentUser)`.
2. Edge Function validates `user_id`, `user_code`, active status, and admin/`ai_manage` permission.
3. Function calls one of `get_ai_runtime_status`, `set_ai_runtime`, or `set_ai_conversation_enabled` via the service role.
4. UI updates local runtime state from the returned JSON.

## UI Integration
- Copy all approved CSS/component assets from the preserved UI branch.
- Use the approved Vite transform to add home/chrome/view markers without rewriting core data-fetching functions.
- Retain `App.jsx` business logic; apply only the approved OrdersView presentation patch after verifying it does not remove data loading/actions.

## Verification
- Build and lint must pass.
- Edge Function must reject invalid users and allow an admin.
- AI status request must return a non-null scope.
- Global AI button must no longer remain disabled due to status-fetch permission failure.
- Production deployment must report success before completion is claimed.
