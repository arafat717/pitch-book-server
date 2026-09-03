import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { Request, Response } from "express";
import { adminService } from "./admin.service";

const approveOwnerApplication = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const result = await adminService.approveOwnerApplication(userId as string);

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Owner account approved successfully",
      data: result,
    });
  },
);

const rejectOwnerApplication = catchAsync(
  async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const result = await adminService.rejectOwnerApplication(userId as string);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Owner account rejected!",
      data: result,
    });
  },
);

export const adminController = {
  approveOwnerApplication,
  rejectOwnerApplication,
};
