import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getUserIdFromRequest } from "@/lib/auth";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { id: userId } });
    if (user?.role !== "teacher") {
      return NextResponse.json({ error: "Only teacher can verify payments" }, { status: 403 });
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!["confirmed", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Status must be confirmed or rejected" }, { status: 400 });
    }

    const payment = await db.payment.update({
      where: { id: params.id },
      data: { status, notes },
      include: { booking: true },
    });

    // Update booking status
    if (status === "confirmed") {
      await db.booking.update({
        where: { id: payment.bookingId },
        data: { status: "confirmed" },
      });

      // Notify student
      await db.notification.create({
        data: {
          userId: payment.userId,
          title: "Payment Confirmed!",
          message: `Your payment has been verified. Your lesson on ${payment.booking.date} at ${payment.booking.time} is confirmed!`,
          type: "booking",
          bookingId: payment.bookingId,
        },
      });
    } else {
      // Notify student of rejection
      await db.notification.create({
        data: {
          userId: payment.userId,
          title: "Payment Issue",
          message: `There was an issue with your payment. Please contact Tina on WhatsApp or Telegram. Note: ${notes || ""}`,
          type: "info",
          bookingId: payment.bookingId,
        },
      });
    }

    return NextResponse.json({ payment, message: `Payment ${status} successfully` });
  } catch (error) {
    console.error("Update payment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
