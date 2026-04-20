import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken } from "@/lib/auth";
import { cookies } from "next/headers";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(coupons);
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const coupon = await prisma.coupon.create({
    data: {
      code: body.code.toUpperCase(),
      type: body.type,
      value: parseFloat(body.value),
      isActive: body.isActive ?? true,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      usageLimit: body.usageLimit ? parseInt(body.usageLimit) : null,
    },
  });
  return NextResponse.json(coupon);
}

export async function PUT(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  if (!body.id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  const coupon = await prisma.coupon.update({
    where: { id: body.id },
    data: {
      code: body.code?.toUpperCase(),
      type: body.type,
      value: body.value !== undefined ? parseFloat(body.value) : undefined,
      isActive: body.isActive,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      usageLimit: body.usageLimit ? parseInt(body.usageLimit) : null,
    },
  });
  return NextResponse.json(coupon);
}

export async function DELETE(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { id } = await req.json();
  await prisma.coupon.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
