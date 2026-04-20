import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";
import { cleanCPF } from "@/lib/constants";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const status = req.nextUrl.searchParams.get("status");
  const search = req.nextUrl.searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { orderNumber: { contains: search, mode: "insensitive" } },
      { customerNameSnapshot: { contains: search, mode: "insensitive" } },
      { customerCpfSnapshot: { contains: cleanCPF(search) } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    include: { items: true, statusHistory: { include: { changedByAdmin: true }, orderBy: { changedAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders);
}

// Update order status
export async function PUT(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { orderId, status, comment, internalNotes, trackingCode } = await req.json();
  if (!orderId) return NextResponse.json({ error: "ID do pedido obrigatório" }, { status: 400 });

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });

  const data: Record<string, unknown> = {};
  if (status && status !== order.status) {
    data.status = status;
    // Create history entry
    await prisma.orderStatusHistory.create({
      data: {
        orderId: order.id,
        previousStatus: order.status,
        newStatus: status,
        changedByAdminId: admin.id,
        comment: comment || null,
      },
    });
  }
  if (internalNotes !== undefined) data.internalNotes = internalNotes;
  if (trackingCode !== undefined) data.trackingCode = trackingCode;

  const updated = await prisma.order.update({
    where: { id: orderId },
    data,
    include: { items: true, statusHistory: { include: { changedByAdmin: true }, orderBy: { changedAt: "desc" } } },
  });

  return NextResponse.json(updated);
}
