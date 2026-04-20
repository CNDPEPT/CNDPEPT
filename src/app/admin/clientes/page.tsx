"use client";

import { useState, useEffect } from "react";
import { formatCPF, maskCPF, BRAZILIAN_STATES, maskPhone, maskCEP, isValidPhoneFormat, isValidCEPFormat, isValidEmailFormat } from "@/lib/constants";

interface Customer {
  id: string;
  fullName: string;
  cpf: string;
  email: string;
  phone: string;
  zipCode: string;
  street: string;
  number: string;
  complement: string;
  district: string;
  city: string;
  state: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminClientesPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState("");
  const [editing, setEditing] = useState<Customer | null>(null);


  // Edit form state
  const [formName, setFormName] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formZipCode, setFormZipCode] = useState("");
  const [formStreet, setFormStreet] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formComplement, setFormComplement] = useState("");
  const [formDistrict, setFormDistrict] = useState("");
  const [formCity, setFormCity] = useState("");
  const [formState, setFormState] = useState("");

  async function fetchCustomers() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/customers?${params}`);
    if (res.ok) setCustomers(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchCustomers(); }, []);

  function openEdit(c: Customer) {
    setEditing(c);
    setFormName(c.fullName);
    setFormEmail(c.email);
    setFormPhone(c.phone);
    setFormPassword("");
    setFormZipCode(c.zipCode);
    setFormStreet(c.street);
    setFormNumber(c.number);
    setFormComplement(c.complement);
    setFormDistrict(c.district);
    setFormCity(c.city);
    setFormState(c.state);
  }

  async function handleSave() {
    if (!editing) return;
    if (!isValidEmailFormat(formEmail)) {
      setFeedback("E-mail inválido. Verifique o formato.");
      setTimeout(() => setFeedback(""), 3000);
      return;
    }
    if (formPhone && !isValidPhoneFormat(formPhone)) {
      setFeedback("Telefone deve ter 10 ou 11 dígitos.");
      setTimeout(() => setFeedback(""), 3000);
      return;
    }
    if (formZipCode && !isValidCEPFormat(formZipCode)) {
      setFeedback("CEP deve ter 8 dígitos.");
      setTimeout(() => setFeedback(""), 3000);
      return;
    }
    const res = await fetch("/api/admin/customers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: editing.id,
        fullName: formName,
        email: formEmail,
        phone: formPhone,
        password: formPassword || undefined,
        zipCode: formZipCode,
        street: formStreet,
        number: formNumber,
        complement: formComplement,
        district: formDistrict,
        city: formCity,
        state: formState,
      }),
    });
    if (res.ok) {
      setEditing(null);
      setFeedback("Cliente atualizado!");
      setTimeout(() => setFeedback(""), 3000);
      fetchCustomers();
    }
  }

  async function toggleActive(c: Customer) {
    const res = await fetch("/api/admin/customers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: c.id, isActive: !c.isActive }),
    });
    if (res.ok) {
      setFeedback(c.isActive ? "Cliente desativado" : "Cliente ativado");
      setTimeout(() => setFeedback(""), 3000);
      fetchCustomers();
    }
  }



  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-[#0d1525] border border-[#1a2a44] text-[#e0e8f0] placeholder-[#4a5f7a] focus:outline-none focus:border-[#00d4ff] text-xs";
  const labelClass = "block text-[11px] font-medium text-[#7b8fa8] uppercase tracking-wider mb-1";

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="btn-secondary text-xs mb-2">
          ← Voltar à lista
        </button>

        <h1 className="text-base font-bold mb-3">Editar Cliente</h1>

        <div className="card-tech p-3 max-w-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="md:col-span-2">
              <label className={labelClass}>Nome completo</label>
              <input className={inputClass} value={formName} onChange={(e) => setFormName(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>CPF</label>
              <input className={inputClass} value={formatCPF(editing.cpf)} disabled />
            </div>
            <div>
              <label className={labelClass}>E-mail</label>
              <input className={inputClass} value={formEmail} onChange={(e) => setFormEmail(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Telefone</label>
              <input className={inputClass} placeholder="(00) 00000-0000" value={formPhone} onChange={(e) => setFormPhone(maskPhone(e.target.value))} />
            </div>
            <div>
              <label className={labelClass}>Nova senha (deixe vazio para manter)</label>
              <input className={inputClass} type="password" placeholder="Nova senha..." value={formPassword} onChange={(e) => setFormPassword(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>CEP</label>
              <input className={inputClass} placeholder="00000-000" value={formZipCode} onChange={(e) => setFormZipCode(maskCEP(e.target.value))} />
            </div>
            <div className="md:col-span-2">
              <label className={labelClass}>Rua</label>
              <input className={inputClass} value={formStreet} onChange={(e) => setFormStreet(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Número</label>
              <input className={inputClass} value={formNumber} onChange={(e) => setFormNumber(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Complemento</label>
              <input className={inputClass} value={formComplement} onChange={(e) => setFormComplement(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Bairro</label>
              <input className={inputClass} value={formDistrict} onChange={(e) => setFormDistrict(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Cidade</label>
              <input className={inputClass} value={formCity} onChange={(e) => setFormCity(e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Estado</label>
              <select className={inputClass} value={formState} onChange={(e) => setFormState(e.target.value)}>
                <option value="">Selecione</option>
                {BRAZILIAN_STATES.map((uf) => (
                  <option key={uf} value={uf}>{uf}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button onClick={handleSave} className="btn-primary">Salvar</button>
            <button onClick={() => setEditing(null)} className="btn-secondary">Cancelar</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-base font-bold">Clientes</h1>
      </div>

      {feedback && (
        <div className="bg-[#0a2a1a] border border-[#0f5132] text-[#4ade80] px-2 py-1 rounded-md mb-2 text-xs">
          {feedback}
        </div>
      )}



      <div className="mb-2 flex gap-2">
        <input
          className="input-field max-w-xs text-xs"
          placeholder="Buscar por nome, e-mail ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchCustomers()}
        />
        <button onClick={fetchCustomers} className="btn-secondary text-xs">Buscar</button>
      </div>

      <div className="card-tech overflow-hidden table-responsive">
        <table className="table-tech">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CPF</th>
              <th>E-mail</th>
              <th>Telefone</th>
              <th>Cidade/UF</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-4 text-[#7b8fa8] text-xs">Carregando...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-4 text-[#7b8fa8] text-xs">Nenhum cliente encontrado</td></tr>
            ) : customers.map((c) => (
              <tr key={c.id}>
                <td className="font-medium text-xs">{c.fullName}</td>
                <td className="text-xs text-[#7b8fa8]">{formatCPF(c.cpf)}</td>
                <td className="text-xs">{c.email}</td>
                <td className="text-xs text-[#7b8fa8]">{c.phone}</td>
                <td className="text-xs text-[#7b8fa8]">{c.city}/{c.state}</td>
                <td>
                  <span className={`badge ${c.isActive ? "badge-success" : "badge-danger"}`}>
                    {c.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(c)} className="btn-secondary text-xs py-1 px-2">Editar</button>
                    <button onClick={() => toggleActive(c)} className="btn-secondary text-xs py-1 px-2">
                      {c.isActive ? "Desativar" : "Ativar"}
                    </button>
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
