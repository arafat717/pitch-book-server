import { prisma } from "../../lib/prisma";

interface CreatePricingRulePayload {
  dayType: "WEEKDAY" | "WEEKEND" | "PEAK";
  startTime: string;
  endTime: string;
  price: number;
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
    throw new Error(
      "You are not authorized to modify pricing rules for this ground",
    );
  }
};

// HH:mm strings compare correctly with plain string comparison since
// they're fixed-width and zero-padded (e.g. "09:00" < "17:00").
function timeRangesOverlap(
  aStart: string,
  aEnd: string,
  bStart: string,
  bEnd: string,
): boolean {
  return aStart < bEnd && bStart < aEnd;
}

const createPricingRule = async (
  groundId: string,
  userId: string,
  payload: CreatePricingRulePayload,
) => {
  await checkGroundOwnership(groundId, userId);

  const rulesForDayType = await prisma.pricingRule.findMany({
    where: { groundId, dayType: payload.dayType },
  });

  const overlaps = rulesForDayType.some((rule) =>
    timeRangesOverlap(
      payload.startTime,
      payload.endTime,
      rule.startTime,
      rule.endTime,
    ),
  );

  if (overlaps) {
    throw new Error(
      `A pricing rule already covers part of this time range for ${payload.dayType}`,
    );
  }

  return await prisma.pricingRule.create({
    data: {
      groundId,
      ...payload,
    },
  });
};

const getPricingRulesByGround = async (groundId: string) => {
  return await prisma.pricingRule.findMany({
    where: { groundId },
    orderBy: { dayType: "asc" },
  });
};

const updatePricingRule = async (
  groundId: string,
  ruleId: string,
  userId: string,
  payload: Partial<CreatePricingRulePayload>,
) => {
  await checkGroundOwnership(groundId, userId);

  const rule = await prisma.pricingRule.findFirst({
    where: { id: ruleId, groundId },
  });

  if (!rule) {
    throw new Error("Pricing rule not found");
  }

  return await prisma.pricingRule.update({
    where: { id: ruleId },
    data: payload,
  });
};

const deletePricingRule = async (
  groundId: string,
  ruleId: string,
  userId: string,
) => {
  await checkGroundOwnership(groundId, userId);

  const rule = await prisma.pricingRule.findFirst({
    where: { id: ruleId, groundId },
  });

  if (!rule) {
    throw new Error("Pricing rule not found");
  }

  return await prisma.pricingRule.delete({
    where: { id: ruleId },
  });
};

export const pricingRuleService = {
  createPricingRule,
  getPricingRulesByGround,
  updatePricingRule,
  deletePricingRule,
};
