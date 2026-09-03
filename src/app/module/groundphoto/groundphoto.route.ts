import { Router } from "express";
import { Role } from "../../../generated/prisma/browser";
import { auth } from "../../middleware/checkAuth";
import { groundPhotoController } from "./groundphoto.controller";
import { upload } from "../../lib/multer";

const router = Router();

router.post(
  "/add-ground-photo/:id",
  auth(Role.OWNER),
  upload.array("photos", 10),
  groundPhotoController.addgroundPhoto,
);

export const groundPhotoRoutes = router;
