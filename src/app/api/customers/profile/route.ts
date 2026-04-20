import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, fullName, cpf, phone, zipCode, street, number, complement, district, city, state } = body;

  if (!id) {
    return NextResponse.json({ error: "ID obrigatório" }, { status: 400 });
  }

  const cleanCpf = (cpf || "").replace(/\D/g, "");
  if (!cleanCpf || cleanCpf.length !== 11) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
  }

  if (!fullName || !phone || !zipCode || !street || !number || !district || !city || !state) {
    return NextResponse.json({ error: "Preencha todos os campos obrigatórios" }, { status: 400 });
  }

  // Check if CPF is already taken by another customer
  const existingCpf = await prisma.customer.findUnique({ where: { cpf: cleanCpf } });
  if (existingCpf && existingCpf.id !== id) {
    return NextResponse.json({ error: "CPF já cadastrado por outro cliente" }, { status: 400 });
  }

  const customer = await prisma.customer.update({
    where: { id },
    data: {
      fullName: fullName.trim(),
      cpf: cleanCpf,
      phone: phone.replace(/\D/g, ""),
      zipCode: zipCode.replace(/\D/g, ""),
      street,
      number,
      complement: complement || "",
      district,
      city,
      state,
    },
  });

  return NextResponse.json(customer);
}
