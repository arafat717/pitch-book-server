import { prisma } from "../../lib/prisma";

const createGround = async (groundData: any, userId: string) => {
  console.log("uesrId here ==", userId);
  const existingGround = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    include: {
      ownerProfile: true,
    },
  });

  if (!existingGround) {
    throw new Error("User not found");
  }

  const result = await prisma.ground.create({
    data: {
      ownerId: existingGround.ownerProfile?.id as string,
      name: groundData.name,
      address: groundData.address,
      latitude: groundData.latitude,
      longitude: groundData.longitude,
      sportTypes: groundData.sportTypes,
    },
  });

  return result;
};

const getAllGround = async () => {
  const existingGround = await prisma.ground.findMany();
  return existingGround;
};

const getSingleGround = async (userId: string) => {
  const existingGround = await prisma.ground.findFirst({
    where: {
      id: userId,
    },
    include: {
      photos: true,
    },
  });

  if (!existingGround) {
    throw new Error("User not found");
  }

  return existingGround;
};

const updateGround = async (groundData: any, userId: string) => {
  const existingGround = await prisma.ground.findFirst({
    where: {
      id: userId,
    },
  });

  if (!existingGround) {
    throw new Error("User not found");
  }

  const result = await prisma.ground.update({
    where: {
      id: userId,
    },
    data: {
      ...groundData,
    },
  });

  return result;
};

export const groundService = {
  createGround,
  updateGround,
  getAllGround,
  getSingleGround,
};
