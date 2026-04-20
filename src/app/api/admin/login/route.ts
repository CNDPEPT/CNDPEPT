import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyPassword, signToken } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "E-mail e senha são obrigatórios" }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const valid = await verifyPassword(password, admin.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Credenciais inválidas" }, { status: 401 });
  }

  const token = signToken({ id: admin.id, email: admin.email, role: admin.role });

  const response = NextResponse.json({ success: true, name: admin.name });
  response.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 8 * 60 * 60, // 8 hours
    path: "/",
  });

  return response;
}
