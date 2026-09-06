import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import type { Request, Response } from "express";
import { groundService } from "./ground.service";

const createGround = catchAsync(async (req: Request, res: Response) => {
  const groundData = req.body;
  const userId = req.user?.userId;
  const result = await groundService.createGround(groundData, userId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ground created successfully",
    data: result,
  });
});

const getAllGround = catchAsync(async (req: Request, res: Response) => {
  const result = await groundService.getAllGround(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Grounds retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSingleGround = catchAsync(async (req: Request, res: Response) => {
  const userId = req.params.id;
  const result = await groundService.getSingleGround(userId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ground retrieved successfully",
    data: result,
  });
});

const updateGround = catchAsync(async (req: Request, res: Response) => {
  const groundData = req.body;
  const userId = req.params.id;
  const result = await groundService.updateGround(groundData, userId as string);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ground updated successfully",
    data: result,
  });
});

export const groundController = {
  createGround,
  getAllGround,
  getSingleGround,
  updateGround,
};
