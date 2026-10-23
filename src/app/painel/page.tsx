export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getClientsResumo, getPainelResumo } from "@/lib/caderneta";
import { formatBRL } from "@/lib/money";
import { createClient } from "@/app/actions";
import { IconSearch, IconPlus, IconPhone, IconAlert, IconClock, IconBook, HeroIlustracao, IconWhats } from "@/components/icons";

function cobrarUrl(telefone: string, nome: string, saldo: number, dias: number, token: string) {
  const saldoStr = formatBRL(saldo);
  const link = `/c/${token}`;
  // baseUrl will be path only; WhatsApp message includes relative link — user can copy full
  const msg = `Olá, ${nome}! Passando para lembrar com carinho do seu fiado no mercadinho. Seu saldo é ${saldoStr} (atrasado há ${dias} dia(s)). Você pode conferir seu histórico aqui: ${link} — quando puder, passe no balcão. Obrigado!`;
  const digits = telefone.replace(/\D/g, "");
  const phoneParam = digits.length >= 10 ? `55${digits.slice(-11)}` : "";
  const text = encodeURIComponent(msg);
  if (phoneParam) return `https://wa.me/${phoneParam}?text=${text}`;
  return `https://wa.me/?text=${text}`;
}

export default async function PainelPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; erro?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const sp = await searchParams;
  const busca = sp.q?.trim() ?? "";
  const painel = getPainelResumo(user.store_id);
  const clientes = busca ? getClientsResumo(user.store_id, busca) : painel.clientes;
  const devendo = painel.clientes.filter((c) => c.saldo_centavos > 0).length;

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {sp.erro === "limite_plano" && (
        <div role="alert" className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <strong>Limite do plano grátis atingido:</strong> seu mercadinho tem 30 clientes — peça o plano pago para ilimitados.
          <a href="/fechamento" className="ml-2 underline font-semibold">Ver planos</a>
        </div>
      )}

      <section aria-labelledby="titulo-painel" className="paper-card overflow-hidden">
        <div className="grid lg:grid-cols-[1.35fr_0.85fr]">
          <div className="p-6 sm:p-8">
            <p className="label-caps">{user.storeNome} · {user.role === "dono" ? "dono" : "caixa"} · Painel do balcão</p>
            <h1 id="titulo-painel" className="ink-title mt-2 text-[30px] sm:text-[38px] leading-none text-[#172e54]">
              Painel do balcão
            </h1>
            <p className="mt-3 max-w-[52ch] text-[15px] leading-6 text-[#3b6ea5]">
              Tudo que está na rua, quem está atrasado e quem deve há mais tempo — sem virar discussão no balcão. Cada mercadinho só vê os próprios clientes.
            </p>

            <dl className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-2xl border border-[#cbdaf0] bg-white p-4">
                <dt className="label-caps !tracking-[0.10em]">Total na rua</dt>
                <dd className="mt-2 text-[22px] font-bold tracking-tight text-[#172e54] tabular-nums">{formatBRL(painel.totalRua)}</dd>
                <dd className="mt-1 text-xs text-[#7fa3cc]">{devendo} cliente(s) devendo</dd>
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                <dt className="label-caps !tracking-[0.10em] flex items-center gap-1.5 text-amber-800">
                  <IconAlert size={14} aria-hidden /> Atrasado
                </dt>
                <dd className="mt-2 text-[22px] font-bold text-amber-900 tabular-nums">{formatBRL(painel.totalAtrasado)}</dd>
                <dd className="mt-1 text-xs text-amber-800/80">{painel.qtdAtrasados} cliente(s) com conta vencida</dd>
              </div>
              <div className="rounded-2xl border border-[#cbdaf0] bg-[#f0f6ff] p-4">
                <dt className="label-caps !tracking-[0.10em] flex items-center gap-1.5">
                  <IconClock size={14} aria-hidden /> Fechamento
                </dt>
                <dd className="mt-2 text-sm leading-5 text-[#172e54]">
                  <a href="/fechamento" className="underline decoration-2 decoration-[#9bb7de] underline-offset-4">Ver fechamento do mês →</a>
                </dd>
                <dd className="mt-1 text-xs text-[#7fa3cc]">Vendido, recebido e gráfico 6 meses</dd>
              </div>
            </dl>
          </div>

          <div className="flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[#cbdaf0] bg-[#f7f9ff] p-6 sm:p-8" aria-hidden>
            <HeroIlustracao className="w-full h-auto max-h-[148px]" />
            <p className="mt-4 text-center text-xs leading-4 text-[#7fa3cc]">Ilustração à mão — caderno, espiral e caneta azul do balcão</p>
          </div>
        </div>
      </section>

      <section aria-label="Buscar e cadastrar" className="mt-6 paper-card p-3 sm:p-4">
        <div className="flex flex-col lg:flex-row gap-3 lg:items-start">
          <form action="/painel" method="get" className="flex flex-1 items-center gap-2 min-w-0" role="search" aria-label="Buscar clientes">
            <label htmlFor="q" className="sr-only">Buscar por nome ou telefone</label>
            <div className="relative flex-1 min-w-0">
              <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7fa3cc]" aria-hidden>
                <IconSearch />
              </span>
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={busca}
                placeholder="Buscar por nome ou telefone…"
                autoComplete="off"
                className="field-input !pl-10 !pr-3 h-[42px] !py-0"
                aria-label="Buscar por nome ou telefone"
              />
            </div>
            <button type="submit" className="btn-primary h-[42px] shrink-0">
              Buscar
            </button>
            {busca && (
              <a href="/painel" className="btn-ghost h-[42px] shrink-0">
                Limpar
              </a>
            )}
          </form>

          <details className="w-full lg:w-[300px] lg:shrink-0 group rounded-2xl border border-[#cbdaf0] bg-[#f7f9ff] open:bg-white open:shadow-sm transition-colors self-start">
            <summary className="flex h-[42px] cursor-pointer list-none items-center justify-between gap-3 px-4 select-none rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea5]">
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#172e54]">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[#172e54] text-white" aria-hidden>
                  <IconPlus size={16} />
                </span>
                Novo cliente
              </span>
              <span className="text-xs font-medium text-[#7fa3cc] group-open:hidden">abrir</span>
              <span className="hidden text-xs font-medium text-[#7fa3cc] group-open:inline">fechar</span>
            </summary>
            <div className="px-4 pb-4">
              <form action={createClient} className="space-y-3 border-t border-[#e6eefc] pt-4" aria-label="Cadastrar cliente">
                <div>
                  <label htmlFor="nome" className="block text-xs font-semibold text-[#172e54]">
                    Nome <span className="text-[#e85d4d]" aria-hidden>*</span>
                  </label>
                  <input id="nome" name="nome" required placeholder="Ex: Maria das Dores" autoComplete="name" className="field-input mt-1.5" />
                </div>
                <div>
                  <label htmlFor="telefone" className="block text-xs font-semibold text-[#172e54]">
                    Telefone
                  </label>
                  <input id="telefone" name="telefone" type="tel" inputMode="tel" placeholder="(11) 9xxxx-xxxx" autoComplete="tel" className="field-input mt-1.5" />
                </div>
                <div>
                  <label htmlFor="limite" className="block text-xs font-semibold text-[#172e54]">
                    Limite de fiado <span className="text-[#e85d4d]" aria-hidden>*</span>
                  </label>
                  <input id="limite" name="limite" required inputMode="decimal" placeholder="Ex: 500,00" className="field-input mt-1.5" aria-describedby="limite-hint" />
                  <p id="limite-hint" className="mt-1.5 text-xs text-[#7fa3cc]">
                    Use vírgula para centavos. Ex: 1.200,50
                  </p>
                </div>
                <button type="submit" className="btn-primary w-full">
                  Cadastrar cliente
                </button>
                <p className="text-xs text-[#7fa3cc] text-center">Grátis até 30 clientes</p>
              </form>
            </div>
          </details>
        </div>
      </section>

      <section aria-labelledby="titulo-clientes" className="mt-6 paper-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#cbdaf0] bg-[#fffef2] px-5 py-4">
          <h2 id="titulo-clientes" className="ink-title flex items-center gap-2 text-[20px] text-[#172e54]">
            <IconBook aria-hidden /> Clientes
            {busca && <span className="font-sans text-sm font-normal text-[#7fa3cc]">· busca: “{busca}”</span>}
          </h2>
          <p className="text-xs font-mono text-[#7fa3cc]">
            {clientes.length} encontrado(s) · ordenado por quem deve há mais tempo
          </p>
        </div>

        {clientes.length === 0 ? (
          <div className="p-10 text-center">
            <div className="mx-auto max-w-md">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0f6ff] border border-[#cbdaf0] text-[#7fa3cc]" aria-hidden>
                <IconBook />
              </div>
              <p className="ink-title mt-4 text-lg text-[#172e54]">Nenhum cliente por aqui</p>
              <p className="mt-1 text-sm leading-5 text-[#7fa3cc]">Tente outra busca ou cadastre um novo cliente no quadro acima.</p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[#e6eefc]" role="list">
            {clientes.map((c) => {
              const pct = c.limite_centavos > 0 ? Math.min(100, Math.round((c.saldo_centavos / c.limite_centavos) * 100)) : 0;
              const barColor = c.atrasado ? "bg-amber-500" : pct > 80 ? "bg-[#e85d4d]" : "bg-[#3b6ea5]";
              return (
                <li key={c.id} className="group flex flex-col lg:flex-row lg:items-center gap-4 px-5 py-5 hover:bg-[#f7f9ff] transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={`/cliente/${c.id}`}
                        className="rounded-lg -mx-1 px-1 py-0.5 text-[17px] font-bold leading-none text-[#172e54] underline-offset-4 decoration-2 decoration-[#9bb7de] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea5]"
                      >
                        {c.nome}
                      </a>
                      {c.saldo_centavos === 0 && <span className="badge badge-quitado">Quitado</span>}
                      {c.atrasado && (
                        <span className="badge badge-atraso">
                          <IconAlert size={12} aria-hidden /> Atrasado · {c.diasAtraso} dia(s)
                        </span>
                      )}
                      {!c.atrasado && c.saldo_centavos > 0 && <span className="badge badge-aberto">Em aberto</span>}
                      {c.saldo_centavos > c.limite_centavos && <span className="badge badge-limite">Acima do limite</span>}
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-2.5 text-xs text-[#3b6ea5]">
                      <span className="inline-flex items-center gap-1.5">
                        <IconPhone size={14} aria-hidden /> {c.telefone || "sem telefone"}
                      </span>
                      <span className="hidden sm:inline text-[#cbdaf0]" aria-hidden>·</span>
                      <span>Limite {formatBRL(c.limite_centavos)}</span>
                    </div>

                    <div
                      className="meter-track mt-3 w-full max-w-[360px]"
                      role="progressbar"
                      aria-valuenow={pct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`Uso do limite: ${pct}%`}
                    >
                      <div className={`meter-fill ${barColor}`} style={{ width: `${pct}%` }} />
                    </div>
                    <p className="mt-1 text-[11px] font-mono text-[#7fa3cc]">{pct}% do limite usado</p>
                  </div>

                  <div className="flex items-center gap-2 lg:justify-end flex-wrap">
                    <div className="text-left lg:text-right min-w-[120px]">
                      <p className="label-caps !text-[11px]">Saldo devedor</p>
                      <p className={`text-[18px] font-bold tabular-nums ${c.saldo_centavos > 0 ? "text-[#172e54]" : "text-emerald-700"}`}>{formatBRL(c.saldo_centavos)}</p>
                      {c.saldo_centavos > 0 && c.oldestDebtAt ? (
                        <p className="text-xs text-[#7fa3cc]">Devendo desde {new Date(c.oldestDebtAt).toLocaleDateString("pt-BR")}</p>
                      ) : c.saldo_centavos === 0 ? (
                        <p className="text-xs text-emerald-700">Nada pendente</p>
                      ) : null}
                    </div>
                    {c.atrasado && (
                      <a
                        href={cobrarUrl(c.telefone, c.nome, c.saldo_centavos, c.diasAtraso, c.token)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 shrink-0"
                        aria-label={`Cobrar ${c.nome} no WhatsApp`}
                      >
                        <IconWhats size={14} aria-hidden /> Cobrar
                      </a>
                    )}
                    <a href={`/cliente/${c.id}`} className="btn-ghost shrink-0" aria-label={`Ver ficha de ${c.nome}`}>
                      Ver ficha
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <p className="mt-4 text-center text-xs leading-4 text-[#7fa3cc]">Valores em reais, com conta em centavos — sem erro de centavo. Vencimento em 30 dias, sem juros.</p>
    </div>
  );
}
