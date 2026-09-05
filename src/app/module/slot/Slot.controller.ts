import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { slotService } from "./Slot.service";

const generateSlots = catchAsync(async (req: Request, res: Response) => {
  const { groundId } = req.params;
  const userId = req.user?.userId as string;

  const result = await slotService.generateSlots(
    groundId as string,
    userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: `${result.created} slot(s) generated successfully`,
    data: result,
  });
});

const repriceSlots = catchAsync(async (req: Request, res: Response) => {
  const { groundId } = req.params;
  const userId = req.user?.userId as string;

  const result = await slotService.repriceSlots(
    groundId as string,
    userId,
    req.body,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: `${result.updated} of ${result.checked} slot(s) repriced`,
    data: result,
  });
});

const getSlotsByDate = catchAsync(async (req: Request, res: Response) => {
  const { groundId } = req.params;
  const { date } = req.query;

  const result = await slotService.getSlotsByDate(
    groundId as string,
    date as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Slots retrieved successfully",
    data: result,
  });
});

const blockSlot = catchAsync(async (req: Request, res: Response) => {
  const { groundId, id } = req.params;
  const userId = req.user?.userId as string;

  const result = await slotService.blockSlot(
    groundId as string,
    id as string,
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Slot blocked successfully",
    data: result,
  });
});

const unblockSlot = catchAsync(async (req: Request, res: Response) => {
  const { groundId, id } = req.params;
  const userId = req.user?.userId as string;

  const result = await slotService.unblockSlot(
    groundId as string,
    id as string,
    userId,
  );

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Slot unblocked successfully",
    data: result,
  });
});

export const slotController = {
  generateSlots,
  repriceSlots,
  getSlotsByDate,
  blockSlot,
  unblockSlot,
};
