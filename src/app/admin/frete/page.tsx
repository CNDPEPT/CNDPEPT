"use client";

import { useState, useEffect } from "react";
import { formatCurrency, BRAZILIAN_STATES } from "@/lib/constants";

interface ShippingRate {
  id: string;
  state: string;
  stateName: string;
  sedexPrice: number;
  transportadoraPrice: number;
}

const STATE_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AP: "Amapá", AM: "Amazonas", BA: "Bahia", CE: "Ceará",
  DF: "Distrito Federal", ES: "Espírito Santo", GO: "Goiás", MA: "Maranhão", MT: "Mato Grosso",
  MS: "Mato Grosso do Sul", MG: "Minas Gerais", PA: "Pará", PB: "Paraíba", PR: "Paraná",
  PE: "Pernambuco", PI: "Piauí", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul", RO: "Rondônia", RR: "Roraima", SC: "Santa Catarina",
  SP: "São Paulo", SE: "Sergipe", TO: "Tocantins",
};

export default function AdminFretePage() {
  const [rates, setRates] = useState<ShippingRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState("");
  const [showForm, setShowForm] = useState(false);

  // Form
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [sedexPrice, setSedexPrice] = useState("");
  const [transpPrice, setTranspPrice] = useState("");

  async function fetchRates() {
    try {
      const res = await fetch("/api/admin/shipping");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setRates(data);
      }
    } catch { /* ignore */ }
    setLoading(false);
  }

  useEffect(() => { fetchRates(); }, []);

  function toggleState(uf: string) {
    setSelectedStates((prev) =>
      prev.includes(uf) ? prev.filter((s) => s !== uf) : [...prev, uf]
    );
  }

  function selectAll() {
    setSelectedStates([...BRAZILIAN_STATES]);
  }

  function clearSelection() {
    setSelectedStates([]);
  }

  async function handleSave() {
    if (selectedStates.length === 0) {
      setFeedback("Selecione ao menos um estado.");
      setTimeout(() => setFeedback(""), 3000);
      return;
    }

    const res = await fetch("/api/admin/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        states: selectedStates,
        sedexPrice: parseFloat(sedexPrice) || 0,
        transportadoraPrice: parseFloat(transpPrice) || 0,
      }),
    });

    if (res.ok) {
      setShowForm(false);
      setSelectedStates([]);
      setSedexPrice("");
      setTranspPrice("");
      setFeedback(`Frete salvo para ${selectedStates.length} estado(s)!`);
      setTimeout(() => setFeedback(""), 3000);
      fetchRates();
    } else {
      const data = await res.json();
      setFeedback(data.error || "Erro ao salvar");
      setTimeout(() => setFeedback(""), 3000);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remover este frete?")) return;
    const res = await fetch("/api/admin/shipping", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      setFeedback("Frete removido!");
      setTimeout(() => setFeedback(""), 3000);
      fetchRates();
    }
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
        <div>
          <h1 className="text-base font-bold">Frete por Estado</h1>
          <p className="text-xs text-[#7b8fa8] mt-1">Sedex e Transportadora — valor fixo por estado</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? "Cancelar" : "+ Cadastrar Frete"}
        </button>
      </div>

      {feedback && (
        <div className="bg-[#0a2a1a] border border-[#0f5132] text-[#4ade80] px-2 py-1 rounded-md mb-2 text-xs">
          {feedback}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <div className="card-tech p-3 mb-3">
          <h3 className="font-semibold text-base mb-2">Novo Frete</h3>

          {/* State selection */}
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[11px] font-medium text-[#7b8fa8] uppercase tracking-wider">
                Estados ({selectedStates.length} selecionados)
              </label>
              <div className="flex gap-2">
                <button onClick={selectAll} className="text-[11px] text-[#00d4ff] hover:underline">Selecionar todos</button>
                <button onClick={clearSelection} className="text-[11px] text-[#7b8fa8] hover:underline">Limpar</button>
              </div>
            </div>
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-1">
              {BRAZILIAN_STATES.map((uf) => (
                <button
                  key={uf}
                  onClick={() => toggleState(uf)}
                  className={`py-1 px-1 rounded text-[11px] font-bold text-center transition-all ${
                    selectedStates.includes(uf)
                      ? "bg-[#00d4ff] text-[#060b18] shadow-[0_0_8px_rgba(0,212,255,0.3)]"
                      : "bg-[#0d1525] border border-[#1a2a44] text-[#7b8fa8] hover:border-[#00d4ff44]"
                  }`}
                >
                  {uf}
                </button>
              ))}
            </div>
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="block text-[11px] font-medium text-[#7b8fa8] uppercase tracking-wider mb-1">
                Sedex (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="input-field"
                value={sedexPrice}
                onChange={(e) => setSedexPrice(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-[#7b8fa8] uppercase tracking-wider mb-1">
                Transportadora (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="0.00"
                className="input-field"
                value={transpPrice}
                onChange={(e) => setTranspPrice(e.target.value)}
              />
            </div>
          </div>

          <button onClick={handleSave} className="btn-primary">
            Salvar Frete para {selectedStates.length} estado(s)
          </button>
        </div>
      )}

      {/* Table */}
      <div className="card-tech overflow-hidden table-responsive">
        <table className="table-tech">
          <thead>
            <tr>
              <th>UF</th>
              <th>Estado</th>
              <th>Sedex (R$)</th>
              <th>Transportadora (R$)</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center py-4 text-[#7b8fa8] text-xs">Carregando...</td></tr>
            ) : rates.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-4 text-[#7b8fa8] text-xs">Nenhum frete cadastrado. Clique em &quot;+ Cadastrar Frete&quot;.</td></tr>
            ) : rates.map((rate) => (
              <tr key={rate.id}>
                <td><span className="font-bold text-[#00d4ff]">{rate.state}</span></td>
                <td className="text-xs">{rate.stateName}</td>
                <td className="font-medium">{formatCurrency(rate.sedexPrice)}</td>
                <td className="font-medium">{formatCurrency(rate.transportadoraPrice)}</td>
                <td>
                  <button onClick={() => handleDelete(rate.id)} className="btn-danger text-xs py-1 px-2">Remover</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
