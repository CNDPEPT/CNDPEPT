import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyToken, hashPassword } from "@/lib/auth";
import { cookies } from "next/headers";

async function checkAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_token")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function GET(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const search = req.nextUrl.searchParams.get("search");

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { cpf: { contains: search.replace(/\D/g, "") } },
    ];
  }

  const customers = await prisma.customer.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(customers);
}

export async function PUT(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { id, password, ...data } = body;

  if (!id) return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });

  // If password is provided, hash it
  if (password && password.trim()) {
    data.passwordHash = await hashPassword(password.trim());
  }

  const updated = await prisma.customer.update({
    where: { id },
    data,
  });

  return NextResponse.json(updated);
}

export async function POST(req: NextRequest) {
  const admin = await checkAdmin();
  if (!admin) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const body = await req.json();
  const { fullName, cpf, email, phone, zipCode, street, number, complement, district, city, state, password } = body;

  if (!fullName || !cpf || !email || !password) {
    return NextResponse.json({ error: "Nome, CPF, e-mail e senha são obrigatórios" }, { status: 400 });
  }

  const cleanCpf = cpf.replace(/\D/g, "");
  if (cleanCpf.length !== 11) {
    return NextResponse.json({ error: "CPF deve ter 11 dígitos" }, { status: 400 });
  }

  // Check duplicates
  const existingCpf = await prisma.customer.findUnique({ where: { cpf: cleanCpf } });
  if (existingCpf) return NextResponse.json({ error: "CPF já cadastrado" }, { status: 400 });
  const existingEmail = await prisma.customer.findUnique({ where: { email: email.trim().toLowerCase() } });
  if (existingEmail) return NextResponse.json({ error: "E-mail já cadastrado" }, { status: 400 });

  const passwordHash = await hashPassword(password.trim());

  const customer = await prisma.customer.create({
    data: {
      fullName,
      cpf: cleanCpf,
      email: email.trim().toLowerCase(),
      passwordHash,
      phone: phone || "",
      zipCode: zipCode || "",
      street: street || "",
      number: number || "",
      complement: complement || "",
      district: district || "",
      city: city || "",
      state: state || "",
    },
  });

  return NextResponse.json(customer);
}
