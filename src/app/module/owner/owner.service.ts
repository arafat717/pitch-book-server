import type { UploadApiResponse } from "cloudinary";
import ejs from "ejs";
import path from "path";
import { Role, VerificationStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { cloudinary } from "../../lib/cloudinary";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";
import { OwnerRequestPayload, OwnerRequestQueryParams } from "./owner.interface";

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

const getAllOwnerRequests = async (query: OwnerRequestQueryParams) => {
  const getQueryValue = (value: unknown) => {
    if (typeof value === "string") {
      return value;
    }

    return Array.isArray(value) && typeof value[0] === "string"
      ? value[0]
      : undefined;
  };
  const page = Math.max(Number(getQueryValue(query.page)) || 1, 1);
  const limit = Math.min(
    Math.max(Number(getQueryValue(query.limit)) || 10, 1),
    100,
  );
  const skip = (page - 1) * limit;
  const where = {
    verificationStatus: VerificationStatus.PENDING,
    user: {
      is: {
        role: { not: Role.OWNER },
      },
    },
  };

  const [data, total] = await Promise.all([
    prisma.ownerProfile.findMany({
      where,
      skip,
      take: limit,
      orderBy: { id: "asc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true,
          },
        },
      },
    }),
    prisma.ownerProfile.count({ where }),
  ]);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

const getSingleOwnerRequest = async (userId: string) => {
  const ownerRequest = await prisma.ownerProfile.findUnique({
    where: { userId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
        },
      },
    },
  });

  if (!ownerRequest) {
    throw new Error("Owner request not found");
  }

  return ownerRequest;
};

export const ownerService = {
  requestForOwnerAccount,
  getAllOwnerRequests,
  getSingleOwnerRequest,
};
