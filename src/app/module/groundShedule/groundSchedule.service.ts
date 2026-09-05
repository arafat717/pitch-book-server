import { prisma } from "../../lib/prisma";

interface CreateSchedulePayload {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  slotDurationMin: number;
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

  // console.log("ids==>", user?.userId, userId);

  if (!ground) {
    throw new Error("Ground not found");
  }

  if (user?.userId !== userId) {
    throw new Error(
      "You are not authorized to modify schedules for this ground",
    );
  }
};

const createSchedule = async (
  groundId: string,
  userId: string,
  payload: CreateSchedulePayload,
) => {
  await checkGroundOwnership(groundId, userId);

  const existingSchedule = await prisma.groundSchedule.findFirst({
    where: {
      groundId,
      dayOfWeek: payload.dayOfWeek,
    },
  });

  if (existingSchedule) {
    throw new Error(
      `Schedule for dayOfWeek ${payload.dayOfWeek} already exists for this ground`,
    );
  }

  return await prisma.groundSchedule.create({
    data: {
      groundId,
      ...payload,
    },
  });
};

const getSchedulesByGround = async (groundId: string) => {
  return await prisma.groundSchedule.findMany({
    where: { groundId },
    orderBy: { dayOfWeek: "asc" },
  });
};

const updateSchedule = async (
  groundId: string,
  scheduleId: string,
  userId: string,
  payload: Partial<CreateSchedulePayload>,
) => {
  await checkGroundOwnership(groundId, userId);

  const schedule = await prisma.groundSchedule.findFirst({
    where: { id: scheduleId, groundId },
  });

  if (!schedule) {
    throw new Error("Schedule record not found");
  }

  return await prisma.groundSchedule.update({
    where: { id: scheduleId },
    data: payload,
  });
};

const deleteSchedule = async (
  groundId: string,
  scheduleId: string,
  userId: string,
) => {
  await checkGroundOwnership(groundId, userId);

  const schedule = await prisma.groundSchedule.findFirst({
    where: { id: scheduleId, groundId },
  });

  if (!schedule) {
    throw new Error("Schedule record not found");
  }

  return await prisma.groundSchedule.delete({
    where: { id: scheduleId },
  });
};

export const groundScheduleService = {
  createSchedule,
  getSchedulesByGround,
  updateSchedule,
  deleteSchedule,
};
