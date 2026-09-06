import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { payoutController } from "./payout.controller";

const router = Router();

router.get("/balance", auth(Role.OWNER), payoutController.getBalance);
router.post("/request", auth(Role.OWNER), payoutController.requestPayout);
router.get("/my", auth(Role.OWNER), payoutController.getMyPayouts);
router.get("/", auth(Role.ADMIN), payoutController.getAllPayouts);
router.patch(
  "/:payoutId/approve",
  auth(Role.ADMIN),
  payoutController.approvePayout,
);
router.patch(
  "/:payoutId/pay",
  auth(Role.ADMIN),
  payoutController.markPayoutPaid,
);

export const payoutRoutes = router;
