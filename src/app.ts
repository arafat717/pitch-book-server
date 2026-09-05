import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { OwnerRoutes } from "./app/module/owner/owner.route";
import { adminRoutes } from "./app/module/admin/admin.route";
import { groundRoutes } from "./app/module/ground/ground.route";
import { groundPhotoRoutes } from "./app/module/groundphoto/groundphoto.route";
import { GroundScheduleRoutes } from "./app/module/groundShedule/groundSchedule.routes";
import { PricingRuleRoutes } from "./app/module/pricerule/Pricingrule.route";
import { SlotRoutes } from "./app/module/slot/Slot.route";

const app: Application = express();

app.use(
  cors({
    origin: config.frontend_url,
    credentials: true,
  }),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/owner", OwnerRoutes);
app.use("/api/v1/ground", groundRoutes);
app.use("/api/v1/ground-photo", groundPhotoRoutes);
app.use("/api/v1/ground-schedule", GroundScheduleRoutes);
app.use("/api/v1/ground-price", PricingRuleRoutes);
app.use("/api/v1/ground-slots", SlotRoutes);
app.use("/api/v1/admin", adminRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Welcome to turf booking System Backend",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
