import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getDb } from "./db";

export type SessionUser = {
  id: number;
  store_id: number;
  nome: string;
  email: string;
  role: "dono" | "caixa";
  storeNome: string;
  plano: string;
};

const COOKIE_NAME = "caderneta_sessao";
const SESSION_DAYS = 7;

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256").toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(stored: string, attempt: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const derived = crypto.pbkdf2Sync(attempt, salt, 100000, 32, "sha256").toString("hex");
  // timingSafeEqual
  const a = Buffer.from(hash, "hex");
  const b = Buffer.from(derived, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function createSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

export async function createSession(userId: number): Promise<string> {
  const db = getDb();
  const token = createSessionToken();
  const now = new Date();
  const expires = new Date(now);
  expires.setDate(expires.getDate() + SESSION_DAYS);
  db.prepare("INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)").run(
    token,
    userId,
    now.toISOString(),
    expires.toISOString(),
  );
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
    // secure false for localhost dev; Next will handle via https in prod
  });
  return token;
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (token) {
    try {
      getDb().prepare("DELETE FROM sessions WHERE token=?").run(token);
    } catch {}
  }
  cookieStore.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const db = getDb();
  const row = db
    .prepare(
      `SELECT s.token, s.expires_at, u.id, u.store_id, u.nome, u.email, u.role, st.nome as storeNome, st.plano
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       JOIN stores st ON st.id = u.store_id
       WHERE s.token = ?`,
    )
    .get(token) as
    | {
        token: string;
        expires_at: string;
        id: number;
        store_id: number;
        nome: string;
        email: string;
        role: string;
        storeNome: string;
        plano: string;
      }
    | undefined;
  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    try {
      db.prepare("DELETE FROM sessions WHERE token=?").run(token);
    } catch {}
    return null;
  }
  return {
    id: row.id,
    store_id: row.store_id,
    nome: row.nome,
    email: row.email,
    role: row.role as "dono" | "caixa",
    storeNome: row.storeNome,
    plano: row.plano,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getCurrentUser();
  if (!u) {
    // redirect handled by caller; throw to signal
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return u!;
}

export function cobrarWhatsAppUrl(opts: {
  telefone: string;
  nome: string;
  saldoCentavos: number;
  diasAtraso: number;
  token: string;
  baseUrl?: string;
}): string {
  const { nome, saldoCentavos, diasAtraso, telefone, token, baseUrl } = opts;
  const saldo = (saldoCentavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const link = `${baseUrl ?? ""}/c/${token}`;
  const msg = `Olá, ${nome}! Passando para lembrar com carinho do seu fiado no mercadinho. Seu saldo é ${saldo} (atrasado há ${diasAtraso} dia(s)). Você pode conferir seu histórico aqui: ${link} — quando puder, passe no balcão. Obrigado!`;
  const phoneDigits = telefone.replace(/\D/g, "");
  // wa.me exige DDI; se vier sem, só abre wa.me/?text=
  const phoneParam = phoneDigits.length >= 10 ? `55${phoneDigits.slice(-11)}` : "";
  const text = encodeURIComponent(msg);
  if (phoneParam) return `https://wa.me/${phoneParam}?text=${text}`;
  return `https://wa.me/?text=${text}`;
}
