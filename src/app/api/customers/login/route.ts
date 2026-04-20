import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
  }

  const customer = await prisma.customer.findUnique({
    where: { email: email.trim().toLowerCase() },
  });

  if (!customer) {
    return NextResponse.json({ error: "E-mail ou senha inválidos" }, { status: 401 });
  }

  if (!customer.passwordHash) {
    return NextResponse.json({ error: "Conta sem senha configurada. Contate o administrador." }, { status: 401 });
  }

  if (!customer.isActive) {
    return NextResponse.json({ error: "Conta desativada. Contate o administrador." }, { status: 401 });
  }

  const valid = await verifyPassword(password, customer.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "E-mail ou senha inválidos" }, { status: 401 });
  }

  const profileComplete = !!(customer.fullName && customer.cpf && customer.phone && customer.zipCode && customer.state);

  return NextResponse.json({
    success: true,
    profileComplete,
    customer: {
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
      state: customer.state,
    },
  });
}
