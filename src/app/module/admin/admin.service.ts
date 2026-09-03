import { VerificationStatus } from "../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";

const approveOwnerApplication = async (userId: string) => {
  const transactionResult = await prisma.$transaction(async (tx) => {
    const userExists = await prisma.ownerProfile.findUnique({
      where: { userId: userId },
    });

    if (!userExists) {
      throw new Error("Owner application not found for the given user ID");
    }

    const updatedProfile = await prisma.ownerProfile.update({
      where: { userId: userId },
      data: { verificationStatus: VerificationStatus.VERIFIED },
    });

    await prisma.user.update({
      where: { id: userId },
      data: { role: "OWNER" },
    });

    return updatedProfile;
  });
  return transactionResult;
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
