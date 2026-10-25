import { VerificationStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const approveOwnerApplication = async (userId: string) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const userExists = await tx.ownerProfile.findUnique({
        where: { userId },
      });

      if (!userExists) {
        throw new Error("Owner application not found for the given user ID");
      }

      const updatedProfile = await tx.ownerProfile.update({
        where: { userId },
        data: {
          verificationStatus: VerificationStatus.VERIFIED,
        },
      });

      await tx.user.update({
        where: { id: userId },
        data: { role: "OWNER" },
      });

      return updatedProfile;
    });
  } catch (error) {
    console.error("Approve owner application failed:", error);
    throw error;
  }
};

const rejectOwnerApplication = async (userId: string) => {
  const userExists = await prisma.ownerProfile.findUnique({
    where: { userId: userId },
  });

  if (!userExists) {
    throw new Error("Owner application not found for the given user ID");
  }

  const updatedProfile = await prisma.ownerProfile.update({
    where: { userId: userId },
    data: { verificationStatus: VerificationStatus.REJECTED },
  });

  return updatedProfile;
};

export const adminService = {
  approveOwnerApplication,
  rejectOwnerApplication,
};
