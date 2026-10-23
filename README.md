# Caderneta — o fiado do mercadinho

Papel de caderno, caneta azul e conta certa no centavo. Agora como **produto para vários mercadinhos**: cada loja vê só os próprios clientes.

## O que faz

- **Landing `/`** — primeira tela do produto: o que é a Caderneta, antes/depois do caderno de papel, como funciona em 3 passos, planos (grátis até 30 clientes / pago ilimitado), FAQ e CTAs `Entrar` + `Criar conta`. Mesmo visual do app (`#fffef2` / `#172e54`, `paper-card`, SVG à mão).
- **Cadastro e login** — `/cadastro` (nome do mercadinho, nome do dono, e-mail, senha) e `/login` (e-mail + senha). Hash PBKDF2 + salt, cookie `caderneta_sessao` `httpOnly` `sameSite=lax` de 7 dias — continua logado ao recarregar.
- **Painel do balcão `/painel`** — total na rua, total atrasado, clientes ordenados por quem deve há mais tempo (`oldestDebtAt`), busca `?q=` por nome/telefone. Cada mercadinho só vê os próprios clientes.
- **Ficha do cliente `/cliente/[id]`** — editar cliente, anotar compra (30 dias vencimento), registrar pagamento parcial, histórico por compra (restante + barra), pagamentos com alocações FIFO, linha do tempo. **Caixa**: anota compras e recebe pagamentos, mas não muda limite, não libera acima do limite e não apaga — bloqueio no servidor, não só no botão.
- **Cobrar no WhatsApp** — em todo cliente atrasado, botão `Cobrar` abre `wa.me` com mensagem educada já escrita: saldo (`formatBRL`), dias de atraso (`diasAtraso`), link `/c/[token]`. Vale no painel e na ficha (por cliente e por compra vencida).
- **Link do cliente `/c/[token]`** — token `16-byte hex` por cliente, página só-leitura para mandar no WhatsApp — só o próprio saldo/histórico.
- **Fechamento do mês `/fechamento`** — quanto foi vendido no fiado no mês, quanto entrou de pagamento, quanto está atrasado e quem mais deve (top 5), com gráfico de barras SVG mês a mês dos últimos 6 meses. Banco populado com histórico suficiente para o gráfico ter dados.
- **Equipe `/equipe`** (só dono) — cadastrar caixa do mercadinho (`nome`, `e-mail`, `senha`, `role=caixa`).
- **Planos** — `grátis` até 30 clientes, `pago` ilimitado (UI em `/` e checagem `COUNT(*) >= 30` em `createClient`).
- **Regras mantidas**: `vencimento = criado + 30 dias`, sem juros (`isVencida` = `restante>0 && vencimento < now`), pagamento FIFO em `payment_allocations`, dinheiro em `INTEGER` centavos (`parseBRL`/`formatBRL` sem float).

## Stack

Next.js 16 (App Router, Turbopack) + React 19 + TypeScript + Tailwind CSS 4 + SQLite nativo `node:sqlite` (`DatabaseSync`, WAL, FK).

## Banco

`data/caderneta.db` (criado na primeira requisição). Tabelas: `stores`, `users`, `sessions`, `clients` (+ `store_id` FK), `purchases`, `payments`, `payment_allocations`.

- **Migrate**: `clients.store_id` adicionado se faltar; clientes antigos atribuídos ao mercadinho de exemplo.
- **Seed**: 8 clientes de exemplo (Maria das Dores/Carlos Mendes atrasados, Ana Paula acima do limite) ficam no `Mercadinho Central — Exemplo` (`dono@exemplo.com` / `exemplo123`). `ensureFechamentoHistory()` gera 2–3 compras + 1–2 pagamentos por mês nos últimos 6 meses para alimentar o gráfico. Apague `data/caderneta.db` para re-seed.

## Papéis

| Papel | Pode | Não pode (bloqueio no servidor) |
|-------|------|---------------------------------|
| **dono** | tudo + cadastrar caixa + mudar limite + liberar acima do limite + apagar | — |
| **caixa** | anotar compra (dentro do limite), receber pagamento | mudar `limite_centavos`, liberar `liberar=on` acima do limite, `DELETE` cliente/compra/pagamento |

Todas as actions verificam `getCurrentUser()` + `store_id` do cliente/pagamento — isolamento por loja é no servidor.

## Como rodar

```bash
# 1. instalar
npm install

# 2. desenvolvimento (http://localhost:3000)
npm run dev

# 3. produção
npm run build
npm start

# checagens
npx tsc --noEmit
npm run lint
```

> Requer **Node.js 22+** (`node:sqlite` nativo). Em Node 24 já incluso. O banco é criado em `data/caderneta.db`.

## Estrutura

```
src/
  app/
    page.tsx              # landing do produto (antes/depois, 3 passos, planos, FAQ)
    painel/page.tsx       # painel do balcão (era /) — scoped por store_id
    login/page.tsx        # entrar (e-mail/senha)
    cadastro/page.tsx     # criar conta (loja + dono)
    fechamento/page.tsx   # fechamento do mês + gráfico 6 meses + top devedores
    equipe/page.tsx       # equipe — cadastrar caixa (só dono)
    cliente/[id]/page.tsx # ficha: editar, compra, pagamento, histórico + cobrar WhatsApp
    c/[token]/page.tsx    # visão pública do cliente (link WhatsApp)
    actions.ts            # server actions (auth + clientes + compras/pagamentos com checagem de papel)
    layout.tsx / globals.css
  lib/
    db.ts                 # DatabaseSync + migrate + seed 8 clientes + histórico 6 meses
    auth.ts               # hash PBKDF2, sessions, cookies, getCurrentUser
    caderneta.ts          # getClientsResumo(storeId), getPainelResumo, getFechamentoResumo, etc.
    money.ts              # centavos (parseBRL/formatBRL)
  components/icons.tsx    # SVG à mão + HeroIlustracao
  types/sqlite.d.ts       # shim DatabaseSync
```

## Visual

Tailwind 4 `@theme` em `src/app/globals.css` — `postcss.config.mjs` com `@tailwindcss/postcss`; paleta papel `#fffef2`/`#c7d7f0`/`#f2a6a6`/`#172e54`, fontes `Patrick_Hand` + `Kalam` + `JetBrains_Mono`, `field-input`/`btn-primary`/`badge`/`meter-track`. Plano ilimitado usa card `bg-[#172e54]` escuro com `shadow-paper` (sem `paper-card` claro por cima).
