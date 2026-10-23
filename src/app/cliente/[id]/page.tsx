export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getClientById, getClientHistorico, diasAtraso, isVencida } from "@/lib/caderneta";
import { formatBRL } from "@/lib/money";
import { createPurchase, createPurchaseLiberada, createPayment, updateClient, deleteClient, deletePurchase, deletePayment } from "@/app/actions";
import { getCurrentUser } from "@/lib/auth";
import { IconArrowLeft, IconCart, IconMoney, IconClock, IconAlert, IconLink, IconWhats, IconPencil, IconBook, IconTrash } from "@/components/icons";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR");
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function cobrarUrl(telefone: string, nome: string, saldo: number, dias: number, token: string) {
  const saldoStr = formatBRL(saldo);
  const link = `/c/${token}`;
  const msg = `Olá, ${nome}! Passando para lembrar com carinho do seu fiado no mercadinho. Seu saldo é ${saldoStr} (atrasado há ${dias} dia(s)). Você pode conferir seu histórico aqui: ${link} — quando puder, passe no balcão. Obrigado!`;
  const digits = telefone.replace(/\D/g, "");
  const phoneParam = digits.length >= 10 ? `55${digits.slice(-11)}` : "";
  const text = encodeURIComponent(msg);
  if (phoneParam) return `https://wa.me/${phoneParam}?text=${text}`;
  return `https://wa.me/?text=${text}`;
}

