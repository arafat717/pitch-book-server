import { prisma } from "../../lib/prisma";

interface GenerateSlotsPayload {
  fromDate: string; // YYYY-MM-DD
  toDate: string; // YYYY-MM-DD
}

const checkGroundOwnership = async (groundId: string, userId: string) => {
  const ground = await prisma.ground.findUnique({
    where: { id: groundId },
    select: { ownerId: true },
  });

  const user = await prisma.ownerProfile.findUnique({
    where: { id: ground?.ownerId },
    select: { userId: true },
  });

  if (!ground) {
    throw new Error("Ground not found");
  }

  if (user?.userId !== userId) {
    throw new Error("You are not authorized to manage slots for this ground");
  }
};

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60)
    .toString()
    .padStart(2, "0");
  const m = (mins % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

// Maps a JS Date's day-of-week (0=Sunday) to which PricingRule.dayType
// bucket applies. Set for a Friday-Saturday weekend (Dhaka) - change the
// two day numbers below if your target market's weekend differs.
function resolveDayType(dayOfWeek: number): "WEEKDAY" | "WEEKEND" {
  return dayOfWeek === 5 || dayOfWeek === 6 ? "WEEKEND" : "WEEKDAY";
}

// PEAK rules win over the base WEEKDAY/WEEKEND rate whenever a PEAK
// window covers the slot's start time - lets an owner charge more for,
// say, 6-9 PM on a weekday without a separate schedule.
function findPriceForSlot(
  pricingRules: {
    dayType: string;
    startTime: string;
    endTime: string;
    price: unknown;
  }[],
  dayType: string,
  slotStart: string,
): number | null {
  const peakMatch = pricingRules.find(
    (r) =>
      r.dayType === "PEAK" && slotStart >= r.startTime && slotStart < r.endTime,
  );
  if (peakMatch) return Number(peakMatch.price);

  const dayTypeMatch = pricingRules.find(
    (r) =>
      r.dayType === dayType &&
      slotStart >= r.startTime &&
      slotStart < r.endTime,
  );
  return dayTypeMatch ? Number(dayTypeMatch.price) : null;
}

const generateSlots = async (
  groundId: string,
  userId: string,
  payload: GenerateSlotsPayload,
) => {
  await checkGroundOwnership(groundId, userId);

  const schedules = await prisma.groundSchedule.findMany({
    where: { groundId },
  });
  if (schedules.length === 0) {
    throw new Error("No schedule found for this ground - add a schedule first");
  }

  const pricingRules = await prisma.pricingRule.findMany({
    where: { groundId },
  });
  if (pricingRules.length === 0) {
    throw new Error(
      "No pricing rules found for this ground - add pricing first",
    );
  }

  const from = new Date(payload.fromDate);
  const to = new Date(payload.toDate);

  const slotsToCreate: {
    groundId: string;
    date: Date;
    startTime: string;
    endTime: string;
    price: number;
    status: "AVAILABLE";
  }[] = [];

  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const dayOfWeek = d.getDay();
    const schedule = schedules.find((s) => s.dayOfWeek === dayOfWeek);
    if (!schedule) continue; // ground is closed this day of week

    const dayType = resolveDayType(dayOfWeek);
    const openMin = toMinutes(schedule.openTime);
    const closeMin = toMinutes(schedule.closeTime);

    for (
      let start = openMin;
      start < closeMin;
      start += schedule.slotDurationMin
    ) {
      const end = start + schedule.slotDurationMin;
      const startTime = minutesToTime(start);
      const endTime = minutesToTime(end);

      const price = findPriceForSlot(pricingRules, dayType, startTime);
      if (price === null) continue; // no pricing rule covers this window - skip rather than guess a price

      slotsToCreate.push({
        groundId,
        date: new Date(d),
        startTime,
        endTime,
        price,
        status: "AVAILABLE",
      });
    }
  }

  if (slotsToCreate.length === 0) {
    return { created: 0 };
  }

  // skipDuplicates relies on the @@unique([groundId, date, startTime])
  // constraint on Slot - re-running this for an overlapping range won't
  // duplicate or error on slots that already exist.
  const result = await prisma.slot.createMany({
    data: slotsToCreate,
    skipDuplicates: true,
  });

  return { created: result.count };
};

const getSlotsByDate = async (groundId: string, date: string) => {
  if (!date) {
    throw new Error("date query parameter is required (YYYY-MM-DD)");
  }

  return await prisma.slot.findMany({
    where: {
      groundId,
      date: new Date(date),
      status: { not: "BLOCKED" },
    },
    orderBy: { startTime: "asc" },
  });
};

const blockSlot = async (groundId: string, slotId: string, userId: string) => {
  await checkGroundOwnership(groundId, userId);

  const slot = await prisma.slot.findFirst({
    where: { id: slotId, groundId },
  });
  if (!slot) {
    throw new Error("Slot not found for this ground");
  }
  if (slot.status === "BOOKED") {
    throw new Error("Cannot block a slot that is already booked");
  }

  return await prisma.slot.update({
    where: { id: slotId },
    data: { status: "BLOCKED" },
  });
};

const unblockSlot = async (
  groundId: string,
  slotId: string,
  userId: string,
) => {
  await checkGroundOwnership(groundId, userId);

  const slot = await prisma.slot.findFirst({
    where: { id: slotId, groundId },
  });
  if (!slot) {
    throw new Error("Slot not found for this ground");
  }
  if (slot.status !== "BLOCKED") {
    throw new Error("This slot is not currently blocked");
  }

  return await prisma.slot.update({
    where: { id: slotId },
    data: { status: "AVAILABLE" },
  });
};

export const slotService = {
  generateSlots,
  getSlotsByDate,
  blockSlot,
  unblockSlot,
};
