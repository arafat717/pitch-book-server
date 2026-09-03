import z from "zod";
import { SportType } from "../../../generated/prisma/enums";

const createGroundSchema = z.object({
  name: z
    .string("Ground name is required")
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters"),
  address: z
    .string("Address is required")
    .trim()
    .min(5, "Address must be at least 5 characters"),
  latitude: z.number("Latitude is required").min(-90).max(90),
  longitude: z.number("Longitude is required").min(-180).max(180),
  sportTypes: z.nativeEnum(SportType, "Sport type is required"),
});

const updateGroundSchema = z.object({
  name: z
    .string("Ground name is required")
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be under 100 characters")
    .optional(),
  address: z
    .string("Address is required")
    .trim()
    .min(5, "Address must be at least 5 characters")
    .optional(),
  latitude: z.number("Latitude is required").min(-90).max(90).optional(),
  longitude: z.number("Longitude is required").min(-180).max(180).optional(),
  sportTypes: z.nativeEnum(SportType, "Sport type is required").optional(),
});

export const GroundValidation = {
  createGroundSchema,
  updateGroundSchema,
};
