import jsonwebtoken, { type JwtPayload, type SignOptions } from "jsonwebtoken";
import { env } from "./env.js";

export interface AccessTokenPayload extends JwtPayload {
  sub: string;
  email: string;
  fullName: string;
  role: string;
}

export function signAccessToken(payload: AccessTokenPayload): string {
  const signOptions: SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "school-management-erp",
  };

  return jsonwebtoken.sign(payload, env.JWT_SECRET, signOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jsonwebtoken.verify(token, env.JWT_SECRET, {
    issuer: "school-management-erp",
  }) as AccessTokenPayload;
}

export function signRefreshToken(payload: { sub: string }): string {
  const signOptions: SignOptions = {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions["expiresIn"],
    issuer: "school-management-erp",
  };

  return jsonwebtoken.sign(payload, env.JWT_REFRESH_SECRET, signOptions);
}

export function verifyRefreshToken(token: string): { sub: string } & JwtPayload {
  return jsonwebtoken.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "school-management-erp",
  }) as { sub: string } & JwtPayload;
}