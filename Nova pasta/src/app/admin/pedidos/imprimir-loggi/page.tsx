"use client";

import { useState, useEffect } from "react";

interface LoggiOrder {
  id: string;
  orderNumber: string;
  customerNameSnapshot: string;
  customerPhoneSnapshot: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  loggiShipmentId: string | null;
  loggiLabelUrl: string | null;
  trackingCode: string | null;
  status: string;
}

interface ConfigStatus {
  configured: boolean;
  missingVars: string[];
}

interface ReadyOrder {
  id: string;
  orderNumber: string;
  loggiShipmentId: string;
}

interface NotReadyOrder {
  id: string;
  orderNumber: string;
  reason: string;
}

interface ShipmentResult {
  orderId: string;
  orderNumber: string;
  success: boolean;
  shipmentId?: string;
  trackingCode?: string;
  error?: string;
}

export default function ImprimirLoggiPage() {
  const [orders, setOrders] = useState<LoggiOrder[]>([]);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [ready, setReady] = useState<ReadyOrder[]>([]);
  const [notReady, setNotReady] = useState<NotReadyOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState("");
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState<"success" | "error" | "warning">("success");
  const [shipmentResults, setShipmentResults] = useState<ShipmentResult[]>([]);
  const [pdfData, setPdfData] = useState<{ base64?: string; url?: string } | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function fetchData() {
    setLoading(true);
    const res = await fetch("/api/admin/loggi");
    if (res.ok) {
      const data = await res.json();
      setOrders(data.orders || []);
      setConfigStatus(data.configStatus);
      setReady(data.ready || []);
      setNotReady(data.notReady || []);
      // Select all by default
      setSelectedIds(new Set((data.orders || []).map((o: LoggiOrder) => o.id)));
    }
    setLoading(false);
  }

  useEffect(() => { fetchData(); }, []);

  function showFeedback(msg: string, type: "success" | "error" | "warning") {
    setFeedback(msg);
    setFeedbackType(type);
    setTimeout(() => setFeedback(""), 6000);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === orders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(orders.map((o) => o.id)));
    }
  }

  async function handleCreateShipments() {
    const idsToCreate = Array.from(selectedIds).filter((id) => {
      const order = orders.find((o) => o.id === id);
      return order && !order.loggiShipmentId;
    });

    if (idsToCreate.length === 0) {
      showFeedback("Todos os pedidos selecionados já possuem envio criado na Loggi.", "warning");
      return;
    }

    setProcessing(true);
    setProcessingAction("Criando envios na Loggi...");
    setShipmentResults([]);

    const res = await fetch("/api/admin/loggi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-shipments", orderIds: idsToCreate }),
    });

    const data = await res.json();
    setProcessing(false);
    setProcessingAction("");

    if (data.results) {
      setShipmentResults(data.results);
      const successes = data.results.filter((r: ShipmentResult) => r.success).length;
      const failures = data.results.filter((r: ShipmentResult) => !r.success).length;
      if (failures > 0) {
        showFeedback(`${successes} envio(s) criado(s), ${failures} falha(s).`, failures === data.results.length ? "error" : "warning");
      } else {
        showFeedback(`${successes} envio(s) criado(s) com sucesso!`, "success");
      }
      fetchData();
    } else {
      showFeedback(data.error || "Erro ao criar envios.", "error");
    }
  }

  async function handleGenerateLabels() {
    const idsWithShipment = Array.from(selectedIds).filter((id) => {
      const order = orders.find((o) => o.id === id);
      return order && order.loggiShipmentId;
    });

    if (idsWithShipment.length === 0) {
      showFeedback("Nenhum pedido selecionado possui envio criado na Loggi. Crie os envios primeiro.", "error");
      return;
    }

    setProcessing(true);
    setProcessingAction("Gerando etiquetas oficiais da Loggi...");
    setPdfData(null);

    const res = await fetch("/api/admin/loggi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate-labels", orderIds: idsWithShipment }),
    });

    const data = await res.json();
    setProcessing(false);
    setProcessingAction("");

    if (data.success) {
      setPdfData({ base64: data.pdfBase64, url: data.pdfUrl });
      showFeedback(`Etiquetas geradas para ${data.orderCount} pedido(s)!`, "success");
    } else {
      showFeedback(data.error || "Erro ao gerar etiquetas.", "error");
    }
  }

  async function handleMarkAsEtiquetaImpressa() {
    const idsToMark = Array.from(selectedIds);
    if (idsToMark.length === 0) return;

    setProcessing(true);
    setProcessingAction("Atualizando status...");
    await Promise.all(
      idsToMark.map((orderId) =>
        fetch("/api/admin/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId, status: "Etiqueta impressa" }),
        })
      )
    );
    setProcessing(false);
    setProcessingAction("");
    showFeedback(`${idsToMark.length} pedido(s) marcado(s) como "Etiqueta impressa".`, "success");
    fetchData();
  }

  function openPdfForPrint() {
    if (pdfData?.base64) {
      const byteChars = atob(pdfData.base64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNums);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    } else if (pdfData?.url) {
      window.open(pdfData.url, "_blank");
    }
  }

  function downloadPdf() {
    if (pdfData?.base64) {
      const byteChars = atob(pdfData.base64);
      const byteNums = new Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
      const byteArray = new Uint8Array(byteNums);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `etiquetas-loggi-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } else if (pdfData?.url) {
      window.open(pdfData.url, "_blank");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-[#7b8fa8]">Carregando pedidos Loggi...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-3 gap-2">
        <div>
          <h1 className="text-base font-bold">Imprimir Loggi</h1>
          <p className="text-xs text-[#7b8fa8]">
            Pedidos com status &quot;Enviar&quot; e meio de envio Loggi
          </p>
        </div>
        <a href="/admin/pedidos" className="btn-secondary">
          ← Voltar aos Pedidos
        </a>
      </div>

      {/* Config status */}
      {configStatus && !configStatus.configured && (
        <div className="bg-[#2a1a0a] border border-[#92400e] text-[#fbbf24] px-3 py-2 rounded-md mb-3 text-xs">
          <p className="font-bold mb-1">⚠️ Loggi não configurada</p>
          <p>Variáveis de ambiente faltando: <strong>{configStatus.missingVars.join(", ")}</strong></p>
          <p className="text-xs mt-1">
            Adicione no arquivo <code>.env</code>: LOGGI_API_URL, LOGGI_COMPANY_ID e LOGGI_API_KEY
          </p>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`px-3 py-2 rounded-md mb-3 text-xs ${
            feedbackType === "success"
              ? "bg-[#0a2a1a] border border-[#0f5132] text-[#4ade80]"
              : feedbackType === "error"
              ? "bg-[#2a0a0a] border border-[#7f1d1d] text-[#f87171]"
              : "bg-[#2a1a0a] border border-[#92400e] text-[#fbbf24]"
          }`}
        >
          {feedback}
        </div>
      )}

      {/* Processing overlay */}
      {processing && (
        <div className="card-tech p-4 mb-4 text-center">
          <p className="text-xs text-[#00d4ff] animate-pulse">{processingAction}</p>
        </div>
      )}

      {/* PDF ready */}
      {pdfData && (
        <div className="card-tech p-3 mb-3 border-[#00d4ff33]">
          <h3 className="text-sm font-bold text-[#00d4ff] mb-2">📄 Etiquetas Geradas</h3>
          <div className="flex flex-wrap gap-2">
            <button onClick={openPdfForPrint} className="btn-primary">
              🖨️ Abrir para Imprimir
            </button>
            <button onClick={downloadPdf} className="btn-secondary">
              📥 Baixar PDF
            </button>
            <button onClick={handleMarkAsEtiquetaImpressa} className="text-xs px-3 py-2 rounded-md font-semibold" style={{ background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#060b18", border: "none", cursor: "pointer" }}>
              ✅ Marcar como &quot;Etiqueta impressa&quot;
            </button>
          </div>
        </div>
      )}

      {/* Shipment creation results */}
      {shipmentResults.length > 0 && (
        <div className="card-tech p-4 mb-4">
          <h3 className="text-xs font-semibold text-[#7b8fa8] uppercase tracking-wide mb-2">
            Resultado da Criação de Envios
          </h3>
          <div className="space-y-1">
            {shipmentResults.map((r) => (
              <div
                key={r.orderId}
                className={`flex items-center justify-between px-2 py-1 rounded text-xs ${
                  r.success
                    ? "bg-[#0a2a1a] text-[#4ade80]"
                    : "bg-[#2a0a0a] text-[#f87171]"
                }`}
              >
                <span className="font-medium">{r.orderNumber}</span>
                <span>
                  {r.success
                    ? `✓ Envio criado (${r.shipmentId})`
                    : `✗ ${r.error}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="card-tech p-8 text-center">
          <p className="text-sm text-[#7b8fa8]">Nenhum pedido Loggi com status &quot;Enviar&quot; encontrado.</p>
        </div>
      ) : (
        <>
          {/* Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <div className="card-tech p-3 text-center">
              <p className="text-xs text-[#7b8fa8]">Total de Pedidos</p>
              <p className="text-lg font-bold text-[#e0e8f0]">{orders.length}</p>
            </div>
            <div className="card-tech p-3 text-center">
              <p className="text-xs text-[#4ade80]">Com Envio Criado</p>
              <p className="text-lg font-bold text-[#4ade80]">{ready.length}</p>
            </div>
            <div className="card-tech p-3 text-center">
              <p className="text-xs text-[#f87171]">Sem Envio (pendente)</p>
              <p className="text-lg font-bold text-[#f87171]">{notReady.length}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 mb-3">
            {notReady.length > 0 && (
              <button
                onClick={handleCreateShipments}
                disabled={processing || !configStatus?.configured}
                className="btn-primary disabled:opacity-40"
              >
                🚀 Criar Envios na Loggi ({notReady.length} pendente{notReady.length > 1 ? "s" : ""})
              </button>
            )}
            {ready.length > 0 && (
              <button
                onClick={handleGenerateLabels}
                disabled={processing || !configStatus?.configured}
                className="btn-primary disabled:opacity-40"
              >
                🏷️ Gerar Etiquetas ({ready.length} pronto{ready.length > 1 ? "s" : ""})
              </button>
            )}
            <button
              onClick={handleMarkAsEtiquetaImpressa}
              disabled={processing || selectedIds.size === 0}
              className="btn-secondary disabled:opacity-40"
            >
              ✅ Marcar {selectedIds.size} como &quot;Etiqueta impressa&quot;
            </button>
          </div>

          {/* Not ready warnings */}
          {notReady.length > 0 && (
            <div className="bg-[#2a1a0a] border border-[#92400e] rounded-md px-3 py-2 mb-3">
              <p className="text-xs font-semibold text-[#fbbf24] mb-1">
                ⚠️ {notReady.length} pedido(s) sem envio criado na Loggi:
              </p>
              <div className="space-y-1">
                {notReady.map((o) => (
                  <p key={o.id} className="text-xs text-[#fbbf24]">
                    • <strong>{o.orderNumber}</strong>: {o.reason}
                  </p>
                ))}
              </div>
              <p className="text-xs text-[#7b8fa8] mt-1">
                Clique em &quot;Criar Envios na Loggi&quot; para registrar esses pedidos na plataforma.
              </p>
            </div>
          )}

          {/* Orders table */}
          <div className="card-tech overflow-hidden table-responsive">
            <table className="table-tech">
              <thead>
                <tr>
                  <th className="w-12">
                    <input
                      type="checkbox"
                      checked={orders.length > 0 && selectedIds.size === orders.length}
                      onChange={toggleSelectAll}
                      className="w-5 h-5 accent-[#00d4ff] cursor-pointer"
                    />
                  </th>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Destino</th>
                  <th>Integração Loggi</th>
                  <th>Etiqueta</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className={selectedIds.has(o.id) ? "bg-[#0a1628]" : ""}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(o.id)}
                        onChange={() => toggleSelect(o.id)}
                        className="w-5 h-5 accent-[#00d4ff] cursor-pointer"
                      />
                    </td>
                    <td className="font-medium">{o.orderNumber}</td>
                    <td>
                      <p className="text-xs font-medium">{o.customerNameSnapshot}</p>
                      <p className="text-xs text-[#7b8fa8]">{o.customerPhoneSnapshot}</p>
                    </td>
                    <td>
                      <p className="text-xs">{o.shippingCity} - {o.shippingState}</p>
                      <p className="text-xs text-[#7b8fa8]">CEP: {o.shippingZipCode}</p>
                    </td>
                    <td>
                      {o.loggiShipmentId ? (
                        <span className="badge badge-success">✓ Envio criado</span>
                      ) : (
                        <span className="badge badge-warning">Pendente</span>
                      )}
                      {o.trackingCode && (
                        <p className="text-lg text-[#7b8fa8] mt-1">{o.trackingCode}</p>
                      )}
                    </td>
                    <td>
                      {o.loggiLabelUrl ? (
                        <a href={o.loggiLabelUrl} target="_blank" rel="noopener noreferrer" className="text-[#00d4ff] underline text-lg">
                          Ver etiqueta
                        </a>
                      ) : o.loggiShipmentId ? (
                        <span className="text-lg text-[#7b8fa8]">Gerar etiqueta</span>
                      ) : (
                        <span className="text-lg text-[#7b8fa8]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
