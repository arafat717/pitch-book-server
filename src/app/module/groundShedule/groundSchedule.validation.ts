import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const closeTimeRegex = /^(?:([01]\d|2[0-3]):([0-5]\d)|24:00)$/;

const scheduleValidationSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6),
    openTime: z.string().regex(timeRegex, "Invalid open time format (HH:mm)"),
    closeTime: z
      .string()
      .regex(closeTimeRegex, "Invalid close time format (HH:mm)"),
    slotDurationMin: z.number().int().positive(),
  })
  .refine(
    (data) => {
      const [openH, openM] = data.openTime.split(":").map(Number);

      const [closeH, closeM] = data.closeTime.split(":").map(Number);

      const openTotal = openH * 60 + openM;

      // Treat 24:00 as midnight at the end of the day
      const closeTotal =
        data.closeTime === "24:00" ? 1440 : closeH * 60 + closeM;

      const totalWindow = closeTotal - openTotal;

      return totalWindow > 0 && totalWindow % data.slotDurationMin === 0;
    },
    {
      message:
        "closeTime must be after openTime, and slotDurationMin must evenly divide the operating window",
      path: ["slotDurationMin"],
    },
  );

const updateScheduleValidationSchema = z
  .object({
    dayOfWeek: z.number().int().min(0).max(6).optional(),
    openTime: z
      .string()
      .regex(timeRegex, "Invalid open time format (HH:mm)")
      .optional(),
    closeTime: z
      .string()
      .regex(closeTimeRegex, "Invalid close time format (HH:mm)")
      .optional(),
    slotDurationMin: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      // Validate the time window only when all fields are provided.
      if (!data.openTime || !data.closeTime || !data.slotDurationMin) {
        return true;
      }

      const [openH, openM] = data.openTime.split(":").map(Number);
      const [closeH, closeM] = data.closeTime.split(":").map(Number);

      const openTotal = openH * 60 + openM;

      // Treat 24:00 as midnight at the end of the day.
      const closeTotal =
        data.closeTime === "24:00" ? 1440 : closeH * 60 + closeM;

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
  scheduleValidationSchema,
  updateScheduleValidationSchema,
};
