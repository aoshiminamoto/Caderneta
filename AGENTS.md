# Caderneta — o fiado do mercadinho
Multi-store credit ledger product (caderneta as SaaS for mercadinhos). Landing is first screen; auth required for painel.

## Project
- Stack: Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS 4 + native `node:sqlite` (`DatabaseSync`, WAL, FK). Text in pt-BR.
- Entry: `src/app/layout.tsx` → `src/app/page.tsx` (landing/product page), `src/app/painel/page.tsx` (counter dashboard, auth-gated). Requires Node.js 22+ (Node 24 has `node:sqlite` built-in).
- DB auto-creates `data/caderneta.db` on first request; `getDb()` runs `init()` → `migrate()` → `seedIfEmpty()` → `ensureFechamentoHistory()`. Delete file to re-seed.

## Commands
```
npm install          # install
npm run dev          # dev at http://localhost:3000 (landing at /, painel at /painel)
npm run build        # production build (Turbopack) — 8 routes: /, /painel, /login, /cadastro, /fechamento, /equipe, /cliente/[id], /c/[token]
npm start            # serve build
npm run lint         # eslint (next/core-web-vitals + typescript)
npx tsc --noEmit     # typecheck
```
No test suite. `data/caderneta.db` ignored at runtime (not in `.gitignore` — add if committing). Example login: `dono@exemplo.com` / `exemplo123`.

## Architecture
- `src/app/page.tsx` — Landing (produto): hero "o que é", antes/depois do caderno, 3 passos, planos (grátis 30 clientes / pago ilimitado), FAQ, CTAs. Dark card `Pago — Ilimitado` uses `rounded-2xl bg-[#172e54]` (not `paper-card` — avoids white-on-beige contrast bug).
- `src/app/painel/page.tsx` — Counter dashboard scoped by `store_id`: total na rua/atrasado, clients sorted by `oldestDebtAt`, search `?q=`, "Cobrar" WhatsApp button per overdue client. Redirects to `/login` if unauthenticated.
- `src/app/login/page.tsx` + `src/app/cadastro/page.tsx` + `src/lib/auth.ts` — Auth: PBKDF2 `100k/sha256` + salt, `timingSafeEqual`, cookie `caderneta_sessao` `httpOnly` `sameSite=lax` 7d, `getCurrentUser()` via `next/headers` cookies (persists on reload).
- `src/app/equipe/page.tsx` — Team (dono only): register `caixa` (`createCaixa` checks `role==='dono'`).
- `src/app/fechamento/page.tsx` — Monthly closing: vendido/pago do mês, atrasado total, top 5 devedores, SVG bar chart last 6 months (data from `getFechamentoResumo` + `ensureFechamentoHistory` seeding).
- `src/app/cliente/[id]/page.tsx` — Customer sheet: edit, purchase (30-day vencimento), payment, history + timeline, "Cobrar" per overdue purchase. Role-aware UI (caixa: limite readOnly, no liberar checkbox, no delete) + server checks. Validates `getClientById(id, store_id)`.
- `src/app/c/[token]/page.tsx` — Public read-only link per `clients.token` (32-char hex), WhatsApp share.
- `src/app/actions.ts` — Server actions: `register`/`login`/`logout`/`createCaixa`, `createClient` (free-plan `COUNT>=30` block), `updateClient` (caixa limit change → redirect `permissao_limite`), `createPurchase`/`createPurchaseLiberada` (caixa liberar → `permissao_liberar`), `createPayment`, `deleteClient`/`deletePurchase`/`deletePayment` (caixa → `assertCanDelete`). All use `revalidatePath` + `redirect`, `store_id` scoping.
- `src/lib/db.ts` — `getDb()` singleton `DatabaseSync`, `init()` (stores/users/sessions/clients/purchases/payments/payment_allocations), `migrate()` (adds `clients.store_id`, assigns NULLs to example store), `seedIfEmpty()` 8 clients in `Mercadinho Central — Exemplo`, `ensureFechamentoHistory()` (2-3 purchases + 1-2 payments/month for 6 months per store until >25 rows).
- `src/lib/caderneta.ts` — Business logic: `getClientsResumo(storeId, search?)`, `getPainelResumo(storeId)`, `getFechamentoResumo(storeId)` (monthly aggregates + 6-month buckets), `getClientHistorico` (FIFO allocations), `isVencida`/`diasAtraso`, sorting by oldest debt.
- `src/lib/money.ts` — Centavos `INTEGER`: `parseBRL` ( `1.200,50` / `12,50`), `formatBRL`/`toCentavos`.
- `src/app/layout.tsx` — Async header: `getCurrentUser()` → authed: links `Painel/Fechamento/Equipe(dono)`, store badge, `Sair` form; unauthed: `Entrar/Criar conta`. Mobile nav mirrors.
- `src/components/icons.tsx` — Hand-drawn SVG icons + `HeroIlustracao`; no emoji/lib.
- `src/types/sqlite.d.ts` — Shim for `node:sqlite` `DatabaseSync`.

## Conventions
- Money: always `INTEGER` centavos; never float. `parseBRL` in `src/lib/money.ts`.
- Credit: `vencimento = created_at + 30 days`, no juros; `isVencida = valor_restante>0 && vencimento < now`; FIFO via `payment_allocations` to oldest purchases.
- Limit: `saldo (SUM valor_restante) + valor > limite` blocks unless `liberar=on`; `liberado_acima_limite=1` when forced. Free plan: `stores.plano='gratis'` blocks at 30 clients.
- Roles: `users.role` `dono|caixa`. Caixa cannot change `limite_centavos`, cannot `liberar` over limit, cannot delete — enforced server-side (actions throw/redirect), UI hiding is secondary.
- Multi-tenant: every client query/action filters by `store_id`; `getClientById(id, storeId)` returns null cross-store. 8 seed clients belong to example store only.
- Styling: Tailwind 4 `@theme` in `src/app/globals.css` — `postcss.config.mjs` with `@tailwindcss/postcss`; palette `#fffef2`/`#c7d7f0`/`#f2a6a6`/`#172e54`, `Patrick_Hand`+`Kalam`+`JetBrains_Mono`. 42px touch targets, `field-input`/`btn-primary`/`badge`/`meter-track`. Dark plan card must not use `paper-card` (overrides bg).
- App Router: `export const dynamic = "force-dynamic"` on pages; `"use server"` actions with `next/cache` revalidation. Session via `cookies()` — no client storage.
- No git repo; keep scratch files in `$TMPDIR`.

## Notes
<!-- Add quick notes for future sessions below -->

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
