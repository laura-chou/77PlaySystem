import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";

import { responseHandler } from "../common/response";
import users from "../models/user.model";

interface AuthenticatedUser extends Document {
  userCode: string;
  userType: string;
  gameType: Array<number>;
  createDate: Date;
  _id: string;
  tokens?: Array<{ token: string }>;
}

interface AuthInfo {
  message?: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthenticatedUser;
    token?: string;
  }
}

export default (strategy: string) => {
  return (req: Request, res: Response, next: NextFunction) : void => {
    passport.authenticate(
      strategy,
      { session: false },
      async (
        error: Error | null,
        user: AuthenticatedUser | false | null,
        info: AuthInfo | undefined) => {
      if (error || !user) {
        if (info?.message === "jwt expired") {
          const authHeader = req.header("Authorization");
          if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const decoded = jwt.decode(token) as { user?: string };
            const userCode = decoded?.user;

            if (userCode) {
              await users.updateOne(
                { userCode },
                { $set: { token: "" } }
              );
            }
          }
        }
        return responseHandler.unauthorized(res, info?.message);
      }
      req.user = user;
      next();
    })(req, res, next);
  };
};