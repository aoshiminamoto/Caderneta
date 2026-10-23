"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb, newToken, nowIso, vencimentoFrom } from "@/lib/db";
import { parseBRL } from "@/lib/money";
import { getCurrentUser, hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";

function toCentavosLimite(v: FormDataEntryValue | null): number {
  const s = String(v ?? "").trim();
  if (!s) throw new Error("Informe o limite");
  return parseBRL(s);
}

// ---- Auth ----
export async function register(formData: FormData) {
  const nomeLoja = String(formData.get("nomeLoja") ?? "").trim();
  const nomeDono = String(formData.get("nomeDono") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  if (!nomeLoja) throw new Error("Nome do mercadinho é obrigatório");
  if (!nomeDono) throw new Error("Seu nome é obrigatório");
  if (!email || !email.includes("@")) throw new Error("E-mail inválido");
  if (!senha || senha.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres");
  const db = getDb();
  const exists = db.prepare("SELECT id FROM users WHERE email=?").get(email) as { id: number } | undefined;
  if (exists) {
    redirect("/cadastro?erro=email_existe");
  }
  const iso = nowIso();
  const r = db.prepare("INSERT INTO stores (nome, plano, created_at) VALUES (?, ?, ?)").run(nomeLoja, "gratis", iso) as unknown as { lastInsertRowid: number };
  const storeId = Number(r.lastInsertRowid);
  const senhaHash = hashPassword(senha);
  const ur = db
    .prepare("INSERT INTO users (store_id, nome, email, senha_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)")
    .run(storeId, nomeDono, email, senhaHash, "dono", iso) as unknown as { lastInsertRowid: number };
  const userId = Number(ur.lastInsertRowid);
  await createSession(userId);
  redirect("/painel");
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  const db = getDb();
  const user = db.prepare("SELECT id, senha_hash FROM users WHERE email=?").get(email) as
    | { id: number; senha_hash: string }
    | undefined;
  if (!user || !verifyPassword(user.senha_hash, senha)) {
    redirect("/login?erro=credenciais");
  }
  await createSession(user.id);
  redirect("/painel");
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function createCaixa(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  if (me.role !== "dono") throw new Error("Apenas o dono pode cadastrar caixa");
  const nome = String(formData.get("nome") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const senha = String(formData.get("senha") ?? "");
  if (!nome) throw new Error("Nome do caixa é obrigatório");
  if (!email || !email.includes("@")) throw new Error("E-mail inválido");
  if (!senha || senha.length < 6) throw new Error("Senha deve ter pelo menos 6 caracteres");
  const db = getDb();
  const exists = db.prepare("SELECT id FROM users WHERE email=?").get(email) as { id: number } | undefined;
  if (exists) redirect("/equipe?erro=email_existe");
  const senhaHash = hashPassword(senha);
  db.prepare("INSERT INTO users (store_id, nome, email, senha_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)").run(
    me.store_id,
    nome,
    email,
    senhaHash,
    "caixa",
    nowIso(),
  );
  revalidatePath("/equipe");
  redirect("/equipe");
}

// ---- Helpers authz ----
function assertCanWriteLimit(me: { role: string } | null) {
  if (!me) throw new Error("Não autenticado");
  if (me.role === "caixa") throw new Error("Caixa não pode alterar limite");
}
function assertCanLiberar(me: { role: string } | null) {
  if (!me) throw new Error("Não autenticado");
  if (me.role === "caixa") throw new Error("Caixa não pode liberar acima do limite");
}
function assertCanDelete(me: { role: string } | null) {
  if (!me) throw new Error("Não autenticado");
  if (me.role === "caixa") throw new Error("Caixa não pode apagar");
}

// ---- Clients ----
export async function createClient(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  if (!nome) throw new Error("Nome é obrigatório");
  const limite = toCentavosLimite(formData.get("limite"));
  const db = getDb();
  // plano gratis: até 30 clientes
  const count = (db.prepare("SELECT COUNT(*) as c FROM clients WHERE store_id=?").get(me.store_id) as { c: number }).c;
  const plano = (db.prepare("SELECT plano FROM stores WHERE id=?").get(me.store_id) as { plano: string } | undefined)?.plano ?? "gratis";
  if (plano === "gratis" && count >= 30) {
    redirect("/painel?erro=limite_plano");
  }
  const token = newToken();
  const iso = nowIso();
  db.prepare("INSERT INTO clients (nome, telefone, limite_centavos, token, store_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)").run(
    nome,
    telefone,
    limite,
    token,
    me.store_id,
    iso,
    iso,
  );
  revalidatePath("/painel");
  const id = (db.prepare("SELECT last_insert_rowid() as id").get() as { id: number }).id;
  redirect(`/cliente/${id}`);
}

export async function updateClient(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const id = Number(formData.get("id"));
  const nome = String(formData.get("nome") ?? "").trim();
  const telefone = String(formData.get("telefone") ?? "").trim();
  if (!nome) throw new Error("Nome é obrigatório");
  const limite = toCentavosLimite(formData.get("limite"));
  const db = getDb();
  const client = db.prepare("SELECT * FROM clients WHERE id=?").get(id) as { store_id: number; limite_centavos: number } | undefined;
  if (!client) throw new Error("Cliente não encontrado");
  if (client.store_id !== me.store_id) throw new Error("Sem permissão");
  // caixa não pode mudar limite
  if (me.role === "caixa" && limite !== client.limite_centavos) {
    redirect(`/cliente/${id}?erro=permissao_limite`);
  }
  db.prepare("UPDATE clients SET nome=?, telefone=?, limite_centavos=?, updated_at=? WHERE id=?").run(nome, telefone, limite, nowIso(), id);
  revalidatePath("/painel");
  revalidatePath(`/cliente/${id}`);
  redirect(`/cliente/${id}`);
}

export async function deleteClient(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  assertCanDelete(me);
  const id = Number(formData.get("id"));
  const db = getDb();
  const client = db.prepare("SELECT store_id FROM clients WHERE id=?").get(id) as { store_id: number } | undefined;
  if (!client) throw new Error("Cliente não encontrado");
  if (client.store_id !== me.store_id) throw new Error("Sem permissão");
  db.prepare("DELETE FROM clients WHERE id=?").run(id);
  revalidatePath("/painel");
  redirect("/painel");
}

// ---- Purchases & Payments with store scoping and caixa rules ----
export async function createPurchase(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const clientId = Number(formData.get("client_id"));
  const descricao = String(formData.get("descricao") ?? "").trim();
  if (!descricao) throw new Error("Descreva o que foi levado");
  const valor = parseBRL(String(formData.get("valor") ?? ""));
  const liberar = formData.get("liberar") === "on";

  const db = getDb();
  const client = db.prepare("SELECT * FROM clients WHERE id=?").get(clientId) as
    | { limite_centavos: number; store_id: number }
    | undefined;
  if (!client) throw new Error("Cliente não encontrado");
  if (client.store_id !== me.store_id) throw new Error("Sem permissão");

  if (liberar && me.role === "caixa") {
    redirect(`/cliente/${clientId}?erro=permissao_liberar`);
  }

  const row = db.prepare("SELECT COALESCE(SUM(valor_restante_centavos),0) as saldo FROM purchases WHERE client_id=?").get(clientId) as {
    saldo: number;
  };
  const saldo = row.saldo;
  const novoSaldo = saldo + valor;
  if (novoSaldo > client.limite_centavos && !liberar) {
    redirect(`/cliente/${clientId}?erro=limite&valor=${valor}&desc=${encodeURIComponent(descricao)}`);
  }
  if (novoSaldo > client.limite_centavos && liberar && me.role === "caixa") {
    redirect(`/cliente/${clientId}?erro=permissao_liberar`);
  }

  const created = nowIso();
  const venc = vencimentoFrom(created);
  db.prepare(
    "INSERT INTO purchases (client_id, descricao, valor_centavos, valor_restante_centavos, liberado_acima_limite, created_at, vencimento) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(clientId, descricao, valor, valor, liberar && novoSaldo > client.limite_centavos ? 1 : 0, created, venc);
  revalidatePath(`/cliente/${clientId}`);
  revalidatePath("/painel");
}

export async function createPurchaseLiberada(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  assertCanLiberar(me);
  const clientId = Number(formData.get("client_id"));
  const descricao = String(formData.get("descricao") ?? "").trim();
  const valor = parseBRL(String(formData.get("valor") ?? ""));
  const db = getDb();
  const client = db.prepare("SELECT store_id FROM clients WHERE id=?").get(clientId) as { store_id: number } | undefined;
  if (!client) throw new Error("Cliente não encontrado");
  if (client.store_id !== me.store_id) throw new Error("Sem permissão");
  const created = nowIso();
  const venc = vencimentoFrom(created);
  db.prepare(
    "INSERT INTO purchases (client_id, descricao, valor_centavos, valor_restante_centavos, liberado_acima_limite, created_at, vencimento) VALUES (?, ?, ?, ?, ?, ?, ?)",
  ).run(clientId, descricao, valor, valor, 1, created, venc);
  revalidatePath(`/cliente/${clientId}`);
  revalidatePath("/painel");
  redirect(`/cliente/${clientId}`);
}

export async function createPayment(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  const clientId = Number(formData.get("client_id"));
  const valor = parseBRL(String(formData.get("valor") ?? ""));
  const db = getDb();
  const client = db.prepare("SELECT store_id FROM clients WHERE id=?").get(clientId) as { store_id: number } | undefined;
  if (!client) throw new Error("Cliente não encontrado");
  if (client.store_id !== me.store_id) throw new Error("Sem permissão");
  const created = nowIso();
  db.prepare("INSERT INTO payments (client_id, valor_centavos, created_at) VALUES (?, ?, ?)").run(clientId, valor, created);
  const pid = (db.prepare("SELECT last_insert_rowid() as id").get() as { id: number }).id;
  let restante = valor;
  const purchases = db
    .prepare("SELECT id, valor_restante_centavos FROM purchases WHERE client_id=? AND valor_restante_centavos>0 ORDER BY datetime(created_at) ASC")
    .all(clientId) as Array<{ id: number; valor_restante_centavos: number }>;
  for (const p of purchases) {
    if (restante <= 0) break;
    const abate = Math.min(p.valor_restante_centavos, restante);
    db.prepare("UPDATE purchases SET valor_restante_centavos = valor_restante_centavos - ? WHERE id=?").run(abate, p.id);
    db.prepare("INSERT INTO payment_allocations (payment_id, purchase_id, valor_centavos) VALUES (?, ?, ?)").run(pid, p.id, abate);
    restante -= abate;
  }
  revalidatePath(`/cliente/${clientId}`);
  revalidatePath("/painel");
  revalidatePath(`/c/*`);
}

export async function deletePurchase(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  assertCanDelete(me);
  const id = Number(formData.get("purchase_id"));
  const clientId = Number(formData.get("client_id"));
  const db = getDb();
  const purchase = db.prepare("SELECT client_id FROM purchases WHERE id=?").get(id) as { client_id: number } | undefined;
  if (!purchase) throw new Error("Compra não encontrada");
  const client = db.prepare("SELECT store_id FROM clients WHERE id=?").get(purchase.client_id) as { store_id: number } | undefined;
  if (!client || client.store_id !== me.store_id) throw new Error("Sem permissão");
  db.prepare("DELETE FROM purchases WHERE id=?").run(id);
  // allocations cascade via FK? payment_allocations references purchase_id cascade delete not needed manually but ok
  revalidatePath(`/cliente/${clientId}`);
  revalidatePath("/painel");
}

export async function deletePayment(formData: FormData) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");
  assertCanDelete(me);
  const id = Number(formData.get("payment_id"));
  const clientId = Number(formData.get("client_id"));
  const db = getDb();
  const pay = db.prepare("SELECT client_id FROM payments WHERE id=?").get(id) as { client_id: number } | undefined;
  if (!pay) throw new Error("Pagamento não encontrado");
  const client = db.prepare("SELECT store_id FROM clients WHERE id=?").get(pay.client_id) as { store_id: number } | undefined;
  if (!client || client.store_id !== me.store_id) throw new Error("Sem permissão");
  // need to revert allocations: add back to purchases
  const allocs = db.prepare("SELECT purchase_id, valor_centavos FROM payment_allocations WHERE payment_id=?").all(id) as Array<{
    purchase_id: number;
    valor_centavos: number;
  }>;
  for (const a of allocs) {
    db.prepare("UPDATE purchases SET valor_restante_centavos = valor_restante_centavos + ? WHERE id=?").run(a.valor_centavos, a.purchase_id);
  }
  db.prepare("DELETE FROM payments WHERE id=?").run(id);
  revalidatePath(`/cliente/${clientId}`);
  revalidatePath("/painel");
}
