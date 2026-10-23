import { HeroIlustracao, IconCheck, IconBook, IconAlert, IconCart, IconMoney, IconClock } from "@/components/icons";

export const dynamic = "force-dynamic";

export default function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* Hero */}
      <section className="paper-card overflow-hidden">
        <div className="grid lg:grid-cols-[1.3fr_0.9fr]">
          <div className="p-6 sm:p-8 lg:p-10">
            <p className="label-caps">Caderno de fiado · agora sem rasura</p>
            <h1 className="ink-title mt-2 text-[34px] sm:text-[42px] leading-[0.95] text-[#172e54]">
              A Caderneta do mercadinho,
              <br />
              <span className="text-[#3b6ea5]">sem perder o jeito do balcão.</span>
            </h1>
            <p className="mt-4 max-w-[52ch] text-[15px] leading-6 text-[#3b6ea5]">
              O que é a Caderneta: o seu caderno de fiado em app — anote compras, receba pagamentos, saiba na hora quem está atrasado e mande a cobrança no WhatsApp com um toque. Conta em centavos, vencimento em 30 dias, sem juros.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="/cadastro" className="btn-primary text-[15px] px-6">Criar conta grátis</a>
              <a href="/login" className="btn-ghost">Entrar</a>
            </div>
            <p className="mt-3 text-xs text-[#7fa3cc]">Grátis até 30 clientes · depois, ilimitado no plano pago · cada mercadinho vê só os seus</p>
            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              <span className="badge badge-quitado">✓ Sem planilha</span>
              <span className="badge badge-aberto">✓ No balcão, em 10 segundos</span>
              <span className="badge badge-atraso">✓ Cobrança educada</span>
            </div>
          </div>
          <div className="flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-[#cbdaf0] bg-[#f7f9ff] p-6 sm:p-8">
            <HeroIlustracao className="w-full h-auto max-h-[180px]" />
            <p className="mt-4 text-center text-xs leading-4 text-[#7fa3cc]">Papel pautado, espiral e caneta azul — agora com busca e saldo na hora</p>
            <div className="mt-4 rounded-2xl border border-[#cbdaf0] bg-white p-3 text-xs leading-5 text-[#3b6ea5]">
              <strong className="text-[#172e54]">No balcão:</strong> “Quanto devo?” → abre a ficha, mostra saldo, vencimento e manda o link no WhatsApp.
            </div>
          </div>
        </div>
      </section>

      {/* Antes e depois */}
      <section aria-labelledby="antes-depois" className="mt-6 grid md:grid-cols-2 gap-4">
        <h2 id="antes-depois" className="sr-only">Antes e depois do caderno de papel</h2>
        <div className="paper-card p-5 sm:p-6 bg-[#fffef2]">
          <p className="label-caps">Antes · caderno de papel</p>
          <h3 className="ink-title mt-1 text-xl text-[#172e54]">Folha rasgada, conta na cabeça</h3>
          <ul className="mt-3 space-y-2 text-sm leading-5 text-[#3b6ea5]">
            <li className="flex gap-2"><span className="text-[#e85d4d]">✕</span> “Tá anotado onde?” — procura página por página</li>
            <li className="flex gap-2"><span className="text-[#e85d4d]">✕</span> Soma com erro de centavo, discussão no balcão</li>
            <li className="flex gap-2"><span className="text-[#e85d4d]">✕</span> Quem está atrasado? Só de cabeça</li>
            <li className="flex gap-2"><span className="text-[#e85d4d]">✕</span> Cobrar no WhatsApp é copiar número e saldo na mão</li>
          </ul>
        </div>
        <div className="paper-card p-5 sm:p-6 bg-white border-[#3b6ea5]/20">
          <p className="label-caps" style={{ color: "#1e6b4a" }}>Depois · Caderneta</p>
          <h3 className="ink-title mt-1 text-xl text-[#172e54]">Tudo à mão, sem susto</h3>
          <ul className="mt-3 space-y-2 text-sm leading-5 text-[#172e54]">
            <li className="flex gap-2"><span className="text-emerald-600">✓</span> Busca por nome ou telefone em 1 segundo</li>
            <li className="flex gap-2"><span className="text-emerald-600">✓</span> Conta em centavos, sem erro de R$ 0,01</li>
            <li className="flex gap-2"><span className="text-emerald-600">✓</span> Lista ordenada por quem deve há mais tempo + selo “Atrasado”</li>
            <li className="flex gap-2"><span className="text-emerald-600">✓</span> Botão “Cobrar” já abre o WhatsApp com mensagem pronta</li>
          </ul>
        </div>
      </section>

      {/* Como funciona 3 passos */}
      <section aria-labelledby="como-funciona" className="mt-6 paper-card p-6 sm:p-8">
        <p className="label-caps">Como funciona</p>
        <h2 id="como-funciona" className="ink-title mt-1 text-[26px] text-[#172e54]">Em três passos, sem treinamento</h2>
        <div className="mt-6 grid md:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[#cbdaf0] bg-[#f7f9ff] p-5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#172e54] text-white font-bold">1</div>
            <h3 className="mt-3 font-bold text-[#172e54] flex items-center gap-2"><IconBook size={16} /> Cadastre o cliente</h3>
            <p className="mt-1 text-sm leading-5 text-[#3b6ea5]">Nome, telefone e limite de fiado. Vencimento automático em 30 dias.</p>
          </div>
          <div className="rounded-2xl border border-[#cbdaf0] bg-white p-5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#172e54] text-white font-bold">2</div>
            <h3 className="mt-3 font-bold text-[#172e54] flex items-center gap-2"><IconCart size={16} /> Anote a compra</h3>
            <p className="mt-1 text-sm leading-5 text-[#3b6ea5]">Descreva o que foi levado e o valor. Se passar do limite, pede liberação.</p>
          </div>
          <div className="rounded-2xl border border-[#cbdaf0] bg-white p-5">
            <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white font-bold">3</div>
            <h3 className="mt-3 font-bold text-[#172e54] flex items-center gap-2"><IconMoney size={16} /> Receba e cobre</h3>
            <p className="mt-1 text-sm leading-5 text-[#3b6ea5]">Pagamento parcial abate as mais antigas primeiro. Atrasado? Um toque no “Cobrar”.</p>
          </div>
        </div>
      </section>

      {/* Planos */}
      <section aria-labelledby="planos" className="mt-6">
        <div className="text-center max-w-2xl mx-auto">
          <p className="label-caps">Planos</p>
          <h2 id="planos" className="ink-title text-[26px] text-[#172e54]">Comece grátis, cresça sem susto</h2>
          <p className="mt-2 text-sm text-[#3b6ea5]">Oito clientes de exemplo já vêm no mercadinho de demonstração.</p>
        </div>
        <div className="mt-6 grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          <div className="paper-card p-6 sm:p-7">
            <h3 className="font-bold text-[#172e54]">Grátis</h3>
            <p className="mt-1 text-3xl font-bold text-[#172e54] tracking-tight">R$ 0<span className="text-sm font-normal text-[#7fa3cc]">/mês</span></p>
            <p className="mt-2 text-sm text-[#3b6ea5]">Para começar sem cartão.</p>
            <ul className="mt-4 space-y-2 text-sm text-[#3b6ea5]">
              <li className="flex gap-2"><IconCheck size={16} /> Até <strong>30 clientes</strong></li>
              <li className="flex gap-2"><IconCheck size={16} /> Compras, pagamentos e histórico</li>
              <li className="flex gap-2"><IconCheck size={16} /> Link do cliente + WhatsApp</li>
              <li className="flex gap-2"><IconCheck size={16} /> Fechamento do mês</li>
            </ul>
            <a href="/cadastro" className="btn-ghost w-full mt-6">Criar conta grátis</a>
          </div>
          <div className="rounded-2xl border border-[#172e54] bg-[#172e54] p-6 sm:p-7 text-white shadow-[0_1px_2px_rgba(23,46,84,0.06),0_8px_28px_rgba(23,46,84,0.08)]">
            <div className="inline-flex rounded-full bg-white/15 border border-white/20 px-3 py-1 text-xs font-semibold text-white">Mais escolhido</div>
            <h3 className="mt-3 font-bold text-white">Pago — Ilimitado</h3>
            <p className="mt-1 text-3xl font-bold tracking-tight text-white">R$ 29<span className="text-sm font-normal text-white/70">/mês</span></p>
            <p className="mt-2 text-sm text-white/70">Para o mercadinho que não para de crescer.</p>
            <ul className="mt-4 space-y-2 text-sm text-white">
              <li className="flex gap-2"><IconCheck size={16} /> <strong className="text-white">Clientes ilimitados</strong></li>
              <li className="flex gap-2"><IconCheck size={16} /> Tudo do grátis + prioridade</li>
              <li className="flex gap-2"><IconCheck size={16} /> Cada mercadinho só vê os seus</li>
              <li className="flex gap-2"><IconCheck size={16} /> Caixa com permissão limitada</li>
            </ul>
            <a href="/cadastro" className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white text-[#172e54] min-h-[42px] px-4 text-sm font-bold hover:bg-[#f0f6ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#172e54]">Assinar ilimitado</a>
            <p className="mt-2 text-center text-xs text-white/60">Demonstração com 8 clientes já inclusa</p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq" className="mt-6 paper-card p-6 sm:p-8">
        <p className="label-caps">Perguntas frequentes</p>
        <h2 id="faq" className="ink-title mt-1 text-[22px] text-[#172e54]">Tira-dúvidas do balcão</h2>
        <div className="mt-4 divide-y divide-[#e6eefc]">
          <details className="py-4 group">
            <summary className="cursor-pointer font-semibold text-[#172e54] list-none flex justify-between gap-4">Preciso instalar algo? <span className="text-[#7fa3cc] group-open:hidden">+</span><span className="text-[#7fa3cc] hidden group-open:inline">−</span></summary>
            <p className="mt-2 text-sm leading-5 text-[#3b6ea5]">Não. É só abrir no navegador do celular ou do computador do balcão. Continua logado quando recarrega a página.</p>
          </details>
          <details className="py-4 group">
            <summary className="cursor-pointer font-semibold text-[#172e54] list-none flex justify-between gap-4">Cada mercadinho vê os clientes do outro? <span className="text-[#7fa3cc] group-open:hidden">+</span><span className="text-[#7fa3cc] hidden group-open:inline">−</span></summary>
            <p className="mt-2 text-sm leading-5 text-[#3b6ea5]">Não. Cada conta é um mercadinho isolado. Os 8 clientes de exemplo ficam só no mercadinho de exemplo.</p>
          </details>
          <details className="py-4 group">
            <summary className="cursor-pointer font-semibold text-[#172e54] list-none flex justify-between gap-4">O caixa pode fazer tudo? <span className="text-[#7fa3cc] group-open:hidden">+</span><span className="text-[#7fa3cc] hidden group-open:inline">−</span></summary>
            <p className="mt-2 text-sm leading-5 text-[#3b6ea5]">O caixa anota compras e recebe pagamentos, mas não muda limite, não libera compra acima do limite e não apaga nada — e isso vale no servidor, não só no botão escondido.</p>
          </details>
          <details className="py-4 group">
            <summary className="cursor-pointer font-semibold text-[#172e54] list-none flex justify-between gap-4">Como funciona a cobrança no WhatsApp? <span className="text-[#7fa3cc] group-open:hidden">+</span><span className="text-[#7fa3cc] hidden group-open:inline">−</span></summary>
            <p className="mt-2 text-sm leading-5 text-[#3b6ea5]">Em cada cliente atrasado aparece o botão “Cobrar”. Ele abre o WhatsApp com mensagem educada já escrita, com saldo, dias de atraso e o link do cliente para ele conferir.</p>
          </details>
          <details className="py-4 group">
            <summary className="cursor-pointer font-semibold text-[#172e54] list-none flex justify-between gap-4">E o fechamento do mês? <span className="text-[#7fa3cc] group-open:hidden">+</span><span className="text-[#7fa3cc] hidden group-open:inline">−</span></summary>
            <p className="mt-2 text-sm leading-5 text-[#3b6ea5]">A tela de fechamento mostra quanto foi vendido no fiado, quanto entrou de pagamento, quanto está atrasado, quem mais deve e um gráfico mês a mês dos últimos seis meses — já com histórico populado.</p>
          </details>
        </div>
      </section>

      <section className="mt-6 paper-card p-6 sm:p-8 text-center bg-[#fffef2]">
        <h2 className="ink-title text-2xl text-[#172e54]">Pronto para trocar o caderno?</h2>
        <p className="mt-2 text-sm text-[#3b6ea5]">Crie sua conta e veja o painel com os clientes de exemplo — depois é só cadastrar os seus.</p>
        <div className="mt-4 flex justify-center gap-3">
          <a href="/cadastro" className="btn-primary">Criar conta</a>
          <a href="/login" className="btn-ghost">Entrar</a>
        </div>
      </section>
    </div>
  );
}
