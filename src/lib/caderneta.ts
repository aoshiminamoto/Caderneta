import { getDb } from "./db";

export type Client = {
  id: number;
  nome: string;
  telefone: string;
  limite_centavos: number;
  token: string;
  store_id: number;
  created_at: string;
  updated_at: string;
};
export type Purchase = {
  id: number;
  client_id: number;
  descricao: string;
  valor_centavos: number;
  valor_restante_centavos: number;
  liberado_acima_limite: number;
  created_at: string;
  vencimento: string;
};
export type Payment = {
  id: number;
  client_id: number;
  valor_centavos: number;
  created_at: string;
};
export type Allocation = {
  id: number;
  payment_id: number;
  purchase_id: number;
  valor_centavos: number;
};

function daysBetween(aIso: string, b: Date = new Date()): number {
  const a = new Date(aIso).getTime();
  const bT = b.getTime();
  const diff = bT - a;
  return Math.floor(diff / 86400000);
}

export function diasAtraso(vencimentoIso: string, now = new Date()): number {
  const v = new Date(vencimentoIso).getTime();
  const n = now.getTime();
  if (n <= v) return 0;
  return Math.floor((n - v) / 86400000);
}

export function isVencida(p: Purchase, now = new Date()): boolean {
  return p.valor_restante_centavos > 0 && new Date(p.vencimento).getTime() < now.getTime();
}

export type ClientResumo = Client & {
  saldo_centavos: number;
  atrasado: boolean;
  diasAtraso: number;
  vencidas_centavos: number;
  oldestDebtAt: string | null;
};

export function getClientsResumo(storeId: number, search?: string): ClientResumo[] {
  const db = getDb();
  const now = new Date();
  let clients: Client[];
  if (search && search.trim()) {
    const q = `%${search.trim()}%`;
    clients = db
      .prepare(
        "SELECT * FROM clients WHERE store_id = ? AND (nome LIKE ? COLLATE NOCASE OR telefone LIKE ?) ORDER BY nome COLLATE NOCASE",
      )
      .all(storeId, q, q) as Client[];
  } else {
    clients = db.prepare("SELECT * FROM clients WHERE store_id = ? ORDER BY nome COLLATE NOCASE").all(storeId) as Client[];
  }

  const res: ClientResumo[] = clients.map((c) => {
    const purchases = db
      .prepare("SELECT * FROM purchases WHERE client_id = ? ORDER BY datetime(created_at) ASC")
      .all(c.id) as Purchase[];
    let saldo = 0;
    let atrasado = false;
    let maxDias = 0;
    let vencidas = 0;
    let oldest: string | null = null;
    for (const p of purchases) {
      if (p.valor_restante_centavos > 0) {
        saldo += p.valor_restante_centavos;
        if (!oldest) oldest = p.created_at;
        if (isVencida(p, now)) {
          atrasado = true;
          const d = diasAtraso(p.vencimento, now);
          if (d > maxDias) maxDias = d;
          vencidas += p.valor_restante_centavos;
        }
      }
    }
    return {
      ...c,
      saldo_centavos: saldo,
      atrasado,
      diasAtraso: maxDias,
      vencidas_centavos: vencidas,
      oldestDebtAt: oldest,
    };
  });

  res.sort((a, b) => {
    if (a.saldo_centavos === 0 && b.saldo_centavos === 0) return a.nome.localeCompare(b.nome);
    if (a.saldo_centavos === 0) return 1;
    if (b.saldo_centavos === 0) return -1;
    if (!a.oldestDebtAt && !b.oldestDebtAt) return 0;
    if (!a.oldestDebtAt) return 1;
    if (!b.oldestDebtAt) return -1;
    return new Date(a.oldestDebtAt).getTime() - new Date(b.oldestDebtAt).getTime();
  });

  return res;
}

export function getPainelResumo(storeId: number) {
  const clientes = getClientsResumo(storeId);
  let totalRua = 0;
  let totalAtrasado = 0;
  let qtdAtrasados = 0;
  for (const c of clientes) {
    totalRua += c.saldo_centavos;
    totalAtrasado += c.vencidas_centavos;
    if (c.atrasado) qtdAtrasados++;
  }
  return { clientes, totalRua, totalAtrasado, qtdAtrasados };
}

export function getClientById(id: number, storeId?: number): Client | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM clients WHERE id = ?").get(id) as Client | undefined;
  if (!row) return null;
  if (storeId !== undefined && row.store_id !== storeId) return null;
  return row;
}
export function getClientByToken(token: string): Client | null {
  const db = getDb();
  const row = db.prepare("SELECT * FROM clients WHERE token = ?").get(token) as Client | undefined;
  return row ?? null;
}

