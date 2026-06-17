# AI Agent Project Instructions

## What this project is
- A React + TypeScript app built with **TanStack Start** and **Vite**.
- Uses **TanStack React Router**, **React Query**, and Supabase for backend integration.
- Uses file-based routing in `src/routes/`, with `src/routes/__root.tsx` as the app shell.
- Uses `.server.ts` and server functions for server-only logic.

## Important conventions
- `src/routes/` is the routing source. Do not add `src/pages/`, `app/layout.tsx`, or other Next.js/Remix conventions.
- `src/routeTree.gen.ts` is auto-generated. Do not edit it.
- `src/server.ts` wraps the TanStack Start server entry and normalizes SSR error responses.
- The `.server.ts` suffix marks a module as server-only. These files should not be bundled into client code.
- Server-rendered logic and secure secrets must stay on the server.

## Server / Supabase conventions
- `src/integrations/supabase/client.ts` is the public Supabase client for browser-safe interactions.
- `src/integrations/supabase/client.server.ts` is the admin Supabase client with `SUPABASE_SERVICE_ROLE_KEY`; use it only from server-side code.
- Server functions are created with `createServerFn` in files such as `src/lib/signup.functions.ts`, `src/lib/admin.functions.ts`, `src/lib/subscription.functions.ts`, and `src/lib/generate.functions.ts`.
- `src/lib/config.server.ts` demonstrates server-only environment access patterns.

## Build and validation commands
- `npm run dev` / `bun run dev` — start development server.
- `npm run build` — production build.
- `npm run preview` — preview the built app.
- `npm run lint` — run ESLint.
- `npm run format` — run Prettier.
- `bun run scripts/security-tests.ts` — run security/RLS/endpoint checks described in `scripts/SECURITY.md`.

## Key files to read first
- `src/routes/README.md` — file-based routing conventions for TanStack Start.
- `scripts/SECURITY.md` — security and runtime guidance for env vars, DB protection, and endpoint checks.
- `vite.config.ts` — uses `@lovable.dev/vite-tanstack-config`; do not duplicate the bundled plugin list.
- `src/routes/__root.tsx` — root layout and error handling for the React router.
- `src/server.ts` — server entry wrapper.

## What to avoid
- Editing generated files like `src/routeTree.gen.ts`.
- Moving route conventions to another framework style.
- Exposing secrets by writing or importing server-only values into client bundles.

## Useful notes for agents
- Preserve existing patterns unless there is a clear bug or security issue.
- If changing routing or server-loading behavior, verify with `npm run build` and `bun run scripts/security-tests.ts`.
- Link to existing docs rather than repeating them.
