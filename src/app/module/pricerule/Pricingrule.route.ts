import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PricingRuleValidation } from "./Pricingrule.validation";
import { pricingRuleController } from "./Pricingrule.controller";
const router = Router();

router.post(
  "/grounds/:groundId/pricing-rules",
  auth(Role.OWNER),
  validateRequest(PricingRuleValidation.pricingRuleValidationSchema),
  pricingRuleController.createPricingRule,
);

router.get(
  "/grounds/:groundId/pricing-rules",
  pricingRuleController.getPricingRulesByGround,
);

router.patch(
  "/grounds/:groundId/pricing-rules/:id",
  auth(Role.OWNER),
  validateRequest(PricingRuleValidation.updatePricingRuleValidationSchema),
  pricingRuleController.updatePricingRule,
);

router.delete(
  "/grounds/:groundId/pricing-rules/:id",
  auth(Role.OWNER),
  pricingRuleController.deletePricingRule,
);

export const PricingRuleRoutes = router;
