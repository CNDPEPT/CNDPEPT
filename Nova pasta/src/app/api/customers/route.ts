import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { cleanCPF } from "@/lib/constants";

export async function GET(req: NextRequest) {
  const cpf = req.nextUrl.searchParams.get("cpf");
  if (!cpf) return NextResponse.json(null, { status: 400 });

  const customer = await prisma.customer.findUnique({
    where: { cpf: cleanCPF(cpf) },
  });
  return NextResponse.json(customer);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const cpf = cleanCPF(body.cpf || "");
  if (!cpf || cpf.length !== 11) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
  }

  // Check if there's an existing customer with this email that already has a password
  // (created via admin access panel). If so, update that record instead of creating a new one.
  const existingByEmail = await prisma.customer.findUnique({ where: { email: body.email } });

  if (existingByEmail && !existingByEmail.cpf) {
    // Customer was created via admin access (has email + password but no CPF yet)
    // Update that existing record to add profile data, preserving passwordHash
    const customer = await prisma.customer.update({
      where: { id: existingByEmail.id },
      data: {
        fullName: body.fullName,
        cpf,
        phone: body.phone,
        zipCode: body.zipCode,
        street: body.street,
        number: body.number,
        complement: body.complement || "",
        district: body.district,
        city: body.city,
        state: body.state,
      },
    });
    return NextResponse.json(customer);
  }

  const customer = await prisma.customer.upsert({
    where: { cpf },
    update: {
      fullName: body.fullName,
      email: body.email,
      phone: body.phone,
      zipCode: body.zipCode,
      street: body.street,
      number: body.number,
      complement: body.complement || "",
      district: body.district,
      city: body.city,
      state: body.state,
    },
    create: {
      fullName: body.fullName,
      cpf,
      email: body.email,
      phone: body.phone,
      zipCode: body.zipCode,
      street: body.street,
      number: body.number,
      complement: body.complement || "",
      district: body.district,
      city: body.city,
      state: body.state,
    },
  });

  return NextResponse.json(customer);
}
