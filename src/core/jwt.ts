import { Request } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ExtractJwt } from "passport-jwt";

export const signToken = (payload: object): string => {
  return jwt.sign(
    payload,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.JWT_SECRET!,
    { expiresIn: "1h" }
  );
};

const decodeToken = <T = JwtPayload>(request: Request): T | null => {
  const token = ExtractJwt.fromAuthHeaderAsBearerToken()(request);

  if (!token) return null;

  try {
    return jwt.decode(token) as T;
  } catch {
    return null;
  }
};

export const getUserIdFromToken = (request: Request): string | null => {
  const payload = decodeToken<{ user: string }>(request);
  return payload?.user ?? null;
};