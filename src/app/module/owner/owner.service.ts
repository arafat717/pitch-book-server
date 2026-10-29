import type { UploadApiResponse } from "cloudinary";
import ejs from "ejs";
import path from "path";
import config from "../../config";
import { cloudinary } from "../../lib/cloudinary";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { OwnerRequestPayload } from "./owner.interface";

const requestForOwnerAccount = async (
  payload: OwnerRequestPayload,
  userId: string,
) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const existingProfile = await tx.ownerProfile.findUnique({
      where: { userId },
    });

    if (existingProfile) {
      throw new Error("You have already requested an owner account");
    }

    const uploadResult = await new Promise<UploadApiResponse>(
      (resolve, reject) => {
        cloudinary.uploader
          .upload_stream(
            {
              resource_type: "auto",
            },
            (error, result) => {
              if (error) {
                return reject(error);
              }

              if (!result) {
                return reject(new Error("No result returned from Cloudinary"));
              }

              resolve(result);
            },
          )
          .end(payload.licenseDoc.buffer);
      },
    );

    const ownerProfile = await tx.ownerProfile.create({
      data: {
        userId,
        businessName: payload.businessName,
        licenseDocUrl: uploadResult.secure_url,
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return { ownerProfile, user: ownerProfile.user };
  });

  const { ownerProfile, user } = transactionResult;
  const templatePath = path.join(
    process.cwd(),
    "src",
    "app",
    "templates",
    "owner-application-confirmation.ejs",
  );
  const html = await ejs.renderFile(templatePath, {
    name: user.name,
    businessName: ownerProfile.businessName,
  });

  await transporter.sendMail({
    from: config.email_sender || config.smtp_user,
    to: user.email,
    subject: "Owner application received",
    html,
  });

  return ownerProfile;
};

export const ownerService = {
  requestForOwnerAccount,
};
