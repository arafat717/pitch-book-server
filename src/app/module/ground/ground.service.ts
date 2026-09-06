import { prisma } from "../../lib/prisma";
import { SportType } from "../../../generated/prisma/enums";
import type { GroundQueryParams } from "./ground.interface";

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

const getAllGround = async (query: GroundQueryParams) => {
  const getQueryValue = (value: string | string[] | undefined) =>
    Array.isArray(value) ? value[0] : value;
  const page = Math.max(Number(getQueryValue(query.page)) || 1, 1);
  const limit = Math.min(
    Math.max(Number(getQueryValue(query.limit)) || 10, 1),
    100,
  );
  const search = getQueryValue(query.search)?.trim();
  const name = getQueryValue(query.name)?.trim();
  const address = getQueryValue(query.address)?.trim();
  const sportTypes = (
    Array.isArray(query.sportTypes)
      ? query.sportTypes
      : getQueryValue(query.sportTypes)?.split(",")
  )
    ?.map((sportType) => sportType.trim().toUpperCase())
    .filter(Boolean);

  const invalidSportType = sportTypes?.find(
    (sportType) => !Object.values(SportType).includes(sportType as SportType),
  );

  if (invalidSportType) {
    throw new Error(`Invalid sport type: ${invalidSportType}`);
  }

  const where = {
    ...(search && {
      OR: [
        { name: { contains: search, mode: "insensitive" as const } },
        { address: { contains: search, mode: "insensitive" as const } },
      ],
    }),
    ...(name && { name: { contains: name, mode: "insensitive" as const } }),
    ...(address && {
      address: { contains: address, mode: "insensitive" as const },
    }),
    ...(sportTypes?.length && {
      sportTypes: { in: sportTypes as SportType[] },
    }),
  };
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.ground.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    }),
    prisma.ground.count({ where }),
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
