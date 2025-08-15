import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import passport from "passport";

import { responseHandler } from "../common/response";
import { LOG_LEVEL, LOG_MESSAGE , setLog } from "../core/logger";
import User from "../models/user.model";

interface AuthenticatedUser extends Document {
  userName: string;
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
  return (request: Request, response: Response, next: NextFunction) : void => {
    passport.authenticate(
      strategy,
      { session: false },
      async (
        error: Error | null,
        user: AuthenticatedUser | false | null,
        info: AuthInfo | undefined) => {
      if (error) {
        setLog(LOG_LEVEL.ERROR, `authenticate: ${error.message}`);
        return responseHandler.serverError(response);
      }
      if (!user) {
        if (info?.message === "jwt expired") {
          const authHeader = request.header("Authorization");
          if (authHeader) {
            const token = authHeader.replace("Bearer ", "");
            const decoded = jwt.decode(token) as { user?: string };
            const userName = decoded?.user;

            if (userName) {
              await User.updateOne(
                { userName },
                { $set: { token: "" } }
              );
            }
          }
        }
        setLog(LOG_LEVEL.ERROR, `authenticate: ${info?.message}`);
        return responseHandler.unauthorized(response, info?.message);
      }
      setLog(LOG_LEVEL.INFO, `authenticate: ${LOG_MESSAGE.SUCCESS}`);
      request.user = user;
      next();
    })(request, response, next);
  };
};