import {
  BookingStatus,
  PaymentStatus,
  SlotStatus,
} from "../../../generated/prisma/enums";
import config from "../../config";
import { getBkashIdToken } from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import { sendBookingConfirmationMail } from "../../utils/bookingConfirmationMail";

type AuthenticatedUser = { userId: string; email: string };
type BookingPayload = { slotId?: string; bookingId?: string };

const getCallbackUrl = () =>
  `${config.bkash_callback_url}/api/v1/book-slot/payment/callback`;

const getPaymentRedirectUrl = (status: string) => {
  const fallbackUrl = `${config.frontend_url}/dashboard/bookings?status=${status}`;
  const configuredUrl =
    status === "success"
      ? config.payment_success_url
      : config.payment_failure_url;

  return configuredUrl || fallbackUrl;
};

const createBkashPayment = async (
  bookingId: string,
  amount: number,
  payerReference: string,
) => {
  const idToken = await getBkashIdToken();
  if (!idToken) throw new Error("Bkash access token not found");

  const response = await fetch(
    `${config.bkash_base_url}/tokenized/checkout/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: idToken,
        "x-app-key": config.bkash_app_key,
      },
      body: JSON.stringify({
        mode: "0011",
        payerReference,
        callbackURL: getCallbackUrl(),
        amount: amount.toFixed(2),
        currency: "BDT",
        intent: "sale",
        merchantInvoiceNumber: bookingId,
      }),
    },
  );

  const result = await response.json();
  if (!response.ok || !result.paymentID || !result.bkashURL) {
    throw new Error(result.statusMessage || "Bkash payment creation failed");
  }

  return result as { paymentID: string; bkashURL: string };
};

const bookSlot = async (payload: BookingPayload, user: AuthenticatedUser) => {
  if (!payload.slotId) throw new Error("slotId is required");

  return prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({
      where: { id: payload.slotId },
      include: { ground: true },
    });
    if (slot?.ground?.status !== "ACTIVE") {
      throw new Error("Slot or ground not found");
    }
    if (slot.status !== SlotStatus.AVAILABLE) {
      throw new Error("This slot is no longer available");
    }

    const reserved = await tx.slot.updateMany({
      where: { id: slot.id, status: SlotStatus.AVAILABLE },
      data: { status: SlotStatus.HELD },
    });
    if (reserved.count !== 1)
      throw new Error("This slot is no longer available");

    const booking = await tx.booking.create({
      data: {
        playerId: user.userId,
        groundId: slot.groundId,
        slotId: slot.id,
        totalAmount: slot.price,
        status: BookingStatus.PENDING,
      },
    });

    const payment = await createBkashPayment(
      booking.id,
      Number(slot.price),
      user.email,
    );

    await tx.payment.create({
      data: {
        bookingId: booking.id,
        provider: "BKASH",
        transactionId: payment.paymentID,
        amount: slot.price,
        status: PaymentStatus.PENDING,
      },
    });

    return { booking, paymentUrl: payment.bkashURL };
  });
};

const payBookingSlot = async (
  payload: BookingPayload,
  user: AuthenticatedUser,
) => {
  if (!payload.bookingId) throw new Error("bookingId is required");

  const booking = await prisma.booking.findFirst({
    where: { id: payload.bookingId, playerId: user.userId },
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.status !== BookingStatus.PENDING) {
    throw new Error("This booking is not pending");
  }

  const payment = await createBkashPayment(
    booking.id,
    Number(booking.totalAmount),
    user.email,
  );
  await prisma.payment.update({
    where: { bookingId: booking.id },
    data: { transactionId: payment.paymentID, status: PaymentStatus.PENDING },
  });

  return { paymentUrl: payment.bkashURL };
};

const cancelBookingSlot = async (
  payload: BookingPayload,
  user: AuthenticatedUser,
) => {
  if (!payload.bookingId) throw new Error("bookingId is required");

  const booking = await prisma.booking.findFirst({
    where: { id: payload.bookingId, playerId: user.userId },
    include: { payment: true },
  });
  if (!booking) throw new Error("Booking not found");
  if (booking.status === BookingStatus.CANCELLED) {
    throw new Error("Booking is already cancelled");
  }
  if (booking.status === BookingStatus.COMPLETED) {
    throw new Error("Completed bookings cannot be cancelled");
  }

  if (booking.payment?.status === PaymentStatus.SUCCESS) {
    const idToken = await getBkashIdToken();
    if (!idToken || !booking.payment.transactionId) {
      throw new Error("Payment refund details are missing");
    }
    const [paymentId, transactionId] = booking.payment.transactionId.split(":");
    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/payment/refund`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: idToken,
          "x-app-key": config.bkash_app_key,
        },
        body: JSON.stringify({
          paymentID: paymentId,
          trxID: transactionId || paymentId,
          amount: Number(booking.payment.amount).toFixed(2),
          sku: "Booking cancellation",
          reason: "Player cancelled the booking",
        }),
      },
    );
    if (!response.ok) throw new Error("Bkash refund failed");
  }

  return prisma.$transaction(async (tx) => {
    await tx.slot.update({
      where: { id: booking.slotId },
      data: { status: SlotStatus.AVAILABLE },
    });
    if (booking.payment) {
      await tx.payment.update({
        where: { bookingId: booking.id },
        data: {
          status:
            booking.payment.status === PaymentStatus.SUCCESS
              ? PaymentStatus.REFUNDED
              : PaymentStatus.FAILED,
        },
      });
    }
    return tx.booking.update({
      where: { id: booking.id },
      data: { status: BookingStatus.CANCELLED, cancelledAt: new Date() },
      include: { payment: true, slot: true },
    });
  });
};

