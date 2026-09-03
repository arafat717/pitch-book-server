import { Router } from "express";
import { Role } from "../../../generated/prisma/browser";
import { auth } from "../../middleware/checkAuth";
import { adminController } from "./admin.controller";

const router = Router();

router.patch(
  "/owner-applications/:userId/approve",
  auth(Role.ADMIN),
  adminController.approveOwnerApplication,
);

router.patch(
  "/owner-applications/:userId/reject",
  auth(Role.ADMIN),
  adminController.rejectOwnerApplication,
);

export const adminRoutes = router;
