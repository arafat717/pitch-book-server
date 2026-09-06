import {
  BookingStatus,
  PaymentStatus,
  PayoutStatus,
} from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const getOwnerProfile = async (userId: string) => {
  const profile = await prisma.ownerProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("Owner profile not found");
  return profile;
};

const getOwnerBalance = async (userId: string) => {
  const profile = await getOwnerProfile(userId);
  const bookings = await prisma.booking.findMany({
    where: {
      ground: { ownerId: profile.id },
      status: { in: [BookingStatus.CONFIRMED, BookingStatus.COMPLETED] },
      payment: { is: { status: PaymentStatus.SUCCESS } },
    },
    select: { totalAmount: true },
  });
  const payouts = await prisma.payout.findMany({
    where: {
      ownerId: userId,
      status: {
        in: [PayoutStatus.REQUESTED, PayoutStatus.APPROVED, PayoutStatus.PAID],
      },
    },
    select: { amount: true },
  });

  const gross = bookings.reduce(
    (sum, booking) => sum + Number(booking.totalAmount),
    0,
  );
  const reserved = payouts.reduce(
    (sum, payout) => sum + Number(payout.amount),
    0,
  );
  const net = gross * (1 - profile.commissionRate);

  return {
    grossRevenue: Number(gross.toFixed(2)),
    commission: Number((gross * profile.commissionRate).toFixed(2)),
    reservedPayouts: Number(reserved.toFixed(2)),
    available: Number(Math.max(net - reserved, 0).toFixed(2)),
  };
};

const requestPayout = async (userId: string, requestedAmount?: number) => {
  const balance = await getOwnerBalance(userId);
  const amount = requestedAmount ?? balance.available;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Payout amount must be greater than zero");
  }
  if (amount > balance.available) {
    throw new Error("Payout amount exceeds the available balance");
  }

  return prisma.payout.create({
    data: {
      ownerId: userId,
      amount: amount.toFixed(2),
      status: PayoutStatus.REQUESTED,
    },
  });
};

const getMyPayouts = async (userId: string) => {
  await getOwnerProfile(userId);
  return prisma.payout.findMany({
    where: { ownerId: userId },
    orderBy: { requestedAt: "desc" },
  });
};

const getAllPayouts = async () =>
  prisma.payout.findMany({
    include: { owner: { select: { id: true, name: true, email: true } } },
    orderBy: { requestedAt: "desc" },
  });

const approvePayout = async (payoutId: string) => {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw new Error("Payout not found");
  if (payout.status !== PayoutStatus.REQUESTED) {
    throw new Error("Only requested payouts can be approved");
  }

  return prisma.payout.update({
    where: { id: payoutId },
    data: { status: PayoutStatus.APPROVED },
  });
};

const markPayoutPaid = async (payoutId: string) => {
  const payout = await prisma.payout.findUnique({ where: { id: payoutId } });
  if (!payout) throw new Error("Payout not found");
  if (payout.status !== PayoutStatus.APPROVED) {
    throw new Error("Only approved payouts can be marked as paid");
  }

  return prisma.payout.update({
    where: { id: payoutId },
    data: { status: PayoutStatus.PAID, paidAt: new Date() },
  });
};

export const payoutService = {
  getOwnerBalance,
  requestPayout,
  getMyPayouts,
  getAllPayouts,
  approvePayout,
  markPayoutPaid,
};
