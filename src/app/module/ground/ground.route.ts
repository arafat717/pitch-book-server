import { Router } from "express";
import { Role } from "../../../generated/prisma/browser";
import { auth } from "../../middleware/checkAuth";
import { groundController } from "./ground.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { GroundValidation } from "./ground.validation";

const router = Router();

router.post(
  "/create-ground",
  auth(Role.OWNER),
  validateRequest(GroundValidation.createGroundSchema),
  groundController.createGround,
);

router.get(
  "/",
  auth(Role.OWNER, Role.ADMIN, Role.PLAYER),
  groundController.getAllGround,
);
router.get(
  "/:id",
  auth(Role.OWNER, Role.ADMIN, Role.PLAYER),
  groundController.getSingleGround,
);

router.patch(
  "/update-ground/:id",
  auth(Role.OWNER),
  validateRequest(GroundValidation.updateGroundSchema),
  groundController.updateGround,
);

export const groundRoutes = router;
