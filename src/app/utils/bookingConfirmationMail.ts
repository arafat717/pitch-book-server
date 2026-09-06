import PDFDocument from "pdfkit";
import config from "../config";
import { transporter } from "../lib/nodemailer";

type BookingConfirmation = {
  id: string;
  totalAmount: unknown;
  createdAt: Date;
  player: { name: string; email: string };
  ground: { name: string; address: string; sportTypes: string };
  slot: { date: Date; startTime: string; endTime: string };
};

const createBookingPdf = (booking: BookingConfirmation) =>
  new Promise<Buffer>((resolve, reject) => {
    const document = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    document.on("data", (chunk: Buffer) => chunks.push(chunk));
    document.on("end", () => resolve(Buffer.concat(chunks)));
    document.on("error", reject);

    document
      .fontSize(24)
      .text("Turfy Booking Confirmation", { align: "center" });
    document.moveDown();
    document.fontSize(12).text(`Booking ID: ${booking.id}`);
    document.text(`Player: ${booking.player.name}`);
    document.text(`Email: ${booking.player.email}`);
    document.moveDown();
    document.fontSize(16).text("Slot details");
    document.moveDown(0.5);
    document.fontSize(12).text(`Ground: ${booking.ground.name}`);
    document.text(`Address: ${booking.ground.address}`);
    document.text(`Sport: ${booking.ground.sportTypes}`);
    document.text(`Date: ${booking.slot.date.toISOString().slice(0, 10)}`);
    document.text(`Time: ${booking.slot.startTime} - ${booking.slot.endTime}`);
    document.text(`Amount paid: BDT ${booking.totalAmount}`);
    document.moveDown();
    document.text("Your booking is confirmed. Please arrive on time.");
    document.end();
  });

export const sendBookingConfirmationMail = async (
  booking: BookingConfirmation,
) => {
  const pdf = await createBookingPdf(booking);

  await transporter.sendMail({
    from: config.email_sender || config.smtp_user,
    to: booking.player.email,
    subject: `Booking confirmed - ${booking.ground.name}`,
    text: `Hi ${booking.player.name}, your booking at ${booking.ground.name} is confirmed. The booking details are attached as a PDF.`,
    attachments: [
      {
        filename: `booking-${booking.id}.pdf`,
        content: pdf,
        contentType: "application/pdf",
      },
    ],
  });
};
