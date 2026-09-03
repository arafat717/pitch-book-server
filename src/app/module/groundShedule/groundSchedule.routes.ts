import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { GroundScheduleValidation } from "./groundSchedule.validation";
import { groundScheduleController } from "./groundSchedule.controller";
const router = Router();

router.post(
  "/grounds/:groundId/schedules",
  auth(Role.OWNER),
  validateRequest(GroundScheduleValidation.createSchedule),
  groundScheduleController.createSchedule,
);

router.get(
  "/grounds/:groundId/schedules",
  groundScheduleController.getSchedulesByGround,
);

router.patch(
  "/grounds/:groundId/schedules/:id",
  auth(Role.OWNER),
  validateRequest(GroundScheduleValidation.updateSchedule),
  groundScheduleController.updateSchedule,
);

router.delete(
  "/grounds/:groundId/schedules/:id",
  auth(Role.OWNER),
  groundScheduleController.deleteSchedule,
);

export const GroundScheduleRoutes = router;
