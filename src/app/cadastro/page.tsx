export const dynamic = "force-dynamic";
import { register } from "@/app/actions";

export default async function CadastroPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6">
      <div className="paper-card p-6 sm:p-7">
        <p className="label-caps">Caderneta · criar conta</p>
        <h1 className="ink-title text-[26px] text-[#172e54] mt-1">Criar conta do mercadinho</h1>
        <p className="text-sm text-[#3b6ea5] mt-1">Cada mercadinho vê só os próprios clientes. Grátis até 30 clientes.</p>

        {sp.erro === "email_existe" && (
          <div role="alert" className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Esse e-mail já está em uso. Tente entrar.
          </div>
        )}

        <form action={register} className="mt-6 space-y-4">
          <div>
            <label htmlFor="nomeLoja" className="block text-xs font-semibold text-[#172e54]">Nome do mercadinho *</label>
            <input id="nomeLoja" name="nomeLoja" required placeholder="Ex: Mercadinho do Seu João" className="field-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="nomeDono" className="block text-xs font-semibold text-[#172e54]">Seu nome (dono) *</label>
            <input id="nomeDono" name="nomeDono" required placeholder="Ex: João da Silva" autoComplete="name" className="field-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-[#172e54]">E-mail *</label>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="dono@seu-mercadinho.com" className="field-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="senha" className="block text-xs font-semibold text-[#172e54]">Senha *</label>
            <input id="senha" name="senha" type="password" required autoComplete="new-password" placeholder="Mín. 6 caracteres" className="field-input mt-1.5" />
            <p className="mt-1.5 text-xs text-[#7fa3cc]">Fica logado ao recarregar a página (cookie httpOnly de 7 dias).</p>
          </div>
          <button type="submit" className="btn-primary w-full">Criar conta e abrir o painel</button>
        </form>

        <p className="mt-4 text-center text-sm text-[#3b6ea5]">
          Já tem conta? <a href="/login" className="font-semibold text-[#172e54] underline">Entrar</a>
        </p>
      </div>
    </div>
  );
}
