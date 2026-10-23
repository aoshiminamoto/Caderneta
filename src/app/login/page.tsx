export const dynamic = "force-dynamic";
import { login } from "@/app/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const sp = await searchParams;
  return (
    <div className="mx-auto max-w-md px-4 sm:px-6">
      <div className="paper-card p-6 sm:p-7">
        <p className="label-caps">Caderneta · entrar</p>
        <h1 className="ink-title text-[26px] text-[#172e54] mt-1">Entrar no balcão</h1>
        <p className="text-sm text-[#3b6ea5] mt-1">Use o e-mail e a senha do seu mercadinho. Continua logado quando recarregar.</p>

        {sp.erro === "credenciais" && (
          <div role="alert" className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            E-mail ou senha incorretos. Tente de novo.
          </div>
        )}

        <form action={login} className="mt-6 space-y-4">
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-[#172e54]">E-mail</label>
            <input id="email" name="email" type="email" required autoComplete="email" placeholder="dono@seu-mercadinho.com" className="field-input mt-1.5" />
          </div>
          <div>
            <label htmlFor="senha" className="block text-xs font-semibold text-[#172e54]">Senha</label>
            <input id="senha" name="senha" type="password" required autoComplete="current-password" placeholder="••••••••" className="field-input mt-1.5" />
          </div>
          <button type="submit" className="btn-primary w-full">Entrar</button>
        </form>

        <p className="mt-4 text-center text-sm text-[#3b6ea5]">
          Não tem conta? <a href="/cadastro" className="font-semibold text-[#172e54] underline">Criar conta</a>
        </p>
        <p className="mt-2 text-center text-xs text-[#7fa3cc]">Exemplo: dono@exemplo.com / senha: exemplo123</p>
      </div>
    </div>
  );
}
