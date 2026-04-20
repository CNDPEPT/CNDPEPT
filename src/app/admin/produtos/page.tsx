"use client";

import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/constants";

interface DosageStock {
  dosageMg: number;
  stock: number;
  price: number;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  dosages: string;
  dosageStocks: DosageStock[];
  consumed: number;
  originalStock: number;
  isActive: boolean;
}

export default function AdminProdutosPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState("");
  const [search, setSearch] = useState("");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [dosageStocks, setDosageStocks] = useState<DosageStock[]>([]);
  const [isActive, setIsActive] = useState(true);

  // New dosage input
  const [newMg, setNewMg] = useState("");
  const [newStock, setNewStock] = useState("");
  const [newPrice, setNewPrice] = useState("");

  // Expanded product in table
  const [expandedId, setExpandedId] = useState<string | null>(null);

  async function fetchProducts() {
    const res = await fetch("/api/admin/products");
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchProducts(); }, []);

  function openNew() {
    setEditing(null);
    setName(""); setDescription(""); setDosageStocks([]); setIsActive(true);
    setNewMg(""); setNewStock(""); setNewPrice("");
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setName(p.name); setDescription(p.description); setDosageStocks(p.dosageStocks || []); setIsActive(p.isActive);
    setNewMg(""); setNewStock(""); setNewPrice("");
    setShowForm(true);
  }

  function addDosage() {
    const mg = parseInt(newMg);
    const stock = parseInt(newStock) || 0;
    const price = parseFloat(newPrice) || 0;
    if (!mg || mg <= 0) return;
    if (dosageStocks.some(d => d.dosageMg === mg)) {
      setFeedback(`Dosagem ${mg}mg já existe!`);
      setTimeout(() => setFeedback(""), 3000);
      return;
    }
    setDosageStocks(prev => [...prev, { dosageMg: mg, stock, price }].sort((a, b) => a.dosageMg - b.dosageMg));
    setNewMg(""); setNewStock(""); setNewPrice("");
  }

  function removeDosage(mg: number) {
    setDosageStocks(prev => prev.filter(d => d.dosageMg !== mg));
  }

  function updateDosage(idx: number, field: "stock" | "price", value: number) {
    setDosageStocks(prev => prev.map((d, i) => i === idx ? { ...d, [field]: value } : d));
  }

  async function handleSave() {
    if (!name.trim()) {
      setFeedback("Nome do produto é obrigatório");
      setTimeout(() => setFeedback(""), 3000);
      return;
    }
    if (dosageStocks.length === 0) {
      setFeedback("Adicione pelo menos uma dosagem com estoque e preço");
      setTimeout(() => setFeedback(""), 3000);
      return;
    }

    const totalStock = dosageStocks.reduce((s, d) => s + d.stock, 0);
    const avgPrice = dosageStocks.length > 0 ? dosageStocks[0].price : 0;
    const dosagesStr = dosageStocks.map(d => String(d.dosageMg)).join(",");

    const body = {
      name,
      description,
      price: avgPrice,
      stock: totalStock,
      dosages: dosagesStr,
      dosageStocks,
      isActive,
      id: editing?.id,
    };

    const res = await fetch("/api/admin/products", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setShowForm(false);
      setFeedback(editing ? "Produto atualizado!" : "Produto criado!");
      setTimeout(() => setFeedback(""), 3000);
      fetchProducts();
    } else {
      const data = await res.json().catch(() => null);
      setFeedback(data?.error || "Erro ao salvar produto");
      setTimeout(() => setFeedback(""), 3000);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Tem certeza que deseja excluir este produto?")) return;
    const res = await fetch("/api/admin/products", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setFeedback("Produto excluído!");
      setTimeout(() => setFeedback(""), 3000);
      fetchProducts();
    }
  }

  async function toggleActive(p: Product) {
    await fetch("/api/admin/products", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
    });
    fetchProducts();
  }

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
        <h1 className="text-base font-bold">Produtos</h1>
        <button onClick={openNew} className="btn-primary">+ Novo Produto</button>
      </div>

      {feedback && (
        <div className="bg-[#0a2a1a] border border-[#0f5132] text-[#4ade80] px-2 py-1 rounded-md mb-2 text-xs">
          {feedback}
        </div>
      )}

      {/* Search */}
      <div className="mb-2">
        <input
          className="input-field max-w-xs text-xs"
          placeholder="Buscar por nome..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Form */}
      {showForm && (
        <div className="card-tech p-4 mb-3">
          <h3 className="font-semibold text-base mb-3">{editing ? "Editar Produto" : "Novo Produto"}</h3>

          {/* Product info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Nome do Produto *</label>
              <input className="input-field" placeholder="Ex: BPC-157" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-[#7b8fa8] mb-1">Descrição</label>
              <textarea className="input-field" rows={2} placeholder="Descrição do produto..." value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className="flex items-center gap-3">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="accent-[#00d4ff]" />
              <label className="text-xs">Produto ativo</label>
            </div>
          </div>

          {/* Dosages section */}
          <div className="border-t border-[#1a2a44] pt-3">
            <h4 className="text-sm font-semibold text-[#00d4ff] mb-2">Dosagens (MG)</h4>
            <p className="text-[11px] text-[#4a5f7a] mb-3">Cada dosagem tem seu próprio estoque e preço.</p>

            {/* Add new dosage */}
            <div className="flex flex-wrap items-end gap-2 mb-3 bg-[#0a1628] border border-[#1a2a44] rounded-lg p-3">
              <div className="w-24">
                <label className="block text-[10px] text-[#7b8fa8] uppercase tracking-wider mb-1">MG *</label>
                <input
                  type="number"
                  min="1"
                  className="input-field text-center text-xs"
                  placeholder="Ex: 10"
                  value={newMg}
                  onChange={(e) => setNewMg(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDosage())}
                />
              </div>
              <div className="w-24">
                <label className="block text-[10px] text-[#7b8fa8] uppercase tracking-wider mb-1">Estoque</label>
                <input
                  type="number"
                  min="0"
                  className="input-field text-center text-xs"
                  placeholder="0"
                  value={newStock}
                  onChange={(e) => setNewStock(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDosage())}
                />
              </div>
              <div className="w-28">
                <label className="block text-[10px] text-[#7b8fa8] uppercase tracking-wider mb-1">Preço R$</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="input-field text-center text-xs"
                  placeholder="0.00"
                  value={newPrice}
                  onChange={(e) => setNewPrice(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDosage())}
                />
              </div>
              <button onClick={addDosage} className="btn-primary text-xs py-2 px-4">+ Adicionar</button>
            </div>

            {/* Dosage list */}
            {dosageStocks.length === 0 ? (
              <p className="text-xs text-[#4a5f7a] italic">Nenhuma dosagem cadastrada. Adicione acima.</p>
            ) : (
              <div className="space-y-2">
                {dosageStocks.map((ds, idx) => (
                  <div key={ds.dosageMg} className="flex items-center gap-3 bg-[#0d1525] border border-[#1a2a44] rounded-lg px-3 py-2">
                    <span className="text-sm font-bold text-[#818cf8] w-16">{ds.dosageMg}mg</span>
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-[#7b8fa8]">Estoque:</label>
                      <input
                        type="number"
                        min="0"
                        className="input-field !p-1 text-center text-xs w-20"
                        value={ds.stock}
                        onChange={(e) => updateDosage(idx, "stock", parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-[10px] text-[#7b8fa8]">Preço:</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="input-field !p-1 text-center text-xs w-24"
                        value={ds.price}
                        onChange={(e) => updateDosage(idx, "price", parseFloat(e.target.value) || 0)}
                      />
                    </div>
                    <button onClick={() => removeDosage(ds.dosageMg)} className="ml-auto text-red-400 hover:text-red-300 text-xs font-bold px-2">✕</button>
                  </div>
                ))}
                <div className="flex justify-between text-xs text-[#7b8fa8] pt-1 border-t border-[#1a2a44]">
                  <span>Total: <strong className="text-[#e0e8f0]">{dosageStocks.length}</strong> dosagens</span>
                  <span>Estoque total: <strong className="text-[#4ade80]">{dosageStocks.reduce((s, d) => s + d.stock, 0)}</strong> unidades</span>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 flex gap-2 border-t border-[#1a2a44] pt-3">
            <button onClick={handleSave} className="btn-primary">Salvar Produto</button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      )}

      {/* Product list */}
      <div className="space-y-2">
        {loading ? (
          <div className="card-tech p-4 text-center text-[#7b8fa8] text-xs">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="card-tech p-4 text-center text-[#7b8fa8] text-xs">Nenhum produto encontrado</div>
        ) : filtered.map((p) => (
          <div key={p.id} className="card-tech overflow-hidden">
            {/* Product header row */}
            <div
              className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-[#0d1525] transition-colors"
              onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm truncate">{p.name}</span>
                  <span className={`badge text-[10px] ${p.isActive ? "badge-success" : "badge-neutral"}`}>
                    {p.isActive ? "Ativo" : "Inativo"}
                  </span>
                </div>
                {p.description && <p className="text-[11px] text-[#7b8fa8] truncate">{p.description}</p>}
              </div>
              <div className="flex items-center gap-4 text-xs shrink-0">
                <div className="text-center">
                  <p className="text-[10px] text-[#7b8fa8] uppercase">Dosagens</p>
                  <p className="font-bold text-[#818cf8]">{p.dosageStocks?.length || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-[#7b8fa8] uppercase">Estoque</p>
                  <p className={`font-bold ${p.stock === 0 ? "text-red-500" : p.stock < 5 ? "text-amber-400" : "text-[#4ade80]"}`}>{p.stock}</p>
                </div>
                <span className="text-[#4a5f7a] text-lg">{expandedId === p.id ? "▲" : "▼"}</span>
              </div>
            </div>

            {/* Expanded detail */}
            {expandedId === p.id && (
              <div className="border-t border-[#1a2a44] bg-[#060e1a]">
                {/* Dosages table */}
                {p.dosageStocks && p.dosageStocks.length > 0 ? (
                  <div className="p-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-[#7b8fa8] text-[10px] uppercase">
                          <th className="text-left pb-1">Dosagem</th>
                          <th className="text-right pb-1">Preço</th>
                          <th className="text-right pb-1">Estoque</th>
                        </tr>
                      </thead>
                      <tbody>
                        {p.dosageStocks.map((ds) => (
                          <tr key={ds.dosageMg} className="border-t border-[#1a2a44]">
                            <td className="py-1.5 font-bold text-[#818cf8]">{ds.dosageMg}mg</td>
                            <td className="py-1.5 text-right text-[#e0e8f0]">{formatCurrency(ds.price)}</td>
                            <td className="py-1.5 text-right">
                              <span className={ds.stock === 0 ? "text-red-500 font-bold" : ds.stock < 5 ? "text-amber-400 font-medium" : "text-[#4ade80] font-medium"}>
                                {ds.stock} un
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-[#4a5f7a] p-3 italic">Sem dosagens configuradas</p>
                )}

                {/* Actions */}
                <div className="flex gap-2 px-3 py-2 border-t border-[#1a2a44]">
                  <button onClick={() => openEdit(p)} className="btn-secondary text-xs py-1 px-3">Editar</button>
                  <button onClick={() => toggleActive(p)} className="btn-secondary text-xs py-1 px-3">
                    {p.isActive ? "Inativar" : "Ativar"}
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="btn-danger text-xs py-1 px-3">Excluir</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
