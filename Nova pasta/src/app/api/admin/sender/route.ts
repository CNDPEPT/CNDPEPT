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

// GET active sender
export async function GET() {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const sender = await prisma.senderInfo.findFirst({
    where: { isActive: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(sender);
}

// POST create / update sender
export async function POST(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { name, cpf, street, number, complement, district, city, state, zipCode, phone } = body;

  if (!name || !street || !district || !city || !state || !zipCode) {
    return NextResponse.json({ error: "Campos obrigatórios: nome, rua, bairro, cidade, UF, CEP" }, { status: 400 });
  }

  // Deactivate all existing senders
  await prisma.senderInfo.updateMany({ where: { isActive: true }, data: { isActive: false } });

  // Create new active sender
  const sender = await prisma.senderInfo.create({
    data: {
      name,
      cpf: cpf || "",
      street,
      number: number || "",
      complement: complement || "",
      district,
      city,
      state,
      zipCode,
      phone: phone || "",
      isActive: true,
    },
  });

  return NextResponse.json(sender);
}
