export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getFechamentoResumo } from "@/lib/caderneta";
import { formatBRL } from "@/lib/money";
import { IconBook, IconMoney, IconCart, IconAlert } from "@/components/icons";

export default async function FechamentoPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const f = getFechamentoResumo(user.store_id);
  const maxVal = Math.max(1, ...f.meses.map((m) => Math.max(m.vendido, m.pago)));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <section className="paper-card overflow-hidden">
        <div className="p-6 sm:p-8">
          <p className="label-caps">{user.storeNome} · fechamento do mês</p>
          <h1 className="ink-title text-[28px] sm:text-[32px] leading-none text-[#172e54] mt-1">Fechamento do mês</h1>
          <p className="text-sm text-[#3b6ea5] mt-2">Quanto foi vendido no fiado, quanto entrou de pagamento, quanto está atrasado e quem mais deve.</p>

          <div className="mt-6 grid sm:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-[#cbdaf0] bg-white p-5">
              <p className="label-caps flex items-center gap-1.5"><IconCart size={14} /> Vendido no fiado (mês)</p>
              <p className="mt-2 text-[22px] font-bold text-[#172e54] tabular-nums">{formatBRL(f.vendidoMes)}</p>
              <p className="text-xs text-[#7fa3cc]">compras do mês atual</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-5">
              <p className="label-caps flex items-center gap-1.5 text-emerald-800"><IconMoney size={14} /> Entrou de pagamento (mês)</p>
              <p className="mt-2 text-[22px] font-bold text-emerald-900 tabular-nums">{formatBRL(f.pagoMes)}</p>
              <p className="text-xs text-emerald-700/70">pagamentos do mês atual</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="label-caps flex items-center gap-1.5 text-amber-800"><IconAlert size={14} /> Atrasado agora</p>
              <p className="mt-2 text-[22px] font-bold text-amber-900 tabular-nums">{formatBRL(f.atrasadoAgora)}</p>
              <p className="text-xs text-amber-800/80">soma vencida de todos os clientes</p>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid lg:grid-cols-[1.4fr_0.9fr] gap-6">
        <section className="paper-card p-5 sm:p-6">
          <h2 className="text-sm font-bold text-[#172e54] flex items-center gap-2"><IconBook size={16} /> Gráfico mês a mês — últimos 6 meses</h2>
          <p className="text-xs text-[#7fa3cc] mt-1">Vendido no fiado e pago — já com histórico populado para o gráfico ter o que mostrar.</p>

          <div className="mt-5 overflow-x-auto">
            <div className="min-w-[520px]">
              {/* SVG bar chart */}
              <svg viewBox="0 0 560 220" className="w-full h-auto" role="img" aria-label="Gráfico de vendido e pago por mês">
                {/* grid lines */}
                {[0, 1, 2, 3, 4].map((i) => {
                  const y = 20 + i * 36;
                  return <line key={i} x1="40" x2="540" y1={y} y2={y} stroke="#e6eefc" strokeWidth="1" />;
                })}
                {/* bars */}
                {f.meses.map((m, idx) => {
                  const x = 50 + idx * 84;
                  const hVendido = Math.round((m.vendido / maxVal) * 140);
                  const hPago = Math.round((m.pago / maxVal) * 140);
                  const baseY = 164;
                  return (
                    <g key={m.label + idx}>
                      {/* vendido */}
                      <rect x={x} y={baseY - hVendido} width="30" height={hVendido} rx="6" fill="#172e54" />
                      {/* pago */}
                      <rect x={x + 34} y={baseY - hPago} width="30" height={hPago} rx="6" fill="#10b981" />
                      <text x={x + 32} y={180} textAnchor="middle" fontSize="11" fill="#3b6ea5" fontFamily="monospace">{m.label}</text>
                    </g>
                  );
                })}
                {/* labels y */}
                <text x="40" y="16" fontSize="10" fill="#7fa3cc" fontFamily="monospace">{formatBRL(maxVal)}</text>
                <text x="40" y="164" fontSize="10" fill="#7fa3cc" fontFamily="monospace">{formatBRL(0)}</text>
              </svg>
              <div className="mt-2 flex items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-[#172e54] inline-block" /> Vendido</span>
                <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-emerald-500 inline-block" /> Pago</span>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-6 gap-2 text-xs">
            {f.meses.map((m) => (
              <div key={m.label} className="rounded-xl border border-[#cbdaf0] bg-[#f7f9ff] p-2 text-center">
                <p className="font-bold text-[#172e54] capitalize">{m.label}</p>
                <p className="text-[#3b6ea5]">{formatBRL(m.vendido)}</p>
                <p className="text-emerald-700">{formatBRL(m.pago)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="paper-card p-5 sm:p-6">
          <h2 className="text-sm font-bold text-[#172e54]">Quem mais deve</h2>
          <p className="text-xs text-[#7fa3cc] mt-1">Top devedores do mercadinho — saldo em aberto.</p>
          {f.topDevedores.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-[#cbdaf0] bg-[#f7f9ff] px-4 py-6 text-center text-sm text-[#7fa3cc]">Ninguém devendo — tudo quitado.</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {f.topDevedores.map((c, i) => (
                <li key={c.id} className="flex items-center gap-3 rounded-2xl border border-[#cbdaf0] bg-white px-4 py-3">
                  <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#172e54] text-white text-xs font-bold">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <a href={`/cliente/${c.id}`} className="text-sm font-bold text-[#172e54] hover:underline">{c.nome}</a>
                    <p className="text-xs text-[#7fa3cc]">{c.telefone || "sem telefone"} {c.atrasado ? `· atrasado ${c.diasAtraso}d` : ""}</p>
                  </div>
                  <span className="text-sm font-bold tabular-nums text-[#172e54]">{formatBRL(c.saldo_centavos)}</span>
                </li>
              ))}
            </ul>
          )}
          <a href="/painel" className="btn-ghost w-full mt-4">Voltar ao painel</a>
        </section>
      </div>
    </div>
  );
}
