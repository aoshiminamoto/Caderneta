import type { Metadata } from "next";
import { Patrick_Hand, Kalam, JetBrains_Mono, Inter } from "next/font/google";
import "./globals.css";
import { getCurrentUser } from "@/lib/auth";
import { logout } from "@/app/actions";

const display = Patrick_Hand({ weight: "400", subsets: ["latin"], variable: "--font-display", display: "swap" });
const body = Kalam({ weight: ["300", "400", "700"], subsets: ["latin"], variable: "--font-body", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });
const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });

export const metadata: Metadata = {
  title: "Caderneta — o fiado do mercadinho",
  description: "Caderno de fiado do mercadinho de bairro. Anote compras, receba pagamentos e veja quem está devendo há mais tempo.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable} ${mono.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[#eef3fb]">
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[100] focus:rounded-lg focus:bg-[#172e54] focus:px-4 focus:py-2 focus:text-white">
          Pular para o conteúdo
        </a>

        <header className="sticky top-0 z-30 border-b border-[#cbdaf0] bg-[#fffef2]/90 backdrop-blur supports-[backdrop-filter]:bg-[#fffef2]/80">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 h-[64px] flex items-center justify-between gap-3">
            <a href={user ? "/painel" : "/"} className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3b6ea5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffef2] -ml-1 px-1 py-1" aria-label="Caderneta — voltar ao início">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#172e54] text-[#fffef2] shadow-[0_2px_8px_rgba(23,46,84,0.18)]" aria-hidden>
                <CadernetaMark />
              </span>
              <span className="leading-none text-left">
                <span className="ink-title block text-[22px] font-bold text-[#172e54] tracking-tight">Caderneta</span>
                <span className="block text-[11px] tracking-[0.14em] text-[#3b6ea5] uppercase font-medium">o fiado do mercadinho</span>
              </span>
            </a>

            {user ? (
              <div className="flex items-center gap-2">
                <nav className="hidden sm:flex items-center gap-1" aria-label="Navegação do balcão">
                  <a href="/painel" className="rounded-xl px-3 py-2 text-sm font-semibold text-[#172e54] hover:bg-[#f0f6ff]">Painel</a>
                  <a href="/fechamento" className="rounded-xl px-3 py-2 text-sm font-semibold text-[#3b6ea5] hover:bg-[#f0f6ff]">Fechamento</a>
                  {user.role === "dono" && (
                    <a href="/equipe" className="rounded-xl px-3 py-2 text-sm font-semibold text-[#3b6ea5] hover:bg-[#f0f6ff]">Equipe</a>
                  )}
                </nav>
                <div className="hidden md:flex flex-col items-end leading-none mr-1">
                  <span className="text-xs font-bold text-[#172e54]">{user.storeNome}</span>
                  <span className="text-[11px] text-[#7fa3cc]">{user.nome} · {user.role === "dono" ? "dono" : "caixa"}</span>
                </div>
                <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${user.role === "dono" ? "bg-[#172e54] text-white border-transparent" : "bg-white text-[#3b6ea5] border-[#cbdaf0]"}`}>
                  {user.role === "dono" ? "dono" : "caixa"}
                </span>
                <form action={logout}>
                  <button type="submit" className="btn-ghost !min-h-[36px] !px-3 !py-1.5 text-xs">Sair</button>
                </form>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <a href="/login" className="hidden sm:inline-flex btn-ghost !min-h-[38px]">Entrar</a>
                <a href="/cadastro" className="btn-primary !min-h-[38px]">Criar conta</a>
              </div>
            )}
          </div>
          {user && (
            <div className="sm:hidden border-t border-[#cbdaf0] bg-white/80">
              <nav className="mx-auto max-w-6xl px-2 flex gap-1 py-1 overflow-x-auto" aria-label="Navegação móvel">
                <a href="/painel" className="shrink-0 rounded-lg bg-[#172e54] text-white px-3 py-1.5 text-xs font-semibold">Painel</a>
                <a href="/fechamento" className="shrink-0 rounded-lg border border-[#cbdaf0] bg-white px-3 py-1.5 text-xs font-semibold text-[#3b6ea5]">Fechamento</a>
                {user.role === "dono" && (
                  <a href="/equipe" className="shrink-0 rounded-lg border border-[#cbdaf0] bg-white px-3 py-1.5 text-xs font-semibold text-[#3b6ea5]">Equipe</a>
                )}
                <span className="ml-auto shrink-0 text-[11px] text-[#7fa3cc] self-center px-2 truncate max-w-[140px]">{user.storeNome} · {user.nome}</span>
              </nav>
            </div>
          )}
        </header>

        <main id="conteudo" className="flex-1 py-6 sm:py-8">
          {children}
        </main>

        <footer className="border-t border-[#cbdaf0] bg-[#f7f9ff]/80">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#7fa3cc]">
            <p>Feito para o balcão — papel de caderno, caneta azul e conta certa no centavo.</p>
            <p className="font-mono">Vencimento em 30 dias · sem juros</p>
          </div>
        </footer>
      </body>
    </html>
  );
}

function CadernetaMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M6 4.5a2 2 0 0 1 2-2h7l3 3v13a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2z" />
      <path d="M15 2.5v4a1 1 0 0 0 1 1h4" />
      <path d="M8 13h8M8 16h6M8 10h3" />
      <path d="M4 6.5c0-1 .7-1.2 1.6-.9" opacity="0.6" />
    </svg>
  );
}
