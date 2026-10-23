export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { createCaixa } from "@/app/actions";

export default async function EquipePage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "dono") redirect("/painel");

  const sp = await searchParams;
  const db = getDb();
  const users = db.prepare("SELECT id, nome, email, role, created_at FROM users WHERE store_id=? ORDER BY role DESC, nome").all(user.store_id) as Array<{ id: number; nome: string; email: string; role: string; created_at: string }>;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <div className="paper-card p-6 sm:p-7">
        <p className="label-caps">Equipe · {user.storeNome}</p>
        <h1 className="ink-title text-[26px] text-[#172e54] mt-1">Caixa do mercadinho</h1>
        <p className="text-sm text-[#3b6ea5] mt-1">O dono pode cadastrar o caixa. O caixa anota compras e recebe pagamentos, mas não muda limite, não libera acima do limite e não apaga nada — valendo no servidor.</p>

        {sp.erro === "email_existe" && (
          <div role="alert" className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">E-mail já em uso.</div>
        )}

        <div className="mt-6">
          <h2 className="text-sm font-bold text-[#172e54]">Equipe atual ({users.length})</h2>
          <ul className="mt-3 divide-y divide-[#e6eefc] rounded-2xl border border-[#cbdaf0] overflow-hidden">
            {users.map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3 bg-white px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[#172e54]">{u.nome} <span className={`ml-2 text-xs px-2 py-0.5 rounded-full border ${u.role === "dono" ? "bg-[#172e54] text-white border-transparent" : "bg-[#f0f6ff] text-[#3b6ea5] border-[#cbdaf0]"}`}>{u.role}</span></p>
                  <p className="text-xs text-[#7fa3cc]">{u.email}</p>
                </div>
                <span className="text-xs font-mono text-[#7fa3cc]">{new Date(u.created_at).toLocaleDateString("pt-BR")}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6 rounded-2xl border border-[#cbdaf0] bg-[#f7f9ff] p-5">
          <h2 className="text-sm font-bold text-[#172e54]">Cadastrar caixa</h2>
          <form action={createCaixa} className="mt-4 space-y-3">
            <div>
              <label htmlFor="nome" className="block text-xs font-semibold text-[#172e54]">Nome *</label>
              <input id="nome" name="nome" required placeholder="Ex: Ana do caixa" className="field-input mt-1.5" />
            </div>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-[#172e54]">E-mail *</label>
              <input id="email" name="email" type="email" required placeholder="caixa@mercadinho.com" className="field-input mt-1.5" />
            </div>
            <div>
              <label htmlFor="senha" className="block text-xs font-semibold text-[#172e54]">Senha *</label>
              <input id="senha" name="senha" type="password" required placeholder="Mín. 6 caracteres" className="field-input mt-1.5" />
            </div>
            <button type="submit" className="btn-primary w-full">Cadastrar caixa</button>
          </form>
        </div>

        <p className="mt-4 text-xs text-[#7fa3cc]">Cada mercadinho só vê os próprios clientes. O caixa loga com seu e-mail/senha e continua logado ao recarregar.</p>
      </div>
    </div>
  );
}
