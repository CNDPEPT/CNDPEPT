"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STORE_CONFIG } from "@/lib/constants";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const trimmed = email.trim().toLowerCase();

    if (!trimmed || !trimmed.includes("@")) {
      setError("Digite um e-mail válido.");
      return;
    }
    if (!password) {
      setError("Digite sua senha.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/customers/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem("customer_email", data.customer.email);
        localStorage.setItem("customer_id", data.customer.id);
        localStorage.setItem("customer_name", data.customer.fullName);
        localStorage.setItem("customer_state", data.customer.state || "");
        if (data.profileComplete) {
          router.push("/home");
        } else {
          router.push("/cadastro");
        }
      } else {
        setError(data.error || "Credenciais inválidas");
      }
    } catch {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#060b18] via-[#060b18]/70 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#060b18] via-transparent to-[#060b18]/50 z-10" />
        <div className="absolute inset-0" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200&q=80')", backgroundSize: "cover", backgroundPosition: "center" }} />
        <div className="relative z-20 flex flex-col justify-end p-12 pb-16">
          <p className="text-[#00d4ff]/80 text-[10px] uppercase tracking-[0.3em] mb-1">Pesquisa &amp; Inovação</p>
          <h2 className="text-base font-bold text-white/90 leading-tight">Peptídeos de alta pureza<br />para pesquisa científica</h2>
          <div className="mt-4 h-[2px] w-24 bg-gradient-to-r from-[#00d4ff] to-transparent" />
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12 relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00d4ff]/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-[#00d4ff]/3 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

        <div className="w-full max-w-md relative z-10">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-[#00d4ff33] bg-[#0a1628] shadow-[0_0_20px_rgba(0,212,255,0.15)]">
              <span className="text-[#00d4ff] font-bold text-sm">CP</span>
            </div>
            <div>
              <h1 className="text-base font-bold text-[#e0e8f0]">{STORE_CONFIG.name}</h1>
              <p className="text-[10px] text-[#7b8fa8] uppercase tracking-[0.2em]">{STORE_CONFIG.slogan}</p>
            </div>
          </div>

          <div className="mb-4">
            <h2 className="text-base md:text-lg font-bold text-[#e0e8f0] mb-1">Bem-vindo</h2>
            <p className="text-[#7b8fa8] text-xs md:text-sm">Insira seu e-mail e senha para acessar o catálogo.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="email" className="block text-[11px] font-medium text-[#7b8fa8] uppercase tracking-wider mb-1">E-mail</label>
              <input id="email" type="email" autoComplete="email" autoFocus required placeholder="seu@email.com" value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d1525] border border-[#1a2a44] text-[#e0e8f0] placeholder-[#4a5f7a] focus:outline-none focus:border-[#00d4ff] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)] transition-all duration-200 text-sm" />
            </div>
            <div>
              <label htmlFor="password" className="block text-[11px] font-medium text-[#7b8fa8] uppercase tracking-wider mb-1">Senha</label>
              <input id="password" type="password" autoComplete="current-password" required placeholder="Sua senha" value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0d1525] border border-[#1a2a44] text-[#e0e8f0] placeholder-[#4a5f7a] focus:outline-none focus:border-[#00d4ff] focus:shadow-[0_0_0_3px_rgba(0,212,255,0.1)] transition-all duration-200 text-sm" />
            </div>

            {error && (
              <p className="text-red-400 text-xs bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full py-2 rounded-lg font-semibold text-sm transition-all duration-200 bg-gradient-to-r from-[#00b4d8] to-[#00d4ff] text-[#060b18] hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
              {loading ? (
                <span className="flex items-center justify-center gap-3">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Entrando...
                </span>
              ) : "Entrar"}
            </button>
          </form>

          <div className="mt-4 pt-3 border-t border-[#1a2a44]/50">
            <p className="text-[11px] text-[#4a5f7a] text-center">
              Acesso exclusivo para clientes cadastrados. Solicite seu acesso ao administrador.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
