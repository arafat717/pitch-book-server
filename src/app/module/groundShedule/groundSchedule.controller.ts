import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { groundScheduleService } from "./groundSchedule.service";

const createSchedule = catchAsync(async (req: Request, res: Response) => {
  const { groundId } = req.params;
  const userId = req.user?.userId as string;

  const result = await groundScheduleService.createSchedule(
    groundId as string,
    userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Ground schedule created successfully",
    data: result,
  });
});

const getSchedulesByGround = catchAsync(async (req: Request, res: Response) => {
  const { groundId } = req.params;

  const result = await groundScheduleService.getSchedulesByGround(
    groundId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ground schedules retrieved successfully",
    data: result,
  });
});

const updateSchedule = catchAsync(async (req: Request, res: Response) => {
  const { groundId, id } = req.params;
  const userId = req.user?.userId as string;

  const result = await groundScheduleService.updateSchedule(
    groundId as string,
    id as string,
    userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ground schedule updated successfully",
    data: result,
  });
});

const deleteSchedule = catchAsync(async (req: Request, res: Response) => {
  const { groundId, id } = req.params;
  const userId = req.user?.userId as string;

  await groundScheduleService.deleteSchedule(
    groundId as string,
    id as string,
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Ground schedule deleted successfully",
    data: null,
  });
});

export const groundScheduleController = {
  createSchedule,
  getSchedulesByGround,
  updateSchedule,
  deleteSchedule,
};
