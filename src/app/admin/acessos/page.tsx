"use client";

import { useState, useEffect } from "react";

interface Access {
  id: string;
  email: string;
  fullName: string;
  isActive: boolean;
  hasPassword: boolean;
  createdAt: string;
}

export default function AdminAcessosPage() {
  const [list, setList] = useState<Access[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [showForm, setShowForm] = useState(false);

  // New access form
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");

  // Edit password
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPassword, setEditPassword] = useState("");

  async function fetchList() {
    const res = await fetch("/api/admin/access", { credentials: "include" });
    if (res.ok) setList(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchList(); }, []);

  function showFeedback(msg: string) {
    setFeedback(msg);
    setTimeout(() => setFeedback(""), 3000);
  }

  async function handleCreate() {
    if (!newEmail || !newPassword) {
      showFeedback("E-mail e senha são obrigatórios");
      return;
    }
    try {
      const res = await fetch("/api/admin/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: newEmail, password: newPassword }),
      });
      if (res.ok) {
        setShowForm(false);
        setNewEmail("");
        setNewPassword("");
        showFeedback("Acesso criado com sucesso!");
        fetchList();
      } else {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          showFeedback(data.error || "Erro ao criar acesso");
        } catch {
          showFeedback(`Erro (${res.status}): ${text.substring(0, 100) || "Sem detalhes"}`);
        }
      }
    } catch (err) {
      showFeedback("Erro de conexão ao criar acesso");
      console.error("Create access error:", err);
    }
  }

  async function handleUpdatePassword(id: string) {
    if (!editPassword.trim()) {
      showFeedback("Digite a nova senha");
      return;
    }
    const res = await fetch("/api/admin/access", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, password: editPassword }),
    });
    if (res.ok) {
      setEditingId(null);
      setEditPassword("");
      showFeedback("Senha atualizada!");
      fetchList();
    }
  }

  async function toggleActive(a: Access) {
    const res = await fetch("/api/admin/access", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: a.id, isActive: !a.isActive }),
    });
    if (res.ok) {
      showFeedback(a.isActive ? "Acesso desativado" : "Acesso ativado");
      fetchList();
    }
  }

  async function handleDelete(a: Access) {
    if (!confirm(`Excluir acesso de ${a.email}?`)) return;
    const res = await fetch("/api/admin/access", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: a.id }),
    });
    if (res.ok) {
      showFeedback("Acesso excluído");
      fetchList();
    } else {
      const data = await res.json();
      showFeedback(data.error || "Erro ao excluir");
    }
  }

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#0d1525] border border-[#1a2a44] text-[#e0e8f0] placeholder-[#4a5f7a] focus:outline-none focus:border-[#00d4ff] text-xs";

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h1 className="text-base font-bold">Gerenciar Acessos</h1>
          <p className="text-xs text-[#7b8fa8]">Crie e-mail e senha para seus clientes acessarem a loja</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancelar" : "+ Novo Acesso"}
        </button>
      </div>

      {feedback && (
        <div className="bg-[#0a2a1a] border border-[#0f5132] text-[#4ade80] px-2 py-1 rounded-md mb-2 text-xs">
          {feedback}
        </div>
      )}

      {showForm && (
        <div className="card-tech p-3 mb-3 max-w-md">
          <h3 className="font-semibold text-sm mb-2">Criar novo acesso</h3>
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-medium text-[#7b8fa8] uppercase tracking-wider mb-1">E-mail *</label>
              <input
                className={inputClass}
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#7b8fa8] uppercase tracking-wider mb-1">Senha *</label>
              <input
                className={inputClass}
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Senha de acesso"
              />
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={handleCreate} className="btn-primary">Criar Acesso</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      <div className="card-tech overflow-hidden table-responsive">
        <table className="table-tech">
          <thead>
            <tr>
              <th>E-mail</th>
              <th>Cliente</th>
              <th>Senha</th>
              <th>Status</th>
              <th>Criado em</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-4 text-[#7b8fa8] text-xs">Carregando...</td></tr>
            ) : list.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-4 text-[#7b8fa8] text-xs">Nenhum acesso criado</td></tr>
            ) : list.map((a) => (
              <tr key={a.id}>
                <td className="font-medium text-xs">{a.email}</td>
                <td className="text-xs text-[#7b8fa8]">{a.fullName || "—"}</td>
                <td>
                  {editingId === a.id ? (
                    <div className="flex items-center gap-1">
                      <input
                        className="px-2 py-1 rounded bg-[#0d1525] border border-[#1a2a44] text-[#e0e8f0] text-xs w-28"
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Nova senha"
                      />
                      <button onClick={() => handleUpdatePassword(a.id)} className="btn-primary text-xs py-1 px-2">OK</button>
                      <button onClick={() => { setEditingId(null); setEditPassword(""); }} className="btn-secondary text-xs py-1 px-1">✕</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingId(a.id); setEditPassword(""); }}
                      className="text-xs text-[#00d4ff] hover:underline"
                    >
                      {a.hasPassword ? "Alterar senha" : "Definir senha"}
                    </button>
                  )}
                </td>
                <td>
                  <span className={`badge ${a.isActive ? "badge-success" : "badge-danger"}`}>
                    {a.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="text-xs text-[#7b8fa8]">{new Date(a.createdAt).toLocaleDateString("pt-BR")}</td>
                <td>
                  <div className="flex gap-1">
                    <button onClick={() => toggleActive(a)} className="btn-secondary text-xs py-1 px-2">
                      {a.isActive ? "Desativar" : "Ativar"}
                    </button>
                    <button onClick={() => handleDelete(a)} className="btn-danger text-xs py-1 px-2">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
