import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { ownerService } from "./owner.service";
import { Request, Response } from "express";

const requestOwnerAccount = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body?.data ? JSON.parse(req.body.data) : req.body;
  const file = req.file;
  const userId = req.user?.userId as string;
  if (!userId) {
    throw new Error("User ID is missing in the request");
  }

  if (!file) {
    throw new Error("License document is required");
  }

  if (
    typeof payload?.businessName !== "string" ||
    !payload.businessName.trim()
  ) {
    throw new Error("Business name is required");
  }

  const result = await ownerService.requestForOwnerAccount(
    { ...payload, licenseDoc: file },
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Owner account requested successfully",
    data: result,
  });
});

const getAllOwnerRequests = catchAsync(async (req: Request, res: Response) => {
  const result = await ownerService.getAllOwnerRequests(req.query);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Owner requests retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleOwnerRequest = catchAsync(
  async (req: Request, res: Response) => {
    const result = await ownerService.getSingleOwnerRequest(
      req.params.userId as string,
    );

    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: "Owner request retrieved successfully",
      data: result,
    });
  },
);

export const ownerController = {
  requestOwnerAccount,
  getAllOwnerRequests,
  getSingleOwnerRequest,
};
