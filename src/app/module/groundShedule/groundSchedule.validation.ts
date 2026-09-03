import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm format

const scheduleValidationSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    openTime: z.string().regex(timeRegex, "Invalid open time format (HH:mm)"),
    closeTime: z.string().regex(timeRegex, "Invalid close time format (HH:mm)"),
    slotDurationMin: z.number().int().positive(),
  })
  .refine(
    (data) => {
      const [openH, openM] = data.openTime.split(":").map(Number);
      const [closeH, closeM] = data.closeTime.split(":").map(Number);

      const openTotal = openH * 60 + openM;
      const closeTotal = closeH * 60 + closeM;

      const totalWindow = closeTotal - openTotal;

      return totalWindow > 0 && totalWindow % data.slotDurationMin === 0;
    },
    {
      message:
        "closeTime must be after openTime, and slotDurationMin must evenly divide the operating window",
      path: ["slotDurationMin"],
    },
  );

export const GroundScheduleValidation = {
  createSchedule: z.object({
    body: scheduleValidationSchema,
  }),
  updateSchedule: z.object({
    body: scheduleValidationSchema.partial(),
  }),
};
