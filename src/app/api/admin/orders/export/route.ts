import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { formatCurrency } from "@/lib/constants";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  // Build CSV
  const headers = [
    "Pedido", "Data", "Cliente", "CPF", "E-mail", "Telefone",
    "Endereço", "Cidade", "UF", "CEP", "Frete Tipo", "Frete Valor",
    "Subtotal", "Desconto", "Total", "Status", "Cupom", "Itens"
  ];

  const rows = orders.map((o) => [
    o.orderNumber,
    new Date(o.createdAt).toLocaleDateString("pt-BR"),
    o.customerNameSnapshot,
    o.customerCpfSnapshot,
    o.customerEmailSnapshot,
    o.customerPhoneSnapshot,
    `${o.shippingStreet} ${o.shippingNumber}`,
    o.shippingCity,
    o.shippingState,
    o.shippingZipCode,
    o.shippingType,
    o.shippingValue.toFixed(2),
    o.subtotal.toFixed(2),
    o.discountValue.toFixed(2),
    o.totalValue.toFixed(2),
    o.status,
    o.couponCode || "",
    o.items.map((i) => `${i.productNameSnapshot} x${i.quantity}`).join("; "),
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");

  return new NextResponse(csvContent, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pedidos-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
