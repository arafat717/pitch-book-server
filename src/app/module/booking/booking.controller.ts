import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";
import { bookSlotService } from "./booking.service";

const bookSlot = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user!;
  const result = await bookSlotService.bookSlot(payload, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Success",
    data: result,
  });
});

const bookSlotCallback = catchAsync(async (req: Request, res: Response) => {
  const { redirectUrl } = await bookSlotService.bookSlotCallback(req.query);
  res.redirect(redirectUrl!);
});

const paySlot = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user!;
  const { paymentUrl } = await bookSlotService.payBookingSlot(payload, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Bkash initial successfully!",
    data: paymentUrl,
  });
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user!;
  const result = await bookSlotService.cancelBookingSlot(payload, user);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "Booking cancelled successfully!",
    data: result,
  });
});

export const bookSlotController = {
  bookSlot,
  bookSlotCallback,
  paySlot,
  cancelBooking,
};
