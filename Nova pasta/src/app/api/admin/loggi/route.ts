import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import {
  createShipment,
  generateLabels,
  validateLoggiShipmentData,
  getLoggiConfigStatus,
} from "@/lib/loggi";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

// GET - Fetch Loggi-eligible orders + config status
export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const configStatus = getLoggiConfigStatus();

  const orders = await prisma.order.findMany({
    where: {
      status: "Enviar",
      shippingType: { in: ["loggi", "LOGGI", "Loggi"] },
    },
    select: {
      id: true,
      orderNumber: true,
      customerNameSnapshot: true,
      customerPhoneSnapshot: true,
      shippingStreet: true,
      shippingNumber: true,
      shippingComplement: true,
      shippingDistrict: true,
      shippingCity: true,
      shippingState: true,
      shippingZipCode: true,
      loggiShipmentId: true,
      loggiLabelUrl: true,
      trackingCode: true,
      status: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const { ready, notReady } = validateLoggiShipmentData(orders);

  return NextResponse.json({
    configStatus,
    orders,
    ready,
    notReady,
    totalOrders: orders.length,
  });
}

// POST - Create shipments and/or generate labels
export async function POST(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const configStatus = getLoggiConfigStatus();
  if (!configStatus.configured) {
    return NextResponse.json({
      error: "Loggi não configurada",
      missingVars: configStatus.missingVars,
    }, { status: 400 });
  }

  const { action, orderIds } = await req.json();

  // Fetch sender from DB
  const sender = await prisma.senderInfo.findFirst({ where: { isActive: true } });
  if (!sender) {
    return NextResponse.json({ error: "Nenhum remetente cadastrado. Cadastre em Admin → Remetente." }, { status: 400 });
  }

  if (action === "create-shipments") {
    // Create shipments on Loggi for orders that don't have one yet
    const orders = await prisma.order.findMany({
      where: { id: { in: orderIds } },
    });

    const results: Array<{ orderId: string; orderNumber: string; success: boolean; shipmentId?: string; trackingCode?: string; error?: string }> = [];

    for (const order of orders) {
      if (order.loggiShipmentId) {
        results.push({ orderId: order.id, orderNumber: order.orderNumber, success: true, shipmentId: order.loggiShipmentId, error: "Envio já criado" });
        continue;
      }

      const result = await createShipment(
        {
          name: sender.name,
          phone: sender.phone,
          street: sender.street,
          number: sender.number,
          complement: sender.complement,
          district: sender.district,
          city: sender.city,
          state: sender.state,
          zipCode: sender.zipCode,
        },
        {
          name: order.customerNameSnapshot,
          phone: order.customerPhoneSnapshot,
          street: order.shippingStreet,
          number: order.shippingNumber,
          complement: order.shippingComplement,
          district: order.shippingDistrict,
          city: order.shippingCity,
          state: order.shippingState,
          zipCode: order.shippingZipCode,
        }
      );

      if (result.success && result.shipmentId) {
        await prisma.order.update({
          where: { id: order.id },
          data: {
            loggiShipmentId: result.shipmentId,
            trackingCode: result.trackingCode || order.trackingCode,
          },
        });
        results.push({ orderId: order.id, orderNumber: order.orderNumber, success: true, shipmentId: result.shipmentId, trackingCode: result.trackingCode });
      } else {
        results.push({ orderId: order.id, orderNumber: order.orderNumber, success: false, error: result.error });
      }
    }

    return NextResponse.json({ action: "create-shipments", results });
  }

  if (action === "generate-labels") {
    // Generate labels for orders that have loggiShipmentId
    const orders = await prisma.order.findMany({
      where: {
        id: { in: orderIds },
        loggiShipmentId: { not: null },
      },
    });

    if (orders.length === 0) {
      return NextResponse.json({ error: "Nenhum pedido com envio Loggi criado para gerar etiquetas." }, { status: 400 });
    }

    const loggiKeys = orders.map((o) => o.loggiShipmentId!);
    const labelResult = await generateLabels(loggiKeys);

    if (labelResult.success) {
      // Save label URL if returned
      if (labelResult.pdfUrl) {
        for (const order of orders) {
          await prisma.order.update({
            where: { id: order.id },
            data: { loggiLabelUrl: labelResult.pdfUrl },
          });
        }
      }

      return NextResponse.json({
        action: "generate-labels",
        success: true,
        pdfBase64: labelResult.pdfBase64,
        pdfUrl: labelResult.pdfUrl,
        orderCount: orders.length,
      });
    }

    return NextResponse.json({
      action: "generate-labels",
      success: false,
      error: labelResult.error,
    }, { status: 500 });
  }

  return NextResponse.json({ error: "Ação inválida. Use 'create-shipments' ou 'generate-labels'." }, { status: 400 });
}