export default async function ClientePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ erro?: string; valor?: string; desc?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/login");

  const { id } = await params;
  const sp = await searchParams;
  const clientId = Number(id);
  const client = getClientById(clientId, me.store_id);
  if (!client) return notFound();

  const hist = getClientHistorico(clientId);
  const now = new Date();
  const vencidas = hist.purchases.filter((p) => isVencida(p, now));
  const saldo = hist.saldo;
  const acimaLimite = saldo > client.limite_centavos;
  const atrasado = vencidas.length > 0;
  const maxDias = vencidas.length ? Math.max(...vencidas.map((p) => diasAtraso(p.vencimento, now))) : 0;
  const publicPath = `/c/${client.token}`;
  const isCaixa = me.role === "caixa";

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      <nav aria-label="Voltar" className="mb-4 flex items-center justify-between gap-2">
        <a href="/painel" className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 -ml-2 text-sm font-medium text-[#3b6ea5] hover:text-[#172e54] hover:bg-[#f0f6ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea5]">
          <IconArrowLeft size={16} aria-hidden /> Voltar ao painel
        </a>
        <span className="text-xs text-[#7fa3cc] font-mono">{me.storeNome} · {me.role}</span>
      </nav>

      {sp.erro === "permissao_limite" && (
        <div role="alert" className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Caixa não pode alterar limite — só o dono.</div>
      )}
      {sp.erro === "permissao_liberar" && (
        <div role="alert" className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Caixa não pode liberar compra acima do limite — só o dono.</div>
      )}

      {/* Cabeçalho da ficha */}
      <section aria-labelledby="titulo-cliente" className="paper-card overflow-hidden">
        <div className="h-1.5 w-full bg-[#172e54]" aria-hidden />
        <div className="p-6 sm:p-7">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0">
              <p className="label-caps">Ficha do cliente · #{client.id}</p>
              <h1 id="titulo-cliente" className="ink-title mt-1 text-[28px] sm:text-[30px] leading-none text-[#172e54]">
                {client.nome}
              </h1>
              <p className="mt-2 text-sm text-[#3b6ea5]">
                {client.telefone || "sem telefone"} · cadastrado em {fmtDate(client.created_at)}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {saldo === 0 && <span className="badge badge-quitado">Quitado — nada devendo</span>}
                {saldo > 0 && !atrasado && <span className="badge badge-aberto">Em aberto</span>}
                {atrasado && (
                  <span className="badge badge-atraso">
                    <IconAlert size={13} aria-hidden /> Atrasado · {maxDias} dia(s)
                  </span>
                )}
                {acimaLimite && <span className="badge badge-limite">Acima do limite</span>}
              </div>
              {atrasado && (
                <a
                  href={cobrarUrl(client.telefone, client.nome, saldo, maxDias, client.token)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  <IconWhats size={16} aria-hidden /> Cobrar no WhatsApp
                </a>
              )}
            </div>

            <div className="lg:text-right shrink-0 rounded-2xl border border-[#cbdaf0] bg-[#f7f9ff] px-5 py-4 lg:min-w-[220px]">
              <p className="label-caps !text-[11px]">Saldo devedor</p>
              <p className={`mt-1 text-[26px] font-bold leading-none tabular-nums ${saldo > 0 ? "text-[#172e54]" : "text-emerald-700"}`}>{formatBRL(saldo)}</p>
              <p className="mt-1 text-xs text-[#7fa3cc]">Limite {formatBRL(client.limite_centavos)} · 30 dias · sem juros</p>
              <div className="meter-track mt-3" role="progressbar" aria-valuenow={Math.min(100, Math.round((saldo / Math.max(1, client.limite_centavos)) * 100))} aria-valuemin={0} aria-valuemax={100} aria-label="Uso do limite">
                <div
                  className={`meter-fill ${atrasado ? "bg-amber-500" : acimaLimite ? "bg-[#e85d4d]" : "bg-[#3b6ea5]"}`}
                  style={{ width: `${Math.min(100, Math.round((saldo / Math.max(1, client.limite_centavos)) * 100))}%` }}
                />
              </div>
              {isCaixa && <p className="mt-2 text-xs text-[#7fa3cc]">Você está como caixa — limite só com dono</p>}
            </div>
          </div>

          {/* Link público */}
          <div className="mt-6 flex flex-col sm:flex-row gap-3 sm:items-center justify-between rounded-2xl border border-[#cbdaf0] bg-[#f0f6ff] p-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white border border-[#cbdaf0] text-[#172e54]" aria-hidden>
                <IconLink size={16} />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-[#172e54] leading-none">Link do cliente</p>
                <p className="text-xs text-[#3b6ea5] mt-1">Mande no WhatsApp — ele vê só o próprio saldo e histórico</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              <code className="rounded-xl bg-white border border-[#cbdaf0] px-3 py-2 text-xs font-mono text-[#172e54] break-all max-w-[220px] sm:max-w-none">{publicPath}</code>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Seu saldo na Caderneta: ${formatBRL(saldo)}. Confira em: ${publicPath}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
              >
                <IconWhats size={16} aria-hidden /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="mt-6 grid lg:grid-cols-[380px_1fr] gap-6 items-start">
        {/* Coluna esquerda: ações */}
        <div className="space-y-6 lg:sticky lg:top-[80px]">
          <details className="paper-card p-4 sm:p-5 group">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-xl -m-1 p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea5]">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#172e54]">
                <IconPencil size={16} aria-hidden /> Editar cliente
              </span>
              <span className="text-xs font-medium text-[#7fa3cc] group-open:hidden">abrir</span>
              <span className="hidden text-xs font-medium text-[#7fa3cc] group-open:inline">fechar</span>
            </summary>
            <form action={updateClient} className="mt-4 space-y-3 border-t border-[#e6eefc] pt-4">
              <input type="hidden" name="id" value={client.id} />
              <div>
                <label htmlFor="edit-nome" className="block text-xs font-semibold text-[#172e54]">Nome</label>
                <input id="edit-nome" name="nome" defaultValue={client.nome} required autoComplete="name" className="field-input mt-1.5" />
              </div>
              <div>
                <label htmlFor="edit-tel" className="block text-xs font-semibold text-[#172e54]">Telefone</label>
                <input id="edit-tel" name="telefone" defaultValue={client.telefone} type="tel" inputMode="tel" autoComplete="tel" className="field-input mt-1.5" />
              </div>
              <div>
                <label htmlFor="edit-limite" className="block text-xs font-semibold text-[#172e54]">Limite de fiado {isCaixa && <span className="font-normal text-[#7fa3cc]">(só dono)</span>}</label>
                <input
                  id="edit-limite"
                  name="limite"
                  defaultValue={(client.limite_centavos / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  required
                  inputMode="decimal"
                  className="field-input mt-1.5"
                  readOnly={isCaixa}
                  aria-readonly={isCaixa}
                  title={isCaixa ? "Só o dono pode alterar limite" : undefined}
                />
                {isCaixa && <p className="mt-1 text-xs text-amber-700">Caixa não pode alterar limite — peça ao dono.</p>}
              </div>
              <button type="submit" className="btn-primary w-full">Salvar alterações</button>
            </form>
            {!isCaixa && (
              <form action={deleteClient} className="mt-3">
                <input type="hidden" name="id" value={client.id} />
                <button type="submit" className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100">
                  <IconTrash size={14} /> Apagar cliente
                </button>
              </form>
            )}
          </details>

          {/* Anotar compra */}
          <section aria-labelledby="titulo-compra" className="paper-card p-4 sm:p-5">
            <h2 id="titulo-compra" className="flex items-center gap-2 text-sm font-semibold text-[#172e54]">
              <IconCart size={16} aria-hidden /> Anotar compra
            </h2>
            <p className="text-xs text-[#7fa3cc] mt-1">Valor e o que foi levado. Vence em 30 dias.</p>

            {sp.erro === "limite" && (
              <div role="alert" className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-900 flex items-center gap-1.5">
                  <IconAlert size={14} aria-hidden /> Limite estourado
                </p>
                <p className="text-xs leading-5 text-amber-800 mt-1.5">
                  Essa compra de <strong>{formatBRL(Number(sp.valor))}</strong> deixaria o saldo em{" "}
                  <strong>{formatBRL(saldo + Number(sp.valor))}</strong>, acima do limite de {formatBRL(client.limite_centavos)}. Marque “Liberar mesmo assim” para registrar — fica anotado no histórico.
                </p>
                {!isCaixa ? (
                  <form action={createPurchaseLiberada} className="mt-3 flex gap-2">
                    <input type="hidden" name="client_id" value={client.id} />
                    <input type="hidden" name="descricao" value={sp.desc ? decodeURIComponent(sp.desc) : ""} />
                    <input type="hidden" name="valor" value={String(Number(sp.valor) / 100).replace(".", ",")} />
                    <button type="submit" className="flex-1 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600">
                      Liberar mesmo assim
                    </button>
                    <a href={`/cliente/${client.id}`} className="btn-ghost">Cancelar</a>
                  </form>
                ) : (
                  <p className="mt-2 text-xs text-amber-800">Caixa não pode liberar acima do limite — chame o dono.</p>
                )}
              </div>
            )}

            <form action={createPurchase} className="mt-4 space-y-3">
              <input type="hidden" name="client_id" value={client.id} />
              <div>
                <label htmlFor="comp-desc" className="block text-xs font-semibold text-[#172e54]">
                  O que foi levado <span className="text-[#e85d4d]" aria-hidden>*</span>
                </label>
                <input id="comp-desc" name="descricao" required placeholder="Ex: Arroz 5kg, óleo, café" className="field-input mt-1.5" />
              </div>
              <div>
                <label htmlFor="comp-valor" className="block text-xs font-semibold text-[#172e54]">
                  Valor <span className="text-[#e85d4d]" aria-hidden>*</span>
                </label>
                <input id="comp-valor" name="valor" required inputMode="decimal" placeholder="Ex: 42,50" className="field-input mt-1.5" aria-describedby="comp-valor-hint" />
                <p id="comp-valor-hint" className="mt-1.5 text-xs text-[#7fa3cc]">Saldo atual {formatBRL(saldo)} · limite {formatBRL(client.limite_centavos)}</p>
              </div>
              {!isCaixa && (
                <label className="flex items-start gap-2 rounded-xl border border-[#e6eefc] bg-[#f7f9ff] px-3 py-2.5 text-xs leading-4 text-[#3b6ea5] cursor-pointer hover:bg-white">
                  <input type="checkbox" name="liberar" className="mt-0.5 rounded border-[#b8cce8] text-[#172e54] focus:ring-[#3b6ea5]" />
                  <span>Liberar mesmo acima do limite (fica registrado no histórico)</span>
                </label>
              )}
              {isCaixa && <p className="text-xs text-[#7fa3cc]">Acima do limite será bloqueado — só o dono libera.</p>}
              <button type="submit" className="btn-primary w-full">Anotar no caderno</button>
            </form>
          </section>

          {/* Pagamento */}
          <section aria-labelledby="titulo-pag" className="paper-card p-4 sm:p-5">
            <h2 id="titulo-pag" className="flex items-center gap-2 text-sm font-semibold text-[#172e54]">
              <IconMoney size={16} aria-hidden /> Registrar pagamento
            </h2>
            <p className="text-xs text-[#7fa3cc] mt-1">Pode ser parcial. Abate primeiro as compras mais antigas.</p>
            <form action={createPayment} className="mt-4 space-y-3">
              <input type="hidden" name="client_id" value={client.id} />
              <div>
                <label htmlFor="pag-valor" className="block text-xs font-semibold text-[#172e54]">
                  Valor pago <span className="text-[#e85d4d]" aria-hidden>*</span>
                </label>
                <input id="pag-valor" name="valor" required inputMode="decimal" placeholder="Ex: 50,00" className="field-input mt-1.5" />
              </div>
              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 min-h-[42px] px-4 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">
                Registrar pagamento
              </button>
            </form>
          </section>
        </div>

        {/* Coluna direita: histórico */}
        <section aria-labelledby="titulo-historico" className="paper-card overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#cbdaf0] bg-[#fffef2] px-5 py-4">
            <h2 id="titulo-historico" className="ink-title flex items-center gap-2 text-[20px] text-[#172e54]">
              <IconBook size={18} aria-hidden /> Histórico
            </h2>
            <span className="text-xs font-mono text-[#7fa3cc]">{hist.purchases.length} compra(s) · {hist.payments.length} pagamento(s)</span>
          </div>

          <div className="p-5 sm:p-6 space-y-8">
            {/* Compras */}
            <div>
              <h3 className="label-caps">Compras — quanto ainda deve cada uma</h3>
              {hist.purchases.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-[#cbdaf0] bg-[#f7f9ff] px-4 py-6 text-center text-sm text-[#7fa3cc]">Nenhuma compra anotada ainda.</p>
              ) : (
                <ul className="mt-3 space-y-3" role="list">
                  {[...hist.purchases].reverse().map((p) => {
                    const vencida = isVencida(p, now);
                    const dias = vencida ? diasAtraso(p.vencimento, now) : 0;
                    const quitada = p.valor_restante_centavos === 0;
                    const pago = p.valor_centavos - p.valor_restante_centavos;
                    const pctPago = p.valor_centavos > 0 ? Math.round((pago / p.valor_centavos) * 100) : 0;
                    return (
                      <li
                        key={p.id}
                        className={`rounded-2xl border p-4 ${quitada ? "bg-emerald-50/60 border-emerald-200" : vencida ? "bg-amber-50 border-amber-200" : "bg-white border-[#cbdaf0]"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[14px] font-semibold text-[#172e54] leading-snug">{p.descricao}</p>
                            <p className="text-xs text-[#3b6ea5] mt-1">
                              {fmtDate(p.created_at)} · vence {fmtDate(p.vencimento)}{" "}
                              {vencida && <span className="font-semibold text-amber-700">· atrasada há {dias} dia(s)</span>}
                              {quitada && <span className="font-semibold text-emerald-700"> · quitada</span>}
                            </p>
                            {p.liberado_acima_limite ? (
                              <span className="badge badge-limite mt-2">Liberada acima do limite — registrado</span>
                            ) : null}
                            {vencida && (
                              <a href={cobrarUrl(client.telefone, client.nome, p.valor_restante_centavos, dias, client.token)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50">Cobrar esta compra</a>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-bold text-[#172e54] tabular-nums">{formatBRL(p.valor_centavos)}</p>
                            <p className={`text-xs font-semibold tabular-nums ${quitada ? "text-emerald-700" : p.valor_restante_centavos > 0 ? "text-amber-700" : "text-[#7fa3cc]"}`}>
                              {quitada ? "R$ 0,00 restante" : `falta ${formatBRL(p.valor_restante_centavos)}`}
                            </p>
                            {!isCaixa && (
                              <form action={deletePurchase} className="mt-2">
                                <input type="hidden" name="purchase_id" value={p.id} />
                                <input type="hidden" name="client_id" value={client.id} />
                                <button type="submit" className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"><IconTrash size={12} /> apagar</button>
                              </form>
                            )}
                          </div>
                        </div>
                        <div className="meter-track mt-3" aria-hidden>
                          <div className={`meter-fill ${quitada ? "bg-emerald-500" : vencida ? "bg-amber-500" : "bg-[#3b6ea5]"}`} style={{ width: `${pctPago}%` }} />
                        </div>
                        <p className="mt-1.5 text-[11px] font-mono text-[#7fa3cc]">Pago {formatBRL(pago)} de {formatBRL(p.valor_centavos)} · {pctPago}%</p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Pagamentos */}
            <div>
              <h3 className="label-caps">Pagamentos — abatendo as mais antigas primeiro (FIFO)</h3>
              {hist.payments.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-dashed border-[#cbdaf0] bg-[#f7f9ff] px-4 py-6 text-center text-sm text-[#7fa3cc]">Nenhum pagamento ainda.</p>
              ) : (
                <ul className="mt-3 space-y-2" role="list">
                  {[...hist.payments].reverse().map((pay) => {
                    const allocs = hist.allocByPayment.get(pay.id) ?? [];
                    return (
                      <li key={pay.id} className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-semibold text-emerald-900 flex items-center gap-1.5">
                            <IconMoney size={14} aria-hidden /> Pagamento · {formatBRL(pay.valor_centavos)}
                          </p>
                          <span className="text-xs text-emerald-700 font-mono">{fmtDateTime(pay.created_at)}</span>
                        </div>
                        {allocs.length > 0 ? (
                          <ul className="mt-2 space-y-1">
                            {allocs.map((a) => {
                              const compra = hist.purchases.find((p) => p.id === a.purchase_id);
                              return (
                                <li key={a.id} className="text-xs text-emerald-800 flex justify-between gap-2">
                                  <span className="truncate">→ abatido em “{compra?.descricao ?? `#${a.purchase_id}`}”</span>
                                  <span className="font-mono font-semibold tabular-nums">{formatBRL(a.valor_centavos)}</span>
                                </li>
                              );
                            })}
                          </ul>
                        ) : (
                          <p className="mt-1 text-xs text-emerald-700">Sem compras em aberto na época.</p>
                        )}
                        {!isCaixa && (
                          <form action={deletePayment} className="mt-2">
                            <input type="hidden" name="payment_id" value={pay.id} />
                            <input type="hidden" name="client_id" value={client.id} />
                            <button type="submit" className="text-xs text-red-600 hover:underline inline-flex items-center gap-1"><IconTrash size={12} /> apagar pagamento</button>
                          </form>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Linha do tempo */}
            <div>
              <h3 className="label-caps">Linha do tempo</h3>
              <ol className="mt-3 relative border-l border-[#cbdaf0] ml-2 pl-5 space-y-3">
                {hist.timeline.map((item, i) => (
                  <li key={i} className="relative">
                    <span className={`absolute -left-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-white shadow ${item.kind === "purchase" ? "bg-[#172e54]" : "bg-emerald-600"}`} aria-hidden />
                    <p className="text-xs font-mono text-[#7fa3cc]">{fmtDateTime(item.at)}</p>
                    {item.kind === "purchase" ? (
                      <p className="text-sm text-[#172e54]">
                        <strong>Compra</strong> · {item.purchase.descricao} · {formatBRL(item.purchase.valor_centavos)}{" "}
                        {item.purchase.liberado_acima_limite ? <span className="text-[#991b1b] font-semibold">(liberada acima do limite)</span> : null}
                      </p>
                    ) : (
                      <p className="text-sm text-emerald-900">
                        <strong>Pagamento</strong> · {formatBRL(item.payment.valor_centavos)}
                      </p>
                    )}
                  </li>
                ))}
                {hist.timeline.length === 0 && <p className="text-sm text-[#7fa3cc]">Nada por aqui ainda.</p>}
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
