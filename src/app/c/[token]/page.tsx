export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getClientByToken, getClientHistorico, diasAtraso, isVencida } from "@/lib/caderneta";
import { formatBRL } from "@/lib/money";
import { IconClock, IconAlert, IconBook } from "@/components/icons";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default async function PublicClientPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const client = getClientByToken(token);
  if (!client) return notFound();

  const hist = getClientHistorico(client.id);
  const now = new Date();
  const vencidas = hist.purchases.filter((p) => isVencida(p, now));
  const saldo = hist.saldo;
  const atrasado = vencidas.length > 0;
  const maxDias = atrasado ? Math.max(...vencidas.map((p) => diasAtraso(p.vencimento, now))) : 0;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6">
      <section aria-labelledby="titulo-cliente" className="paper-card overflow-hidden">
        <div className="h-1.5 w-full bg-[#172e54]" aria-hidden />
        <div className="p-6 sm:p-7">
          <p className="label-caps">Caderneta · seu fiado no mercadinho</p>
          <h1 id="titulo-cliente" className="ink-title mt-2 text-[28px] leading-none text-[#172e54]">
            Olá, {client.nome}!
          </h1>
          <p className="mt-2 text-sm leading-5 text-[#3b6ea5]">Aqui você confere seu saldo e o histórico — só o seu, sem ver os outros clientes.</p>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#cbdaf0] bg-white p-5">
              <p className="label-caps !text-[11px]">Seu saldo devedor</p>
              <p className={`mt-1 text-[26px] font-bold leading-none tabular-nums ${saldo > 0 ? "text-[#172e54]" : "text-emerald-700"}`}>{formatBRL(saldo)}</p>
              <p className="mt-2 text-xs font-medium">
                {saldo === 0 ? (
                  <span className="badge badge-quitado">Tudo quitado — obrigado!</span>
                ) : atrasado ? (
                  <span className="badge badge-atraso">Atrasado há {maxDias} dia(s)</span>
                ) : (
                  <span className="badge badge-aberto">Em dia</span>
                )}
              </p>
            </div>
            <div className={`rounded-2xl border p-5 ${atrasado ? "bg-amber-50 border-amber-200" : "bg-[#f0f6ff] border-[#cbdaf0]"}`}>
              <p className="label-caps !text-[11px] flex items-center gap-1.5" style={{ color: atrasado ? "#92400e" : undefined }}>
                {atrasado ? <IconAlert size={14} aria-hidden /> : <IconClock size={14} aria-hidden />} {atrasado ? "Atenção" : "Vencimento"}
              </p>
              <p className={`mt-2 text-sm leading-5 ${atrasado ? "text-amber-900" : "text-[#172e54]"}`}>
                {atrasado ? (
                  <>
                    Você tem <strong>{vencidas.length}</strong> compra(s) vencida(s). Passe no balcão quando puder.
                  </>
                ) : (
                  <>
                    Toda compra vence em <strong>30 dias</strong>. Sem juros — só controle.
                  </>
                )}
              </p>
            </div>
          </div>

          <p className="mt-4 text-xs text-[#7fa3cc]">Limite da sua ficha: {formatBRL(client.limite_centavos)} · valores com conta em centavos, sem erro.</p>
        </div>
      </section>

      <section aria-labelledby="titulo-historico" className="mt-6 paper-card overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#cbdaf0] bg-[#fffef2] px-5 py-4">
          <IconBook size={18} aria-hidden />
          <h2 id="titulo-historico" className="ink-title text-[18px] text-[#172e54]">Seu histórico</h2>
        </div>
        <div className="p-5 sm:p-6 space-y-8">
          <div>
            <h3 className="label-caps">Compras</h3>
            {hist.purchases.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-[#cbdaf0] bg-[#f7f9ff] px-4 py-6 text-center text-sm text-[#7fa3cc]">Nenhuma compra ainda.</p>
            ) : (
              <ul className="mt-3 space-y-3" role="list">
                {[...hist.purchases].reverse().map((p) => {
                  const vencida = isVencida(p, now);
                  const quitada = p.valor_restante_centavos === 0;
                  const pago = p.valor_centavos - p.valor_restante_centavos;
                  const pct = p.valor_centavos > 0 ? Math.round((pago / p.valor_centavos) * 100) : 0;
                  return (
                    <li key={p.id} className={`rounded-2xl border p-4 ${quitada ? "bg-emerald-50/60 border-emerald-200" : vencida ? "bg-amber-50 border-amber-200" : "bg-white border-[#cbdaf0]"}`}>
                      <div className="flex justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[#172e54]">{p.descricao}</p>
                          <p className="text-xs text-[#3b6ea5] mt-1">
                            {fmtDate(p.created_at)} · vence {fmtDate(p.vencimento)}{" "}
                            {vencida && <span className="font-semibold text-amber-700">· atrasada há {diasAtraso(p.vencimento, now)} dia(s)</span>}{" "}
                            {quitada && <span className="font-semibold text-emerald-700">· quitada</span>}
                          </p>
                          {p.liberado_acima_limite && <span className="badge badge-limite mt-2">Liberada acima do limite — anotado no caderno</span>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-[#172e54] tabular-nums">{formatBRL(p.valor_centavos)}</p>
                          <p className="text-xs font-semibold tabular-nums text-[#3b6ea5]">{quitada ? "quitado" : `falta ${formatBRL(p.valor_restante_centavos)}`}</p>
                        </div>
                      </div>
                      <div className="meter-track mt-3" aria-hidden>
                        <div className={`meter-fill ${quitada ? "bg-emerald-500" : vencida ? "bg-amber-500" : "bg-[#3b6ea5]"}`} style={{ width: `${pct}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div>
            <h3 className="label-caps">Pagamentos</h3>
            {hist.payments.length === 0 ? (
              <p className="mt-3 rounded-2xl border border-dashed border-[#cbdaf0] bg-[#f7f9ff] px-4 py-6 text-center text-sm text-[#7fa3cc]">Nenhum pagamento ainda.</p>
            ) : (
              <ul className="mt-3 space-y-2" role="list">
                {[...hist.payments].reverse().map((pay) => {
                  const allocs = hist.allocByPayment.get(pay.id) ?? [];
                  return (
                    <li key={pay.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                      <div className="flex justify-between gap-2">
                        <p className="text-sm font-semibold text-emerald-900">Pagamento · {formatBRL(pay.valor_centavos)}</p>
                        <span className="text-xs text-emerald-700 font-mono">{fmtDateTime(pay.created_at)}</span>
                      </div>
                      {allocs.length > 0 && (
                        <ul className="mt-2 space-y-1">
                          {allocs.map((a) => {
                            const c = hist.purchases.find((p) => p.id === a.purchase_id);
                            return (
                              <li key={a.id} className="text-xs text-emerald-800 flex justify-between gap-2">
                                <span className="truncate">→ abatido em “{c?.descricao ?? `#${a.purchase_id}`}”</span>
                                <span className="font-mono font-semibold tabular-nums">{formatBRL(a.valor_centavos)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="rounded-2xl bg-[#f7f9ff] border border-[#cbdaf0] p-4 text-xs leading-5 text-[#3b6ea5]">
            Dúvida? Passe no balcão e peça para conferir a ficha. Este link mostra só a sua conta — cada cliente tem o seu.
          </div>
        </div>
      </section>

      <p className="mt-4 text-center text-xs text-[#7fa3cc]">Caderneta — papel de caderno, caneta azul e conta certa no centavo.</p>
    </div>
  );
}
