import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { ownerController } from "./owner.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { OwnerValidation } from "./owner.validation";
import { upload } from "../../lib/multer";

const router = Router();

router.get(
  "/owner-request",
  auth(Role.ADMIN),
  ownerController.getAllOwnerRequests,
);

router.get(
  "/owner-request/:userId",
  auth(Role.ADMIN),
  ownerController.getSingleOwnerRequest,
);

router.post(
  "/owner-request",
  auth(Role.ADMIN, Role.PLAYER),
  upload.single("licenseDoc"),
  ownerController.requestOwnerAccount,
);

router.post(
  "/my-owner-application",
  auth(Role.ADMIN, Role.PLAYER, Role.OWNER),
  ownerController.requestOwnerAccount,
);

export const OwnerRoutes = router;
