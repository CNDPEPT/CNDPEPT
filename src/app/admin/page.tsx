"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { STORE_CONFIG } from "@/lib/constants";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao fazer login");
        setLoading(false);
        return;
      }
      router.push("/admin/dashboard");
    } catch {
      setError("Erro ao conectar");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#060b18]">
      <div className="card-tech p-4 md:p-5 w-full max-w-md mx-4">
        <div className="text-center mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-2 border border-[#00d4ff33] bg-[#0a1628] shadow-[0_0_15px_rgba(0,212,255,0.2)]">
            <span className="text-[#00d4ff] font-bold text-sm">CP</span>
          </div>
          <h1 className="text-base font-bold text-[#e0e8f0]">{STORE_CONFIG.name}</h1>
          <p className="text-xs text-[#7b8fa8]">Painel Administrativo</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-md mb-3 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Login</label>
            <input
              className="input-field"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Senha</label>
            <input
              className="input-field"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
