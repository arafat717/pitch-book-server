import { z } from "zod";
import { DayType } from "../../../generated/prisma/enums";

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm, 24-hour

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

const pricingRuleBodyBase = {
  dayType: z.nativeEnum(DayType, "Day type is required"),
  startTime: z
    .string("Start time is required")
    .regex(timeRegex, "startTime must be in HH:mm 24-hour format"),
  endTime: z
    .string("End time is required")
    .regex(timeRegex, "endTime must be in HH:mm 24-hour format"),
  price: z.number("Price is required").positive("Price must be greater than 0"),
};

const pricingRuleValidationSchema = z
  .object(pricingRuleBodyBase)
  .refine((data) => toMinutes(data.endTime) > toMinutes(data.startTime), {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

const updatePricingRuleValidationSchema = z
  .object(pricingRuleBodyBase)
  .partial()
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided to update",
  })
  .refine(
    (data) => {
      if (data.startTime === undefined || data.endTime === undefined) {
        return true;
      }
      return toMinutes(data.endTime) > toMinutes(data.startTime);
    },
    { message: "endTime must be after startTime", path: ["endTime"] },
  );

export const PricingRuleValidation = {
  pricingRuleValidationSchema,
  updatePricingRuleValidationSchema,
};
