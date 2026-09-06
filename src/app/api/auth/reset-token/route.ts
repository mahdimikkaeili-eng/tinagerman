import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const requesterId = await getUserIdFromRequest(request);
    if (!requesterId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const requester = await db.user.findUnique({ where: { id: requesterId } });
    if (requester?.role !== "teacher") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;
    if (!userId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const target = await db.user.findUnique({ where: { id: userId } });
    if (!target) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.passwordResetToken.updateMany({
      where: { userId, usedAt: null },
      data: { usedAt: new Date() },
    });

    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await db.passwordResetToken.create({ data: { token, userId, expiresAt } });

    return NextResponse.json({
      resetUrl: "https://tinagerman.com/reset-password?token=" + token,
      expiresAt,
      studentName: target.name,
    });
  } catch (error) {
    console.error("Reset token error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
