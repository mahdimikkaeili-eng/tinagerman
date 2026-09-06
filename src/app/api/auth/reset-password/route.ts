import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;

    if (!token || !password) {
      return NextResponse.json({ error: "Token and password are required" }, { status: 400 });
    }
    if (typeof password !== "string" || password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }

    const record = await db.passwordResetToken.findUnique({ where: { token } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "This link is invalid or has expired" }, { status: 400 });
    }

    await db.user.update({
      where: { id: record.userId },
      data: { password: hashPassword(password) },
    });
    await db.passwordResetToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({ message: "Password updated. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = new URL(request.url).searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }
    const record = await db.passwordResetToken.findUnique({
      where: { token },
      include: { user: { select: { name: true, email: true } } },
    });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      return NextResponse.json({ error: "This link is invalid or has expired" }, { status: 400 });
    }
    return NextResponse.json({ name: record.user.name, email: record.user.email });
  } catch (error) {
    console.error("Reset lookup error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