const bookSlotCallback = async (query: {
  paymentID?: string;
  status?: string;
}) => {
  if (!query.paymentID || !query.status) {
    throw new Error("Payment id and status are required");
  }

  const payment = await prisma.payment.findFirst({
    where: { transactionId: { startsWith: query.paymentID } },
  });
  if (!payment) throw new Error("Payment not found");

  if (query.status === "success") {
    const isAlreadyPaid = payment.status === PaymentStatus.SUCCESS;
    const idToken = await getBkashIdToken();
    if (!idToken) throw new Error("Bkash access token not found");
    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/execute`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: idToken,
          "x-app-key": config.bkash_app_key,
        },
        body: JSON.stringify({ paymentID: query.paymentID }),
      },
    );
    const result = await response.json();
    if (!response.ok || result.statusCode === "0001") {
      throw new Error(result.statusMessage || "Bkash payment execution failed");
    }

    const confirmedBooking = await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.SUCCESS,
          transactionId: `${query.paymentID}:${result.trxID || query.paymentID}`,
          paidAt: new Date(),
        },
      });
      const booking = await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: BookingStatus.CONFIRMED },
        select: {
          slotId: true,
          id: true,
          totalAmount: true,
          createdAt: true,
          player: { select: { name: true, email: true } },
          ground: { select: { name: true, address: true, sportTypes: true } },
          slot: { select: { date: true, startTime: true, endTime: true } },
        },
      });
      await tx.slot.update({
        where: { id: booking.slotId },
        data: { status: SlotStatus.BOOKED },
      });
      return booking;
    });

    if (!isAlreadyPaid) {
      await sendBookingConfirmationMail(confirmedBooking);
    }
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: PaymentStatus.FAILED },
      });
      const booking = await tx.booking.update({
        where: { id: payment.bookingId },
        data: { status: BookingStatus.PENDING },
        select: { slotId: true },
      });
      await tx.slot.update({
        where: { id: booking.slotId },
        data: { status: SlotStatus.AVAILABLE },
      });
    });
  }

  return {
    redirectUrl: getPaymentRedirectUrl(query.status),
  };
};

export const bookSlotService = {
  bookSlot,
  bookSlotCallback,
  payBookingSlot,
  cancelBookingSlot,
};
