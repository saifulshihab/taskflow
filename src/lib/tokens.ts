import { createHmac, randomBytes } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../env.js";
import { unauthorized } from "./errors.js";

export interface AccessTokenPayload {
  sub: string;
  email: string;
}

export const signAccessToken = (payload: AccessTokenPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions["expiresIn"],
  });

export const verifyAccessToken = (token: string): AccessTokenPayload => {
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (typeof decoded === "string" || !decoded.sub) {
      throw unauthorized("Malformed access token");
    }
    return { sub: decoded.sub, email: String(decoded["email"] ?? "") };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw unauthorized("Access token expired");
    }
    throw unauthorized("Invalid access token");
  }
};

/**
 * Refresh tokens are opaque random strings rather than JWTs, so they can be
 * revoked server-side. Only the HMAC lands in the database; a stolen dump
 * cannot be replayed without the refresh secret.
 */
export const createRefreshToken = () => {
  const token = randomBytes(48).toString("base64url");
  return { token, tokenHash: hashRefreshToken(token) };
};

export const hashRefreshToken = (token: string) =>
  createHmac("sha256", env.JWT_REFRESH_SECRET).update(token).digest("hex");

export const refreshTokenExpiry = () =>
  new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