export function getPurchases(clientId: number): Purchase[] {
  const db = getDb();
  return db.prepare("SELECT * FROM purchases WHERE client_id = ? ORDER BY datetime(created_at) ASC").all(clientId) as Purchase[];
}
export function getPayments(clientId: number): Payment[] {
  const db = getDb();
  return db.prepare("SELECT * FROM payments WHERE client_id = ? ORDER BY datetime(created_at) ASC").all(clientId) as Payment[];
}
export function getAllocationsForPayment(paymentId: number): Allocation[] {
  const db = getDb();
  return db.prepare("SELECT * FROM payment_allocations WHERE payment_id = ?").all(paymentId) as Allocation[];
}
export function getAllAllocations(clientId: number): Allocation[] {
  const db = getDb();
  return db
    .prepare(
      "SELECT pa.* FROM payment_allocations pa JOIN payments p ON p.id = pa.payment_id WHERE p.client_id = ? ORDER BY pa.id ASC",
    )
    .all(clientId) as Allocation[];
}

export function getClientHistorico(clientId: number) {
  const purchases = getPurchases(clientId);
  const payments = getPayments(clientId);
  const allocs = getAllAllocations(clientId);

  const allocByPurchase = new Map<number, Allocation[]>();
  for (const a of allocs) {
    if (!allocByPurchase.has(a.purchase_id)) allocByPurchase.set(a.purchase_id, []);
    allocByPurchase.get(a.purchase_id)!.push(a);
  }
  const allocByPayment = new Map<number, Allocation[]>();
  for (const a of allocs) {
    if (!allocByPayment.has(a.payment_id)) allocByPayment.set(a.payment_id, []);
    allocByPayment.get(a.payment_id)!.push(a);
  }

  type Item =
    | { kind: "purchase"; at: string; purchase: Purchase }
    | { kind: "payment"; at: string; payment: Payment; allocs: Allocation[] };

  const timeline: Item[] = [];
  for (const p of purchases) timeline.push({ kind: "purchase", at: p.created_at, purchase: p });
  for (const p of payments) timeline.push({ kind: "payment", at: p.created_at, payment: p, allocs: allocByPayment.get(p.id) ?? [] });
  timeline.sort((a, b) => new Date(a.at).getTime() - new Date(b.at).getTime());

  let saldo = 0;
  for (const p of purchases) saldo += p.valor_restante_centavos;

  return { purchases, payments, allocs, allocByPurchase, allocByPayment, timeline, saldo };
}

// Fechamento do mês
export type FechamentoResumo = {
  vendidoMes: number;
  pagoMes: number;
  atrasadoAgora: number;
  topDevedores: ClientResumo[];
  meses: Array<{ label: string; vendido: number; pago: number }>;
};

export function getFechamentoResumo(storeId: number): FechamentoResumo {
  const db = getDb();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startIso = startOfMonth.toISOString();

  const vendidoMes = (
    db
      .prepare(
        `SELECT COALESCE(SUM(p.valor_centavos),0) as s FROM purchases p JOIN clients c ON c.id=p.client_id WHERE c.store_id=? AND datetime(p.created_at) >= datetime(?)`,
      )
      .get(storeId, startIso) as { s: number }
  ).s;

  const pagoMes = (
    db
      .prepare(
        `SELECT COALESCE(SUM(pay.valor_centavos),0) as s FROM payments pay JOIN clients c ON c.id=pay.client_id WHERE c.store_id=? AND datetime(pay.created_at) >= datetime(?)`,
      )
      .get(storeId, startIso) as { s: number }
  ).s;

  const atrasadoAgora = getClientsResumo(storeId).reduce((acc, c) => acc + c.vencidas_centavos, 0);

  const topDevedores = getClientsResumo(storeId)
    .filter((c) => c.saldo_centavos > 0)
    .sort((a, b) => b.saldo_centavos - a.saldo_centavos)
    .slice(0, 5);

  // últimos 6 meses (inclui mês atual)
  const meses: Array<{ label: string; vendido: number; pago: number }> = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
    const vendido = (
      db
        .prepare(
          `SELECT COALESCE(SUM(p.valor_centavos),0) as s FROM purchases p JOIN clients c ON c.id=p.client_id WHERE c.store_id=? AND datetime(p.created_at) >= datetime(?) AND datetime(p.created_at) < datetime(?)`,
        )
        .get(storeId, d.toISOString(), next.toISOString()) as { s: number }
    ).s;
    const pago = (
      db
        .prepare(
          `SELECT COALESCE(SUM(pay.valor_centavos),0) as s FROM payments pay JOIN clients c ON c.id=pay.client_id WHERE c.store_id=? AND datetime(pay.created_at) >= datetime(?) AND datetime(pay.created_at) < datetime(?)`,
        )
        .get(storeId, d.toISOString(), next.toISOString()) as { s: number }
    ).s;
    meses.push({ label, vendido, pago });
  }

  return { vendidoMes, pagoMes, atrasadoAgora, topDevedores, meses };
}
