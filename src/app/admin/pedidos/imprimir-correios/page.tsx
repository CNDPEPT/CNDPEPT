"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";

interface OrderItem {
  productNameSnapshot: string;
  dosage: string;
  quantity: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerNameSnapshot: string;
  shippingStreet: string;
  shippingNumber: string;
  shippingComplement: string;
  shippingDistrict: string;
  shippingCity: string;
  shippingState: string;
  shippingZipCode: string;
  shippingType: string;
  items: OrderItem[];
}

interface SenderInfo {
  name: string;
  street: string;
  number: string;
  district: string;
  city: string;
  state: string;
  zipCode: string;
}

export default function ImprimirCorreiosPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [sender, setSender] = useState<SenderInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdated, setStatusUpdated] = useState(false);
  const [updating, setUpdating] = useState(false);

  const idsParam = searchParams.get("ids");

  useEffect(() => {
    async function fetchData() {
      const senderRes = await fetch("/api/admin/sender");
      if (senderRes.ok) {
        const senderData = await senderRes.json();
        if (senderData) setSender(senderData);
      }

      if (idsParam) {
        const res = await fetch("/api/admin/orders?status=");
        if (res.ok) {
          const all: Order[] = await res.json();
          const idSet = new Set(idsParam.split(","));
          setOrders(all.filter((o) => idSet.has(o.id)));
        }
      } else {
        const res = await fetch("/api/admin/orders?status=Enviar");
        if (res.ok) {
          const all: Order[] = await res.json();
          setOrders(all.filter((o) => o.shippingType === "sedex" || o.shippingType === "SEDEX"));
        }
      }
      setLoading(false);
    }
    fetchData();
  }, [idsParam]);

  async function markAsEtiquetaImpressa() {
    setUpdating(true);
    await Promise.all(
      orders.map((o) =>
        fetch("/api/admin/orders", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: o.id, status: "Etiqueta impressa" }),
        })
      )
    );
    setStatusUpdated(true);
    setUpdating(false);
  }

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#060b18" }}>
        <p style={{ color: "#7b8fa8", fontSize: "13px", fontFamily: "Arial" }}>Carregando pedidos...</p>
      </div>
    );
  }

  if (!sender) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "#060b18" }}>
        <p style={{ color: "#f87171", fontSize: "14px", fontFamily: "Arial" }}>⚠️ Nenhum remetente cadastrado!</p>
        <p style={{ color: "#7b8fa8", fontSize: "12px", fontFamily: "Arial" }}>Cadastre um remetente em Admin → Remetente antes de imprimir.</p>
        <button onClick={() => window.close()} style={{ background: "#0a1628", color: "#a0c4e8", padding: "7px 18px", borderRadius: "6px", fontSize: "13px", border: "1px solid #1a2a44", cursor: "pointer", fontFamily: "Arial" }}>Fechar</button>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", background: "#060b18" }}>
        <p style={{ color: "#7b8fa8", fontSize: "13px", fontFamily: "Arial" }}>Nenhum pedido encontrado para impressão.</p>
        <button onClick={() => window.close()} style={{ background: "#0a1628", color: "#a0c4e8", padding: "7px 18px", borderRadius: "6px", fontSize: "13px", border: "1px solid #1a2a44", cursor: "pointer", fontFamily: "Arial" }}>Fechar</button>
      </div>
    );
  }

  // 2 columns x 3 rows = 6 per page (label + items strip + gap)
  const labelsPerPage = 6;
  const pages: Order[][] = [];
  for (let i = 0; i < orders.length; i += labelsPerPage) {
    pages.push(orders.slice(i, i + labelsPerPage));
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body, html { margin: 0 !important; padding: 0 !important; background: white !important; color: black !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .no-print { display: none !important; }
          .print-page { page-break-after: always; page-break-inside: avoid; margin: 0; padding: 8mm; width: 210mm; min-height: 297mm; box-sizing: border-box; }
          .print-page:last-child { page-break-after: auto; }
        }
        @media screen {
          .print-page { width: 210mm; min-height: 297mm; margin: 20px auto; padding: 8mm; background: white; color: black; box-shadow: 0 2px 20px rgba(0,0,0,0.3); box-sizing: border-box; }
        }
        .label-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-auto-rows: auto;
          gap: 5mm;
          width: 100%;
        }
        .label-block {
          break-inside: avoid;
          page-break-inside: avoid;
        }
        .label-card {
          border: 1px dashed #999;
          padding: 3mm 4mm;
          box-sizing: border-box;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 50mm;
        }
        .label-card * { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; padding: 0; }
        .label-section-title { font-size: 6.5pt; font-weight: bold; text-transform: uppercase; letter-spacing: 0.08em; color: #555; margin-bottom: 0.8mm; border-bottom: 1px solid #ccc; padding-bottom: 0.3mm; }
        .label-name { font-size: 9.5pt; font-weight: bold; margin-bottom: 0.3mm; }
        .label-address { font-size: 8pt; line-height: 1.2; }
        .label-cep { font-size: 13pt; font-weight: bold; letter-spacing: 1px; margin-top: 0.5mm; }
        .label-service { display: inline-block; font-size: 7.5pt; font-weight: bold; background: #000; color: #fff !important; padding: 0.7mm 2.5mm; border-radius: 2px; text-transform: uppercase; }
        .label-sender { margin-top: auto; padding-top: 1mm; border-top: 1px solid #ddd; }
        .label-sender .label-section-title { font-size: 5.5pt; color: #777; }
        .label-sender p { font-size: 6.5pt; line-height: 1.2; color: #444; }
        .label-order-num { font-size: 6.5pt; color: #999; text-align: right; }

        /* Items strip — sits below label, separated by cut line */
        .items-strip {
          border: 1px dashed #bbb;
          border-top: none;
          padding: 1.2mm 3.5mm 1.5mm;
          font-family: Arial, Helvetica, sans-serif;
          background: #fafafa;
          position: relative;
        }
        .items-cut-line {
          border: none;
          border-top: 1.5px dashed #aaa;
          margin: 0;
          position: relative;
        }
        .items-cut-line::after {
          content: "✂ corte aqui";
          position: absolute;
          top: -5pt;
          right: 2mm;
          font-size: 5.5pt;
          color: #aaa;
          background: #fafafa;
          padding: 0 1mm;
          font-family: Arial, sans-serif;
        }
        .items-strip-header {
          font-size: 6pt;
          font-weight: bold;
          text-transform: uppercase;
          color: #666;
          letter-spacing: 0.05em;
          margin-bottom: 0.3mm;
        }
        .items-strip-row {
          font-size: 7.5pt;
          line-height: 1.3;
          color: #222;
          display: flex;
          justify-content: space-between;
          gap: 2mm;
        }
        .items-strip-row .item-name { font-weight: 500; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .items-strip-row .item-qty { font-weight: bold; color: #000; white-space: nowrap; min-width: 8mm; text-align: right; }
      `}</style>

      {/* Screen-only controls */}
      <div className="no-print" style={{ textAlign: "center", padding: "24px 20px", background: "#060b18" }}>
        <h1 style={{ color: "#00d4ff", fontSize: "16px", marginBottom: "8px", fontFamily: "Arial" }}>
          Etiquetas Correios — SEDEX
        </h1>
        <p style={{ color: "#7b8fa8", fontSize: "12px", marginBottom: "12px", fontFamily: "Arial" }}>
          {orders.length} etiqueta(s) em {pages.length} página(s) — 6 por folha
          {idsParam ? " (selecionados)" : " (todos com status Enviar)"}
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => window.print()} style={{ background: "linear-gradient(135deg, #00b4d8, #00d4ff)", color: "#060b18", padding: "7px 18px", borderRadius: "6px", fontWeight: "bold", fontSize: "13px", border: "none", cursor: "pointer", fontFamily: "Arial" }}>
            🖨️ Imprimir
          </button>
          {!statusUpdated ? (
            <button onClick={markAsEtiquetaImpressa} disabled={updating} style={{ background: updating ? "#333" : "linear-gradient(135deg, #f59e0b, #d97706)", color: "#060b18", padding: "7px 18px", borderRadius: "6px", fontWeight: "bold", fontSize: "13px", border: "none", cursor: updating ? "not-allowed" : "pointer", fontFamily: "Arial", opacity: updating ? 0.6 : 1 }}>
              {updating ? "Atualizando..." : `✅ Marcar ${orders.length} como "Etiqueta impressa"`}
            </button>
          ) : (
            <div style={{ background: "#052e16", border: "1px solid #166534", color: "#4ade80", padding: "7px 18px", borderRadius: "6px", fontSize: "13px", fontWeight: "bold", fontFamily: "Arial" }}>
              ✓ {orders.length} pedido(s) marcado(s) como &quot;Etiqueta impressa&quot;
            </div>
          )}
          <button onClick={() => window.close()} style={{ background: "#0a1628", color: "#a0c4e8", padding: "7px 18px", borderRadius: "6px", fontWeight: "500", fontSize: "13px", border: "1px solid #1a2a44", cursor: "pointer", fontFamily: "Arial" }}>
            Fechar
          </button>
        </div>
      </div>

      {/* Print pages */}
      {pages.map((pageOrders, pageIdx) => (
        <div key={pageIdx} className="print-page">
          <div className="label-grid">
            {pageOrders.map((order) => (
              <div key={order.id} className="label-block">
                {/* Etiqueta de envio */}
                <div className="label-card">
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6mm" }}>
                      <span className="label-service">SEDEX</span>
                      <span className="label-order-num">#{order.orderNumber}</span>
                    </div>
                    <p className="label-section-title">Destinatário</p>
                    <p className="label-name">{order.customerNameSnapshot}</p>
                    <div className="label-address">
                      <p>{order.shippingStreet}, {order.shippingNumber}{order.shippingComplement ? ` - ${order.shippingComplement}` : ""}</p>
                      <p>{order.shippingDistrict}</p>
                      <p>{order.shippingCity} - {order.shippingState}</p>
                    </div>
                    <p className="label-cep">{order.shippingZipCode}</p>
                  </div>
                  <div className="label-sender">
                    <p className="label-section-title">Remetente</p>
                    <p>{sender.name}</p>
                    <p>{sender.street}{sender.number ? `, ${sender.number}` : ""} — {sender.district}</p>
                    <p>{sender.city} - {sender.state} — CEP {sender.zipCode}</p>
                  </div>
                </div>
                {/* Tira de separação — cortar e descartar após embalar */}
                <div className="items-strip">
                  <hr className="items-cut-line" />
                  <p className="items-strip-header">Separação #{order.orderNumber}</p>
                  {order.items.map((item, idx) => (
                    <div key={idx} className="items-strip-row">
                      <span className="item-name">{item.productNameSnapshot}{item.dosage ? ` (${item.dosage})` : ""}</span>
                      <span className="item-qty">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
