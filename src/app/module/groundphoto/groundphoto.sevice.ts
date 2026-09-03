import type { UploadApiResponse } from "cloudinary";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import type { AddGroundPhotoPayload } from "./groundphoto.interface";

const uploadFile = (file: Express.Multer.File) =>
  new Promise<UploadApiResponse>((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ resource_type: "image" }, (error, result) => {
        if (error) {
          return reject(error);
        }

        if (!result) {
          return reject(new Error("No result returned from Cloudinary"));
        }

        resolve(result);
      })
      .end(file.buffer);
  });

const addGroundPhoto = async ({
  groundId,
  files,
  userId,
}: AddGroundPhotoPayload) => {
  if (!files.length) {
    throw new Error("At least one photo is required");
  }

  const ground = await prisma.ground.findFirst({
    where: {
      id: groundId,
      owner: {
        userId,
      },
    },
    select: { id: true },
  });

  if (!ground) {
    throw new Error("Ground not found or you do not own this ground");
  }

  const uploadResults = await Promise.all(files.map(uploadFile));

  return prisma.groundPhoto.createManyAndReturn({
    data: uploadResults.map(({ secure_url }) => ({
      groundId: ground.id,
      url: secure_url,
    })),
  });
};

export const groundPhotoService = {
  addGroundPhoto,
};
