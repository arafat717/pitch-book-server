import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { pricingRuleService } from "./Pricingrule.service";

const createPricingRule = catchAsync(async (req: Request, res: Response) => {
  const { groundId } = req.params;
  const userId = req.user?.userId as string;

  const result = await pricingRuleService.createPricingRule(
    groundId as string,
    userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Pricing rule created successfully",
    data: result,
  });
});

const getPricingRulesByGround = catchAsync(
  async (req: Request, res: Response) => {
    const { groundId } = req.params;

    const result = await pricingRuleService.getPricingRulesByGround(
      groundId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Pricing rules retrieved successfully",
      data: result,
    });
  },
);

const updatePricingRule = catchAsync(async (req: Request, res: Response) => {
  const { groundId, id } = req.params;
  const userId = req.user?.userId as string;

  const result = await pricingRuleService.updatePricingRule(
    groundId as string,
    id as string,
    userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Pricing rule updated successfully",
    data: result,
  });
});

const deletePricingRule = catchAsync(async (req: Request, res: Response) => {
  const { groundId, id } = req.params;
  const userId = req.user?.userId as string;

  await pricingRuleService.deletePricingRule(
    groundId as string,
    id as string,
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Pricing rule deleted successfully",
    data: null,
  });
});

export const pricingRuleController = {
  createPricingRule,
  getPricingRulesByGround,
  updatePricingRule,
  deletePricingRule,
};
