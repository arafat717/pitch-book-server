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

export const ownerController = {
  requestOwnerAccount,
};
