import z from "zod";

const applyOwnerSchema = z.object({
  businessName: z
    .string("Business name is required")
    .trim()
    .min(2, "Business name must be at least 2 characters")
    .max(100, "Business name must be under 100 characters"),
});

export const OwnerValidation = {
  applyOwnerSchema,
};
