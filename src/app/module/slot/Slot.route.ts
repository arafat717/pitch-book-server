import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { SlotValidation } from "./Slot.validation";
import { slotController } from "./Slot.controller";

const router = Router();

router.post(
  "/:groundId/slots/generate",
  auth(Role.OWNER),
  validateRequest(SlotValidation.generateSlotsValidationSchema),
  slotController.generateSlots,
);

router.post(
  "/:groundId/slots/reprice",
  auth(Role.OWNER),
  validateRequest(SlotValidation.generateSlotsValidationSchema),
  slotController.repriceSlots,
);

router.get("/:groundId/slots", slotController.getSlotsByDate);

router.patch(
  "/:groundId/slots/:id/block",
  auth(Role.OWNER),
  slotController.blockSlot,
);

router.patch(
  "/:groundId/slots/:id/unblock",
  auth(Role.OWNER),
  slotController.unblockSlot,
);

export const SlotRoutes = router;
