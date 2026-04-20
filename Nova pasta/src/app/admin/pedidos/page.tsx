"use client";

import { useState, useEffect } from "react";
import { formatCurrency, formatCPF, ORDER_STATUSES } from "@/lib/constants";

interface OrderItem {
  productNameSnapshot: string;
  dosage: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface StatusHistory {
  id: string;
  previousStatus: string;
  newStatus: string;
  changedAt: string;
  comment: string | null;
  changedByAdmin: { name: string } | null;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  totalValue: number;
  subtotal: number;
  shippingType: string;
  shippingRegion: string;
  shippingValue: number;
  discountValue: number;
  couponCode: string | null;
  customerNameSnapshot: string;
  customerCpfSnapshot: string;
  customerEmailSnapshot: string;
  customerPhoneSnapshot: string;
  shippingStreet: string;
  shippingNumber: string;
  shippingComplement: string;
  shippingDistrict: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  paymentProofPath: string | null;
  paymentReportedAt: string | null;
  internalNotes: string | null;
  trackingCode: string | null;
  items: OrderItem[];
  statusHistory: StatusHistory[];
}

export default function AdminPedidosPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [detail, setDetail] = useState<Order | null>(null);
  const [feedback, setFeedback] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");

  // Status change form (detail view)
  const [newStatus, setNewStatus] = useState("");
  const [statusComment, setStatusComment] = useState("");
  const [internalNotes, setInternalNotes] = useState("");
  const [trackingCode, setTrackingCode] = useState("");

