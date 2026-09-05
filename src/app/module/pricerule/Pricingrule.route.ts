import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { PricingRuleValidation } from "./Pricingrule.validation";
import { pricingRuleController } from "./Pricingrule.controller";
const router = Router();

router.post(
  "/:groundId/pricing-rules",
  auth(Role.OWNER),
  validateRequest(PricingRuleValidation.pricingRuleValidationSchema),
  pricingRuleController.createPricingRule,
);

router.get(
  "/:groundId/pricing-rules",
  pricingRuleController.getPricingRulesByGround,
);

router.patch(
  "/:groundId/pricing-rules/:id",
  auth(Role.OWNER),
  validateRequest(PricingRuleValidation.updatePricingRuleValidationSchema),
  pricingRuleController.updatePricingRule,
);

router.delete(
  "/:groundId/pricing-rules/:id",
  auth(Role.OWNER),
  pricingRuleController.deletePricingRule,
);

export const PricingRuleRoutes = router;
