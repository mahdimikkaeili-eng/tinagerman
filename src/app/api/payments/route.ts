import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

const WALLET_ADDRESS = "0x535735907CB7FBE21Ac54eAf1Dab5a8B33a0121A";
const NETWORK = "BEP20";
const LESSON_PRICE = 10;

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, screenshotUrl, amount } = body;

    if (!bookingId || !screenshotUrl) {
      return NextResponse.json(
        { error: "Booking ID and payment screenshot are required" },
        { status: 400 }
      );
    }

    const booking = await db.booking.findUnique({
      where: { id: bookingId },
      include: { course: true },
    });

    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    if (booking.isTrial) {
      return NextResponse.json(
        { error: "Trial lessons are free, no payment needed" },
        { status: 400 }
      );
    }

    const existing = await db.payment.findUnique({ where: { bookingId } });
    if (existing) {
      return NextResponse.json(
        { error: "Payment already submitted for this booking" },
        { status: 400 }
      );
    }

    const payment = await db.payment.create({
      data: {
        bookingId,
        userId,
        amount: amount || LESSON_PRICE,
        currency: "USDT",
        network: NETWORK,
        walletAddress: WALLET_ADDRESS,
        screenshotUrl,
        status: "pending",
      },
    });

    // Create notification for teacher
    const teacher = await db.user.findFirst({ where: { role: "teacher" } });
    if (teacher) {
      await db.notification.create({
        data: {
          userId: teacher.id,
          title: "New Payment Received",
          message: `A student submitted a USDT payment for booking on ${booking.date} at ${booking.time}. Please verify and confirm.`,
          type: "booking",
          bookingId: booking.id,
        },
      });
    }

    return NextResponse.json(
      {
        payment,
        message: "Payment submitted! Tina will verify and confirm your lesson shortly.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    const isTeacher = user?.role === "teacher";

    const payments = await db.payment.findMany({
      where: isTeacher ? {} : { userId },
      include: {
        booking: { include: { course: true, user: { select: { name: true, email: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ payments });
  } catch (error) {
    console.error("Get payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
