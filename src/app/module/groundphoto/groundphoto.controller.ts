import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { groundPhotoService } from "./groundphoto.sevice";

const addgroundPhoto = catchAsync(async (req: Request, res: Response) => {
  const files = req.files as Express.Multer.File[] | undefined;
  const result = await groundPhotoService.addGroundPhoto({
    groundId: req.params.id as string,
    files: files ?? [],
    userId: req.user?.userId as string,
  });
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ground photos added successfully",
    data: result,
  });
});

export const groundPhotoController = { addgroundPhoto };
