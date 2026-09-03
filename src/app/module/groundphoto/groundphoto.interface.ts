export type AddGroundPhotoPayload = {
  groundId: string;
  files: Express.Multer.File[];
  userId: string;
};
