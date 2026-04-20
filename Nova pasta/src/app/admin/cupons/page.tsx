"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/constants";

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  isActive: boolean;
  expiresAt: string | null;
  usageLimit: number | null;
  usageCount: number;
}

export default function AdminCuponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [feedback, setFeedback] = useState("");

  const [code, setCode] = useState("");
  const [type, setType] = useState("percentage");
  const [value, setValue] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [expiresAt, setExpiresAt] = useState("");
  const [usageLimit, setUsageLimit] = useState("");

  async function fetchCoupons() {
    const res = await fetch("/api/admin/coupons");
    if (res.ok) setCoupons(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchCoupons(); }, []);

  function openNew() {
    setEditing(null);
    setCode(""); setType("percentage"); setValue(""); setIsActive(true); setExpiresAt(""); setUsageLimit("");
    setShowForm(true);
  }

  function openEdit(c: Coupon) {
    setEditing(c);
    setCode(c.code); setType(c.type); setValue(String(c.value)); setIsActive(c.isActive);
    setExpiresAt(c.expiresAt ? c.expiresAt.split("T")[0] : "");
    setUsageLimit(c.usageLimit ? String(c.usageLimit) : "");
    setShowForm(true);
  }

  async function handleSave() {
    const body = { code, type, value, isActive, expiresAt: expiresAt || null, usageLimit: usageLimit || null, id: editing?.id };
    const res = await fetch("/api/admin/coupons", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowForm(false);
      setFeedback(editing ? "Cupom atualizado!" : "Cupom criado!");
      setTimeout(() => setFeedback(""), 3000);
      fetchCoupons();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este cupom?")) return;
    await fetch("/api/admin/coupons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setFeedback("Cupom excluído!");
    setTimeout(() => setFeedback(""), 3000);
    fetchCoupons();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold">Cupons</h1>
        <button onClick={openNew} className="btn-primary">+ Novo Cupom</button>
      </div>

      {feedback && (
        <div className="bg-[#0a2a1a] border border-[#0f5132] text-[#4ade80] px-2 py-1 rounded-md mb-2 text-xs">
          {feedback}
        </div>
      )}

      {showForm && (
        <div className="card-tech p-3 mb-3">
          <h3 className="font-semibold text-base mb-2">{editing ? "Editar Cupom" : "Novo Cupom"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Código</label>
              <input className="input-field" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Tipo</label>
              <select className="input-field" value={type} onChange={(e) => setType(e.target.value)}>
                <option value="percentage">Percentual (%)</option>
                <option value="fixed">Valor fixo (R$)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7b8fa8] mb-1">
                Valor ({type === "percentage" ? "%" : "R$"})
              </label>
              <input className="input-field" type="number" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Validade (opcional)</label>
              <input className="input-field" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Limite de uso (opcional)</label>
              <input className="input-field" type="number" value={usageLimit} onChange={(e) => setUsageLimit(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-[#00d4ff]" />
              <label className="text-xs">Ativo</label>
            </div>
          </div>
          <div className="mt-2 flex gap-2">
            <button onClick={handleSave} className="btn-primary">Salvar</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      <div className="card-tech overflow-hidden table-responsive">
        <table className="table-tech">
          <thead>
            <tr>
              <th>Código</th>
              <th>Tipo</th>
              <th>Valor</th>
              <th>Uso</th>
              <th>Validade</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-4 text-[#7b8fa8] text-xs">Carregando...</td></tr>
            ) : coupons.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-4 text-[#7b8fa8] text-xs">Nenhum cupom cadastrado</td></tr>
            ) : coupons.map((c) => (
              <tr key={c.id}>
                <td className="font-mono font-medium">{c.code}</td>
                <td>{c.type === "percentage" ? "Percentual" : "Valor fixo"}</td>
                <td>{c.type === "percentage" ? `${c.value}%` : formatCurrency(c.value)}</td>
                <td>{c.usageCount}{c.usageLimit ? `/${c.usageLimit}` : ""}</td>
                <td className="text-xs">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("pt-BR") : "—"}</td>
                <td><span className={`badge ${c.isActive ? "badge-success" : "badge-neutral"}`}>{c.isActive ? "Ativo" : "Inativo"}</span></td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="btn-secondary text-xs py-1 px-2">Editar</button>
                    <button onClick={() => handleDelete(c.id)} className="btn-danger text-xs py-1 px-2">Excluir</button>
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
