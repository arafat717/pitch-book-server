import type { Request } from "express";

export type OwnerRequestPayload = {
  businessName: string;
  licenseDoc: Express.Multer.File;
};

export type OwnerRequestQueryParams = Request["query"];
