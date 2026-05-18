# TableTop — Restaurant Food Ordering App

A full-stack restaurant food ordering app with three user roles: superadmin, admin, and user. Customers browse the menu, add items to cart, checkout, and track orders. Admins manage the menu and orders. Superadmins manage user roles.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter (routing) + TanStack Query + Tailwind CSS
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- UI components: shadcn/ui

## Where things live

- `lib/api-spec/openapi.yaml` — source-of-truth OpenAPI spec
- `lib/api-client-react/src/generated/api.ts` — generated React Query hooks (do not edit)
- `lib/api-zod/src/generated/` — generated Zod schemas (do not edit)
- `artifacts/api-server/src/` — Express backend (routes, middleware, DB schema)
- `artifacts/api-server/src/db/schema.ts` — Drizzle DB schema (users, categories, food_items, orders, order_items)
- `artifacts/restaurant-app/src/` — React frontend
- `artifacts/restaurant-app/src/lib/` — auth-context, cart-context, protected-route
- `artifacts/restaurant-app/src/pages/` — all pages
- `artifacts/restaurant-app/src/components/layout.tsx` — Navbar + Footer

## Architecture decisions

- Contract-first API: OpenAPI spec → Orval codegen → typed hooks + Zod schemas used by both client and server
- JWT auth stored in localStorage (`restaurant_token` / `restaurant_user`); `setAuthTokenGetter` registers a getter that attaches Bearer tokens to every API call
- Cart state in localStorage via React context (`restaurant_cart`)
- Wouter router uses a catch-all fallback `<Route>` (no path prop) to wrap Layout, so all non-auth routes share the navbar/footer
- Protected routes redirect by role: unauthenticated → /login; wrong role → appropriate dashboard

## Product

- **Home** — hero banner, category grid, featured/top-rated dishes
- **Menu** — full menu with sidebar filters (category, veg/non-veg, max price, search)
- **Cart** — item list with quantity controls, order summary
- **Checkout** — delivery address form, places order via API
- **Orders** — order history with live status badges
- **Admin Dashboard** — stats (orders, revenue, users, items) + orders by status + recent orders
- **Admin Menu** — full CRUD for menu items (create, edit, delete, toggle availability)
- **Admin Orders** — view all orders, update status via dropdown
- **Superadmin Users** — view all users, change roles (cannot change own role)

## User preferences

- Warm orange/charcoal theme: `--primary: 15 90% 55%`
- Fonts: Outfit (sans), Playfair Display (serif), Space Mono (mono)

## Demo accounts

| Role       | Email                  | Password  |
|------------|------------------------|-----------|
| user       | user@tabletop.com      | user123   |
| admin      | admin@tabletop.com     | admin123  |
| superadmin | super@tabletop.com     | super123  |

## Gotchas

- `useSearch` from wouter IS available in wouter 3.9.0 but the outer `<Route path="/">` won't match sub-paths — always use a `<Route>` (no path) as the catch-all wrapper for Layout
- Run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml` — never edit generated files manually
- `featured` route must be registered BEFORE `/:id` in the menu router

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
