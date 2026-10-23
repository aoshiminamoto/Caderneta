import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

let _db: DatabaseSync | null = null;

function dbPath() {
  const dir = path.join(process.cwd(), "data");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return path.join(dir, "caderneta.db");
}

export function getDb(): DatabaseSync {
  if (_db) return _db;
  const p = dbPath();
  _db = new DatabaseSync(p);
  _db.exec(`PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;`);
  init(_db);
  migrate(_db);
  seedIfEmpty(_db);
  ensureFechamentoHistory(_db);
  return _db;
}

function init(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS stores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      plano TEXT NOT NULL DEFAULT 'gratis',
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      store_id INTEGER NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
      nome TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      senha_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('dono','caixa')),
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS clients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL DEFAULT '',
      limite_centavos INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS purchases (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      descricao TEXT NOT NULL,
      valor_centavos INTEGER NOT NULL,
      valor_restante_centavos INTEGER NOT NULL,
      liberado_acima_limite INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      vencimento TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      valor_centavos INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS payment_allocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_id INTEGER NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
      purchase_id INTEGER NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
      valor_centavos INTEGER NOT NULL
    );
  `);
}

function migrate(db: DatabaseSync) {
  // add store_id to clients if missing
  const cols = db.prepare("PRAGMA table_info(clients)").all() as Array<{ name: string }>;
  const hasStoreId = cols.some((c) => c.name === "store_id");
  if (!hasStoreId) {
    db.exec("ALTER TABLE clients ADD COLUMN store_id INTEGER REFERENCES stores(id) ON DELETE CASCADE");
  }
  // If there are clients with NULL store_id, create example store and assign
  const nullCount = (
    db.prepare("SELECT COUNT(*) as c FROM clients WHERE store_id IS NULL").get() as { c: number }
  ).c;
  if (nullCount > 0) {
    let storeId: number;
    const existingStore = db.prepare("SELECT id FROM stores LIMIT 1").get() as { id: number } | undefined;
    if (existingStore) {
      storeId = existingStore.id;
    } else {
      const now = new Date().toISOString();
      const r = db
        .prepare("INSERT INTO stores (nome, plano, created_at) VALUES (?, ?, ?)")
        .run("Mercadinho Central — Exemplo", "gratis", now) as unknown as { lastInsertRowid: number };
      storeId = Number(r.lastInsertRowid);
      // create owner user for example store so someone can log in and see the 8 clients
      const { hash } = hashPasswordSync("exemplo123");
      db.prepare(
        "INSERT INTO users (store_id, nome, email, senha_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      ).run(storeId, "Dono Exemplo", "dono@exemplo.com", hash, "dono", now);
    }
    db.prepare("UPDATE clients SET store_id = ? WHERE store_id IS NULL").run(storeId);
  }
}

function hashPasswordSync(password: string): { hash: string } {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
  return { hash: `${salt}:${derived}` };
}

function tokenForClient(): string {
  return crypto.randomBytes(16).toString("hex");
}

function isoNow() {
  return new Date().toISOString();
}
function addDaysIso(iso: string, days: number) {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

// ----- seed -----
function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) as c FROM clients").get() as { c: number } | undefined;
  if (row && row.c > 0) return;

  const now = new Date();
  const iso = (d: Date) => d.toISOString();
  const daysAgo = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - n);
    return d;
  };

  // create example store if not exists
  let storeId: number;
  const existingStore = db.prepare("SELECT id FROM stores LIMIT 1").get() as { id: number } | undefined;
  if (existingStore) storeId = existingStore.id;
  else {
    const r = db
      .prepare("INSERT INTO stores (nome, plano, created_at) VALUES (?, ?, ?)")
      .run("Mercadinho Central — Exemplo", "gratis", iso(daysAgo(90))) as unknown as { lastInsertRowid: number };
    storeId = Number(r.lastInsertRowid);
    const { hash } = hashPasswordSync("exemplo123");
    db.prepare(
      "INSERT INTO users (store_id, nome, email, senha_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).run(storeId, "Dono Exemplo", "dono@exemplo.com", hash, "dono", iso(daysAgo(90)));
  }

  const clients: Array<{ nome: string; telefone: string; limite: number }> = [
    { nome: "Maria das Dores", telefone: "(11) 98765-1234", limite: 50000 },
    { nome: "Seu João da Silva", telefone: "(11) 91234-5678", limite: 30000 },
    { nome: "Ana Paula Ribeiro", telefone: "(11) 99876-5432", limite: 80000 },
    { nome: "Carlos Mendes", telefone: "(11) 98888-7777", limite: 40000 },
    { nome: "Dona Cida", telefone: "(11) 97777-6666", limite: 25000 },
    { nome: "Roberto Almeida", telefone: "(11) 96666-5555", limite: 60000 },
    { nome: "Fernanda Lima", telefone: "(11) 95555-4444", limite: 35000 },
    { nome: "José Carlos Ferreira", telefone: "(11) 94444-3333", limite: 20000 },
  ];

  const insertClient = db.prepare(
    "INSERT INTO clients (nome, telefone, limite_centavos, token, store_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  const insertPurchase = db.prepare(
    "INSERT INTO purchases (client_id, descricao, valor_centavos, valor_restante_centavos, liberado_acima_limite, created_at, vencimento) VALUES (?, ?, ?, ?, ?, ?, ?)",
  );
  const insertPayment = db.prepare("INSERT INTO payments (client_id, valor_centavos, created_at) VALUES (?, ?, ?)");
  const insertAlloc = db.prepare(
    "INSERT INTO payment_allocations (payment_id, purchase_id, valor_centavos) VALUES (?, ?, ?)",
  );

  for (const c of clients) {
    const token = tokenForClient();
    const created = iso(daysAgo(60));
    insertClient.run(c.nome, c.telefone, c.limite, token, storeId, created, created);
  }
  const allClients = db.prepare("SELECT id, nome FROM clients WHERE store_id=? ORDER BY id").all(storeId) as Array<{
    id: number;
    nome: string;
  }>;
  const byName = new Map(allClients.map((c) => [c.nome, c.id]));

  function purchase(clientNome: string, descricao: string, valor: number, diasAtras: number, liberado = 0) {
    const cid = byName.get(clientNome)!;
    const created = iso(daysAgo(diasAtras));
    const venc = addDaysIso(created, 30);
    insertPurchase.run(cid, descricao, valor, valor, liberado, created, venc);
  }
  function payment(clientNome: string, valor: number, diasAtras: number) {
    const cid = byName.get(clientNome)!;
    const created = iso(daysAgo(diasAtras));
    const pr = insertPayment.run(cid, valor, created) as unknown as { lastInsertRowid: number };
    const pid = Number(
      (pr as unknown as { lastInsertRowid: number }).lastInsertRowid ??
        (db.prepare("SELECT last_insert_rowid() as id").get() as { id: number }).id,
    );
    let restante = valor;
    const purchases = db
      .prepare(
        "SELECT id, valor_restante_centavos FROM purchases WHERE client_id = ? AND valor_restante_centavos > 0 ORDER BY datetime(created_at) ASC",
      )
      .all(cid) as Array<{ id: number; valor_restante_centavos: number }>;
    for (const p of purchases) {
      if (restante <= 0) break;
      const abate = Math.min(p.valor_restante_centavos, restante);
      db.prepare("UPDATE purchases SET valor_restante_centavos = valor_restante_centavos - ? WHERE id = ?").run(abate, p.id);
      insertAlloc.run(pid, p.id, abate);
      restante -= abate;
    }
  }

  purchase("Maria das Dores", "Arroz 5kg, feijão 2kg, óleo e café", 12750, 45);
  purchase("Maria das Dores", "Leite, pão, mortadela e refrigerante", 4830, 38);
  purchase("Maria das Dores", "Gás de cozinha", 11500, 10);
  payment("Maria das Dores", 8000, 20);

  purchase("Seu João da Silva", "Cerveja litrão x3 e carvão", 8900, 12);
  purchase("Seu João da Silva", "Carne para churrasco", 15600, 5);

  purchase("Ana Paula Ribeiro", "Compra do mês — lista grande", 52000, 18);
  purchase("Ana Paula Ribeiro", "Material escolar dos meninos", 18500, 8);
  purchase("Ana Paula Ribeiro", "Churrasco do domingo (liberado acima do limite)", 22000, 2, 1);

  purchase("Carlos Mendes", "Fiado antigo — conta de dezembro", 20000, 52);
  purchase("Carlos Mendes", "Bebidas e salgados", 7500, 40);

  purchase("Dona Cida", "Pão, leite e manteiga", 3200, 15);
  payment("Dona Cida", 3200, 3);

  purchase("Roberto Almeida", "Ração 15kg", 18900, 25);
  purchase("Roberto Almeida", "Compras da semana", 6700, 14);
  purchase("Roberto Almeida", "Cerveja e gelo", 4300, 6);
  payment("Roberto Almeida", 10000, 10);
  payment("Roberto Almeida", 5000, 2);

  purchase("Fernanda Lima", "Fraldas e leite em pó", 14200, 9);

  purchase("José Carlos Ferreira", "Fiado antigo", 8500, 35);
  payment("José Carlos Ferreira", 8500, 30);
  purchase("José Carlos Ferreira", "Ovos, pão e café", 2800, 4);
}

// Ensure enough history for 6-month chart: if purchases are sparse, add extra months
function ensureFechamentoHistory(db: DatabaseSync) {
  const stores = db.prepare("SELECT id FROM stores").all() as Array<{ id: number }>;
  if (stores.length === 0) return;
  for (const s of stores) {
    const count = (
      db.prepare(
        "SELECT COUNT(*) as c FROM purchases p JOIN clients cl ON cl.id=p.client_id WHERE cl.store_id=?",
      ).get(s.id) as { c: number }
    ).c;
    // if already have enough data for chart (>25 rows), skip. This avoids duplicating on every request.
    if (count > 25) continue;
    const clientIds = (
      db.prepare("SELECT id, nome FROM clients WHERE store_id=? ORDER BY id").all(s.id) as Array<{ id: number; nome: string }>
    ).map((c) => c.id);
    if (clientIds.length === 0) continue;

    const now = new Date();
    const isoAt = (offsetDays: number, hourOff = 10) => {
      const d = new Date(now);
      d.setDate(d.getDate() - offsetDays);
      d.setHours(hourOff, Math.floor(Math.random() * 60), 0, 0);
      return d.toISOString();
    };
    const insertPurchase = db.prepare(
      "INSERT INTO purchases (client_id, descricao, valor_centavos, valor_restante_centavos, liberado_acima_limite, created_at, vencimento) VALUES (?, ?, ?, ?, ?, ?, ?)",
    );
    const insertPayment = db.prepare("INSERT INTO payments (client_id, valor_centavos, created_at) VALUES (?, ?, ?)");
    const insertAlloc = db.prepare(
      "INSERT INTO payment_allocations (payment_id, purchase_id, valor_centavos) VALUES (?, ?, ?)",
    );

    // Create 6 months of data: for each of last 6 months, add 2-4 purchases and 1-2 payments
    const descricoes = [
      "Compra da semana",
      "Arroz, feijão e mistura",
      "Leite, pão e frios",
      "Cerveja e carvão",
      "Gás de cozinha",
      "Material escolar",
      "Ração e pet",
      "Fraldas e leite",
      "Churrasco do domingo",
      "Carne e verduras",
    ];
    for (let m = 5; m >= 0; m--) {
      // approximate month = 30 days
      const monthBase = m * 30 + 5;
      // 2-3 purchases per month
      const qtdPurchases = 2 + (m % 2);
      for (let i = 0; i < qtdPurchases; i++) {
        const cid = clientIds[(m * 3 + i) % clientIds.length];
        const valor = 3000 + Math.floor(Math.random() * 18000); // 30,00 to 210,00
        const created = isoAt(monthBase + i * 3 + Math.floor(Math.random() * 5));
        const venc = addDaysIso(created, 30);
        const restante = Math.random() < 0.45 ? 0 : valor; // some will be paid later via FIFO
        // Insert as valor_restante = valor initially, then payments will adjust. For simplicity keep valor here and let payment allocate.
        insertPurchase.run(cid, descricoes[(m * 4 + i) % descricoes.length], valor, valor, 0, created, venc);
      }
      // 1-2 payments per month, 10 days after purchases
      const qtdPayments = m === 0 ? 1 : 1 + (m % 2);
      for (let i = 0; i < qtdPayments; i++) {
        const cid = clientIds[(m * 2 + i + 1) % clientIds.length];
        const valor = 2000 + Math.floor(Math.random() * 12000);
        const created = isoAt(monthBase - 7 + i * 4);
        const pr = insertPayment.run(cid, valor, created) as unknown as { lastInsertRowid: number };
        const pid = Number(
          (pr as unknown as { lastInsertRowid: number }).lastInsertRowid ??
            (db.prepare("SELECT last_insert_rowid() as id").get() as { id: number }).id,
        );
        let restante = valor;
        const purchases = db
          .prepare(
            "SELECT id, valor_restante_centavos FROM purchases WHERE client_id=? AND valor_restante_centavos>0 ORDER BY datetime(created_at) ASC",
          )
          .all(cid) as Array<{ id: number; valor_restante_centavos: number }>;
        for (const p of purchases) {
          if (restante <= 0) break;
          const abate = Math.min(p.valor_restante_centavos, restante);
          db.prepare("UPDATE purchases SET valor_restante_centavos = valor_restante_centavos - ? WHERE id=?").run(abate, p.id);
          insertAlloc.run(pid, p.id, abate);
          restante -= abate;
        }
      }
    }
  }
}

// helpers exported
export function newToken() {
  return tokenForClient();
}
export function nowIso() {
  return isoNow();
}
export function vencimentoFrom(createdIso: string) {
  return addDaysIso(createdIso, 30);
}
export function resetDbForTests() {
  _db = null;
}