  async function fetchOrders() {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/admin/orders?${params}`);
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }

  useEffect(() => { fetchOrders(); }, [statusFilter]);

  function openDetail(order: Order) {
    setDetail(order);
    setNewStatus(order.status);
    setInternalNotes(order.internalNotes || "");
    setTrackingCode(order.trackingCode || "");
  }

  async function updateStatus() {
    if (!detail) return;
    const res = await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: detail.id,
        status: newStatus,
        comment: statusComment,
        internalNotes,
        trackingCode,
      }),
    });
    if (res.ok) {
      const updated = await res.json();
      setDetail(updated);
      setFeedback("Pedido atualizado!");
      setStatusComment("");
      setTimeout(() => setFeedback(""), 3000);
      fetchOrders();
    }
  }

  async function changeStatusInline(orderId: string, status: string) {
    const res = await fetch("/api/admin/orders", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, status }),
    });
    if (res.ok) {
      setFeedback("Status atualizado!");
      setTimeout(() => setFeedback(""), 3000);
      fetchOrders();
    }
  }

  async function bulkChangeStatus() {
    if (selected.size === 0 || !bulkStatus) return;
    const promises = Array.from(selected).map((orderId) =>
      fetch("/api/admin/orders", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: bulkStatus }),
      })
    );
    await Promise.all(promises);
    setFeedback(`Status de ${selected.size} pedido(s) alterado para "${bulkStatus}"!`);
    setTimeout(() => setFeedback(""), 4000);
    setSelected(new Set());
    setBulkStatus("");
    fetchOrders();
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === orders.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map((o) => o.id)));
    }
  }

  function printSelected() {
    if (selected.size === 0) return;
    const ids = Array.from(selected).join(",");
    window.open(`/admin/pedidos/imprimir-correios?ids=${ids}`, "_blank");
  }

  function statusBadge(status: string) {
    const map: Record<string, string> = {
      "Aguardando pagamento": "badge-warning",
      "Enviar": "badge-info",
      "Etiqueta impressa": "badge-neutral",
      "Enviado": "badge-success",
    };
    return map[status] || "badge-neutral";
  }

  if (detail) {
    return (
      <div>
        <button onClick={() => { setDetail(null); fetchOrders(); }} className="btn-secondary text-xs mb-2">
          ← Voltar à lista
        </button>

        {feedback && (
          <div className="bg-[#0a2a1a] border border-[#0f5132] text-[#4ade80] px-2 py-1 rounded-md mb-2 text-xs">
            {feedback}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
          <div>
            <h1 className="text-base font-bold">Pedido {detail.orderNumber}</h1>
            <p className="text-xs text-[#7b8fa8]">
              Criado em {new Date(detail.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
          <span className={`badge ${statusBadge(detail.status)}`}>{detail.status}</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          {/* Client info */}
          <div className="card-tech p-2 md:p-3">
            <h3 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Cliente</h3>
            <p className="font-medium text-sm">{detail.customerNameSnapshot}</p>
            <p className="text-xs text-[#7b8fa8]">CPF: {formatCPF(detail.customerCpfSnapshot)}</p>
            <p className="text-xs text-[#7b8fa8]">{detail.customerEmailSnapshot}</p>
            <p className="text-xs text-[#7b8fa8]">{detail.customerPhoneSnapshot}</p>
          </div>

          {/* Delivery */}
          <div className="card-tech p-3">
            <h3 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Entrega</h3>
            <p className="text-xs">{detail.shippingStreet}, {detail.shippingNumber} {detail.shippingComplement ? `- ${detail.shippingComplement}` : ""}</p>
            <p className="text-xs">{detail.shippingDistrict} — {detail.shippingCity}/{detail.shippingState}</p>
            <p className="text-xs">CEP: {detail.shippingZipCode}</p>
            <p className="text-xs mt-1">Frete: {detail.shippingType === "sedex" ? "SEDEX" : "Transportadora"} ({detail.shippingRegion})</p>
          </div>

          {/* Items */}
          <div className="card-tech p-3">
            <h3 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Itens</h3>
            <div className="space-y-1">
              {detail.items.map((item, i) => (
                <div key={i} className="flex justify-between text-xs">
                  <span>{item.productNameSnapshot}{item.dosage ? ` (${item.dosage})` : ""} x{item.quantity} @ {formatCurrency(item.unitPrice)}</span>
                  <span className="font-medium">{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-[#1a2a44] mt-2 pt-2 space-y-1 text-xs">
              <div className="flex justify-between"><span>Subtotal</span><span>{formatCurrency(detail.subtotal)}</span></div>
              <div className="flex justify-between"><span>Frete</span><span>{formatCurrency(detail.shippingValue)}</span></div>
              {detail.discountValue > 0 && (
                <div className="flex justify-between text-[#4ade80]"><span>Desconto{detail.couponCode ? ` (${detail.couponCode})` : ""}</span><span>-{formatCurrency(detail.discountValue)}</span></div>
              )}
              <div className="flex justify-between font-bold text-sm pt-1 border-t border-[#1a2a44]">
                <span>Total</span><span className="text-[#00d4ff]">{formatCurrency(detail.totalValue)}</span>
              </div>
            </div>
          </div>

          {/* Payment proof */}
          <div className="card-tech p-3">
            <h3 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Comprovante</h3>
            {detail.paymentProofPath ? (
              <div>
                <p className="text-xs text-[#4ade80] mb-1">✓ Comprovante enviado</p>
                {detail.paymentReportedAt && (
                  <p className="text-[11px] text-[#7b8fa8]">Enviado em: {new Date(detail.paymentReportedAt).toLocaleString("pt-BR")}</p>
                )}
                <a href={detail.paymentProofPath} target="_blank" rel="noopener noreferrer" className="btn-secondary text-[11px] mt-1 inline-block">
                  Ver comprovante
                </a>
              </div>
            ) : (
              <p className="text-xs text-amber-400">Nenhum comprovante enviado</p>
            )}
          </div>

          {/* Status change */}
          <div className="card-tech p-3">
            <h3 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Alterar Status</h3>
            <select className="input-field mb-1 text-xs" value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <textarea
              className="input-field mb-1 text-xs"
              rows={2}
              placeholder="Observação da alteração (opcional)"
              value={statusComment}
              onChange={(e) => setStatusComment(e.target.value)}
            />
            <button onClick={updateStatus} className="btn-primary text-xs">Salvar Status</button>
          </div>

          {/* Tracking code */}
          <div className="card-tech p-3">
            <h3 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Código de Rastreio</h3>
            <input
              className="input-field mb-1 text-xs"
              placeholder="Ex: BR123456789BR"
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
            />
            <button onClick={updateStatus} className="btn-primary text-xs">Salvar Rastreio</button>
            {detail.trackingCode && (
              <p className="text-[11px] text-[#4ade80] mt-1">Rastreio atual: {detail.trackingCode}</p>
            )}
          </div>

          {/* Internal notes */}
          <div className="card-tech p-3">
            <h3 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Observação Interna</h3>
            <textarea
              className="input-field mb-1 text-xs"
              rows={3}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
            />
            <button onClick={updateStatus} className="btn-primary text-xs">Salvar</button>
          </div>

          {/* Status history */}
          <div className="card-tech p-3 lg:col-span-2">
            <h3 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-1">Histórico de Status</h3>
            {detail.statusHistory.length === 0 ? (
              <p className="text-xs text-[#7b8fa8]">Nenhum histórico</p>
            ) : (
              <div className="space-y-1">
                {detail.statusHistory.map((h) => (
                  <div key={h.id} className="flex items-start gap-2 text-xs border-l-2 border-[#1a2a44] pl-2 py-0.5">
                    <div className="flex-1">
                      <p>
                        {h.previousStatus ? (
                          <><span className="text-[#7b8fa8]">{h.previousStatus}</span> → </>
                        ) : null}
                        <strong>{h.newStatus}</strong>
                      </p>
                      {h.comment && <p className="text-[#7b8fa8] text-[11px]">{h.comment}</p>}
                    </div>
                    <div className="text-right text-[11px] text-[#7b8fa8]">
                      <p>{new Date(h.changedAt).toLocaleString("pt-BR")}</p>
                      {h.changedByAdmin && <p>{h.changedByAdmin.name}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
        <h1 className="text-base font-bold">Pedidos</h1>
        <div className="flex gap-2 flex-wrap">
          <a href="/admin/pedidos/imprimir-correios" target="_blank" className="btn-primary">
            🖨️ Imprimir Correios (Enviar)
          </a>
          <a href="/admin/pedidos/imprimir-loggi" className="btn-primary">
            🖨️ Imprimir Loggi
          </a>
          <a href="/api/admin/orders/export" className="btn-secondary">
            Exportar CSV
          </a>
        </div>
      </div>

      {feedback && (
        <div className="bg-[#0a2a1a] border border-[#0f5132] text-[#4ade80] px-2 py-1 rounded-md mb-2 text-xs">
          {feedback}
        </div>
      )}

      {/* Bulk actions bar */}
      {selected.size > 0 && (
        <div className="card-tech p-2 mb-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 border-[#00d4ff33]">
          <span className="text-xs font-semibold text-[#00d4ff]">
            {selected.size} selecionado(s)
          </span>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="bg-[#0a1628] border border-[#1a2a44] text-[#e0e8f0] rounded-lg px-2 py-1 text-xs focus:outline-none focus:border-[#00d4ff]"
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value)}
            >
              <option value="">Alterar status para...</option>
              {ORDER_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={bulkChangeStatus}
              disabled={!bulkStatus}
              className="btn-primary text-xs disabled:opacity-40"
            >
              Aplicar Status
            </button>
            <button
              onClick={printSelected}
              className="btn-secondary text-xs"
            >
              🖨️ Imprimir Selecionados
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="text-xs text-[#7b8fa8] hover:text-[#e0e8f0] underline"
            >
              Limpar seleção
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-2">
        <input
          className="input-field w-full sm:max-w-xs text-xs"
          placeholder="Buscar por número, nome ou CPF..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchOrders()}
        />
        <select className="input-field max-w-xs text-xs" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <button onClick={fetchOrders} className="btn-primary text-xs">Filtrar</button>
      </div>

      {/* Table */}
      <div className="card-tech overflow-hidden table-responsive">
        <table className="table-tech">
          <thead>
            <tr>
              <th className="w-8">
                <input
                  type="checkbox"
                  checked={orders.length > 0 && selected.size === orders.length}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 accent-[#00d4ff] cursor-pointer"
                />
              </th>
              <th>Pedido</th>
              <th>Data</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-4 text-[#7b8fa8] text-xs">Carregando...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={7} className="text-center py-4 text-[#7b8fa8] text-xs">Nenhum pedido encontrado</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className={selected.has(o.id) ? "bg-[#0a1628]" : ""}>
                <td>
                  <input
                    type="checkbox"
                    checked={selected.has(o.id)}
                    onChange={() => toggleSelect(o.id)}
                    className="w-3.5 h-3.5 accent-[#00d4ff] cursor-pointer"
                  />
                </td>
                <td className="font-medium text-xs">{o.orderNumber}</td>
                <td className="text-xs">{new Date(o.createdAt).toLocaleDateString("pt-BR")}</td>
                <td>
                  <p className="text-xs font-medium">{o.customerNameSnapshot}</p>
                  <p className="text-[11px] text-[#7b8fa8]">{formatCPF(o.customerCpfSnapshot)}</p>
                </td>
                <td className="font-medium text-xs">{formatCurrency(o.totalValue)}</td>
                <td>
                  <select
                    className="bg-[#0a1628] border border-[#1a2a44] text-[#e0e8f0] rounded-lg px-2 py-1 text-xs font-semibold focus:outline-none focus:border-[#00d4ff] cursor-pointer"
                    value={o.status}
                    onChange={(e) => changeStatusInline(o.id, e.target.value)}
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button onClick={() => openDetail(o)} className="btn-secondary text-xs py-1 px-2">
                    Detalhes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
