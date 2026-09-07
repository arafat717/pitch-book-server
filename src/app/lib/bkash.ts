import config from "../config";
import { redisClient } from "./redis";

export const readBkashResponse = async <T>(
  response: Response,
  operation: string,
) => {
  const body = await response.text();
  let result: T | undefined;

  try {
    result = body ? (JSON.parse(body) as T) : undefined;
  } catch {
    throw new Error(
      `Bkash ${operation} returned a non-JSON response (${response.status}): ${body.slice(0, 300)}`,
    );
  }

  if (!response.ok) {
    const message =
      typeof result === "object" && result !== null && "statusMessage" in result
        ? String(result.statusMessage)
        : body || response.statusText;
    throw new Error(
      `Bkash ${operation} failed (${response.status}): ${message}`,
    );
  }

  return result;
};

export const getBkashIdToken = async () => {
  try {
    const bkashIdTokenKey = "bkash:idToken";
    const bkashRefreshTokenKey = "bkash:refreshToken";

    let bkashToken = await redisClient.get(bkashIdTokenKey);
    const bkashRefresh = await redisClient.get(bkashRefreshTokenKey);

    const bkashIdTokenTtl = await redisClient.ttl(bkashIdTokenKey);
    const bkashRefreshTokenTtl = await redisClient.ttl(bkashRefreshTokenKey);

    if (
      (bkashIdTokenTtl <= 600 || !bkashToken) &&
      bkashRefresh &&
      bkashRefreshTokenTtl > 600
    ) {
      const response = await fetch(
        `${config.bkash_base_url}/tokenized/checkout/token/refresh`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            username: config.bkash_username!,
            password: config.bkash_password,
          },
          body: JSON.stringify({
            app_key: config.bkash_app_key,
            app_secret: config.bkash_app_secret,
            refresh_token: bkashRefresh,
          }),
        },
      );

      const bkashRefreshResponse = await readBkashResponse<{
        id_token?: string;
      }>(response, "token refresh");
      if (!bkashRefreshResponse?.id_token) {
        throw new Error("Bkash token refresh did not return an access token");
      }
      bkashToken = bkashRefreshResponse.id_token as string;

      await redisClient.set(bkashIdTokenKey, bkashToken, {
        expiration: {
          type: "EX",
          value: 60 * 60,
        },
      });

      return bkashToken;
    }

    if (bkashIdTokenTtl > 600) {
      return bkashToken;
    }

    const response = await fetch(
      `${config.bkash_base_url}/tokenized/checkout/token/grant`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          username: config.bkash_username!,
          password: config.bkash_password,
        },
        body: JSON.stringify({
          app_key: config.bkash_app_key,
          app_secret: config.bkash_app_secret,
        }),
      },
    );

    const result = await readBkashResponse<{
      id_token?: string;
      refresh_token?: string;
    }>(response, "access token grant");
    if (!result?.id_token || !result.refresh_token) {
      throw new Error(
        "Bkash access token grant returned incomplete credentials",
      );
    }
    // set bksah id token to radis
    await redisClient.set(bkashIdTokenKey, result.id_token, {
      expiration: {
        type: "EX",
        value: 60 * 60,
      },
    });
    // set bkash refresh token to radis
    await redisClient.set(bkashRefreshTokenKey, result.refresh_token, {
      expiration: {
        type: "EX",
        value: 60 * 60 * 24 * 28,
      },
    });

    return result.id_token;
  } catch (error) {
    throw error instanceof Error ? error : new Error(String(error));
  }
};
