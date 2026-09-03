import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
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
    });

    return ownerProfile;
  });

  return transactionResult;
};

export const ownerService = {
  requestForOwnerAccount,
};
