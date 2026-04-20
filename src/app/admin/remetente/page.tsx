"use client";

import { useState, useEffect } from "react";
import { BRAZILIAN_STATES, maskCPF, maskPhone, maskCEP, isValidCPFFormat, isValidPhoneFormat, isValidCEPFormat } from "@/lib/constants";

interface SenderInfo {
  id: string;
  name: string;
  cpf: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
}

export default function AdminRemetentePage() {
  const [sender, setSender] = useState<SenderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error">("success");

  const [form, setForm] = useState({
    name: "",
    cpf: "",
    street: "",
    number: "",
    complement: "",
    district: "",
    city: "",
    state: "",
    zipCode: "",
    phone: "",
  });

  useEffect(() => {
    async function fetchSender() {
      const res = await fetch("/api/admin/sender");
      if (res.ok) {
        const data = await res.json();
        if (data) {
          setSender(data);
          setForm({
            name: data.name || "",
            cpf: data.cpf || "",
            street: data.street || "",
            number: data.number || "",
            complement: data.complement || "",
            district: data.district || "",
            city: data.city || "",
            state: data.state || "",
            zipCode: data.zipCode || "",
            phone: data.phone || "",
          });
        }
      }
      setLoading(false);
    }
    fetchSender();
  }, []);

  function showFeedback(msg: string, type: "success" | "error") {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedback(""), 4000);
  }

  async function handleSave() {
    if (!form.name || !form.street || !form.district || !form.city || !form.state || !form.zipCode) {
      showFeedback("Preencha todos os campos obrigatórios!", "error");
      return;
    }
    if (form.cpf && !isValidCPFFormat(form.cpf)) {
      showFeedback("CPF deve ter 11 dígitos. Ex: 000.000.000-00", "error");
      return;
    }
    if (!isValidCEPFormat(form.zipCode)) {
      showFeedback("CEP deve ter 8 dígitos. Ex: 00000-000", "error");
      return;
    }
    if (form.phone && !isValidPhoneFormat(form.phone)) {
      showFeedback("Telefone deve ter 10 ou 11 dígitos. Ex: (11) 99999-9999", "error");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/admin/sender", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const data = await res.json();
      setSender(data);
      showFeedback("Remetente salvo com sucesso!", "success");
    } else {
      showFeedback("Erro ao salvar remetente.", "error");
    }
    setSaving(false);
  }

  function handleChange(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <p className="text-sm text-[#7b8fa8]">Carregando...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-base font-bold mb-1">Remetente</h1>
      <p className="text-xs text-[#7b8fa8] mb-3">
        Cadastre o remetente que será utilizado nas etiquetas de envio (Correios e Loggi).
      </p>

      {feedback && (
        <div
          className={`px-2 py-1 rounded-md mb-2 text-xs ${
            feedbackType === "success"
              ? "bg-[#0a2a1a] border border-[#0f5132] text-[#4ade80]"
              : "bg-[#2a0a0a] border border-[#7f1d1d] text-[#f87171]"
          }`}
        >
          {feedback}
        </div>
      )}

      {sender && (
        <div className="card-tech p-3 mb-3">
          <h3 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">
            Remetente Atual
          </h3>
          <div className="text-xs space-y-0.5">
            <p className="font-bold text-sm text-[#e0e8f0]">{sender.name}</p>
            {sender.cpf && <p className="text-[#7b8fa8]">CPF: {sender.cpf}</p>}
            <p>
              {sender.street}{sender.number ? `, ${sender.number}` : ""}
              {sender.complement ? ` - ${sender.complement}` : ""}
            </p>
            <p>{sender.district}</p>
            <p>{sender.city} - {sender.state}</p>
            <p className="font-bold text-[#00d4ff]">CEP: {sender.zipCode}</p>
            {sender.phone && <p>Tel: {sender.phone}</p>}
          </div>
        </div>
      )}

      <div className="card-tech p-3">
        <h3 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-2">
          {sender ? "Atualizar Remetente" : "Cadastrar Remetente"}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] text-[#7b8fa8] mb-1">Nome *</label>
            <input
              className="input-field"
              placeholder="Nome completo do remetente"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#7b8fa8] mb-1">CPF</label>
            <input
              className="input-field"
              placeholder="000.000.000-00"
              value={form.cpf}
              onChange={(e) => handleChange("cpf", maskCPF(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#7b8fa8] mb-1">Rua *</label>
            <input
              className="input-field"
              placeholder="Rua, Av, etc."
              value={form.street}
              onChange={(e) => handleChange("street", e.target.value)}
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] text-[#7b8fa8] mb-1">Número</label>
              <input
                className="input-field"
                placeholder="123"
                value={form.number}
                onChange={(e) => handleChange("number", e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-[#7b8fa8] mb-1">Complemento</label>
              <input
                className="input-field"
                placeholder="Apto, sala..."
                value={form.complement}
                onChange={(e) => handleChange("complement", e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="block text-[11px] text-[#7b8fa8] mb-1">Bairro *</label>
            <input
              className="input-field"
              placeholder="Bairro"
              value={form.district}
              onChange={(e) => handleChange("district", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#7b8fa8] mb-1">Cidade *</label>
            <input
              className="input-field"
              placeholder="Cidade"
              value={form.city}
              onChange={(e) => handleChange("city", e.target.value)}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#7b8fa8] mb-1">UF *</label>
            <select
              className="input-field"
              value={form.state}
              onChange={(e) => handleChange("state", e.target.value)}
            >
              <option value="">Selecione...</option>
              {BRAZILIAN_STATES.map((uf) => (
                <option key={uf} value={uf}>{uf}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-[#7b8fa8] mb-1">CEP *</label>
            <input
              className="input-field"
              placeholder="00000-000"
              value={form.zipCode}
              onChange={(e) => handleChange("zipCode", maskCEP(e.target.value))}
            />
          </div>
          <div>
            <label className="block text-[11px] text-[#7b8fa8] mb-1">Telefone</label>
            <input
              className="input-field"
              placeholder="(11) 99999-9999"
              value={form.phone}
              onChange={(e) => handleChange("phone", maskPhone(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary disabled:opacity-50"
          >
            {saving ? "Salvando..." : "💾 Salvar Remetente"}
          </button>
        </div>
      </div>
    </div>
  );
}
