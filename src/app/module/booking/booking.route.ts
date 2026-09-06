import { Router } from "express";
import { auth } from "../../middleware/checkAuth";
import { Role } from "../../../generated/prisma/enums";
import { bookSlotController } from "./booking.controller";

const router = Router();

router.post(
  "/",
  auth(Role.PLAYER),
  bookSlotController.bookSlot,
);
router.post(
  "/pay-slot",
  auth(Role.PLAYER),
  bookSlotController.paySlot,
);
router.post(
  "/cancel-slot",
  auth(Role.PLAYER),
  bookSlotController.cancelBooking,
);
router.get(
  "/payment/callback",
  bookSlotController.bookSlotCallback,
);
export const bookSlotRouter = router;
