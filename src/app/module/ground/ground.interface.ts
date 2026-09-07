import type { SportType } from "../../../generated/prisma/enums";

export type CreateGroundPayload = {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  sportTypes: SportType;
};

export type UpdateGroundPayload = Partial<CreateGroundPayload>;

export type GroundQueryParams = {
  page?: string | string[];
  limit?: string | string[];
  search?: string | string[];
  name?: string | string[];
  address?: string | string[];
  sportTypes?: string | string[];
};
