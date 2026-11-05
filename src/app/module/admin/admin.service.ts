import ejs from "ejs";
import path from "path";
import { VerificationStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { transporter } from "../../lib/nodemailer";
import { prisma } from "../../lib/prisma";

type OwnerApplicationStatus = "approved" | "rejected";

const sendOwnerApplicationStatusEmail = async (
  name: string,
  email: string,
  businessName: string,
  status: OwnerApplicationStatus,
) => {
  const templatePath = path.join(
    process.cwd(),
    "src",
    "app",
    "templates",
    "owner-application-status.ejs",
  );
  const html = await ejs.renderFile(templatePath, {
    name,
    businessName,
    status,
  });

  await transporter.sendMail({
    from: config.email_sender || config.smtp_user,
    to: email,
    subject: `Owner application ${status}`,
    html,
  });
};

const approveOwnerApplication = async (userId: string) => {
  try {
    const ownerApplication = await prisma.$transaction(async (tx) => {
      const existingProfile = await tx.ownerProfile.findUnique({
        where: { userId },
      });

      if (!existingProfile) {
        throw new Error("Owner application not found for the given user ID");
      }

      await tx.ownerProfile.update({
        where: { userId },
        data: {
          verificationStatus: VerificationStatus.VERIFIED,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { role: "OWNER" },
      });

      return tx.ownerProfile.findUniqueOrThrow({
        where: { userId },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      });
    });

    await sendOwnerApplicationStatusEmail(
      ownerApplication.user.name,
      ownerApplication.user.email,
      ownerApplication.businessName,
      "approved",
    );

    return ownerApplication;
  } catch (error) {
    console.error("Approve owner application failed:", error);
    throw error;
  }
};

const rejectOwnerApplication = async (userId: string) => {
  const ownerApplication = await prisma.ownerProfile.findUnique({
    where: { userId },
  });

  if (!ownerApplication) {
    throw new Error("Owner application not found for the given user ID");
  }

  const updatedProfile = await prisma.ownerProfile.update({
    where: { userId },
    data: { verificationStatus: VerificationStatus.REJECTED },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  await sendOwnerApplicationStatusEmail(
    updatedProfile.user.name,
    updatedProfile.user.email,
    updatedProfile.businessName,
    "rejected",
  );

  return updatedProfile;
};

export const adminService = {
  approveOwnerApplication,
  rejectOwnerApplication,
};
