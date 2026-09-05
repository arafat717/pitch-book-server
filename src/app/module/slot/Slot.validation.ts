import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

const generateSlotsValidationSchema = z
  .object({
    fromDate: z
      .string("From date is required")
      .regex(dateRegex, "fromDate must be in YYYY-MM-DD format"),
    toDate: z
      .string("To date is required")
      .regex(dateRegex, "toDate must be in YYYY-MM-DD format"),
  })
  .refine((data) => new Date(data.toDate) >= new Date(data.fromDate), {
    message: "toDate must be on or after fromDate",
    path: ["toDate"],
  })
  .refine(
    (data) => {
      const diffDays =
        (new Date(data.toDate).getTime() - new Date(data.fromDate).getTime()) /
        (1000 * 60 * 60 * 24);
      return diffDays <= 60;
    },
    {
      message: "Date range cannot exceed 60 days at a time",
      path: ["toDate"],
    },
  );

export const SlotValidation = {
  generateSlotsValidationSchema,
};
