import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { payoutService } from "./payout.service";

const getBalance = catchAsync(async (req: Request, res: Response) => {
  const result = await payoutService.getOwnerBalance(req.user!.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payout balance retrieved successfully",
    data: result,
  });
});

const requestPayout = catchAsync(async (req: Request, res: Response) => {
  const result = await payoutService.requestPayout(
    req.user!.userId,
    req.body.amount === undefined ? undefined : Number(req.body.amount),
  );
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Payout requested successfully",
    data: result,
  });
});

const getMyPayouts = catchAsync(async (req: Request, res: Response) => {
  const result = await payoutService.getMyPayouts(req.user!.userId);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payouts retrieved successfully",
    data: result,
  });
});

const getAllPayouts = catchAsync(async (_req: Request, res: Response) => {
  const result = await payoutService.getAllPayouts();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payouts retrieved successfully",
    data: result,
  });
});

const approvePayout = catchAsync(async (req: Request, res: Response) => {
  const result = await payoutService.approvePayout(req.params.payoutId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payout approved successfully",
    data: result,
  });
});

const markPayoutPaid = catchAsync(async (req: Request, res: Response) => {
  const result = await payoutService.markPayoutPaid(req.params.payoutId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Payout marked as paid successfully",
    data: result,
  });
});

export const payoutController = {
  getBalance,
  requestPayout,
  getMyPayouts,
  getAllPayouts,
  approvePayout,
  markPayoutPaid,
};
