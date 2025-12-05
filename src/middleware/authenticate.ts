import { Request, Response, NextFunction } from "express";
import passport from "passport";

import { responseHandler } from "../common/response";
import { LogLevel, LogMessage, setLog } from "../core/logger";
import User from "../models/user.model";
import { getUserIdFromToken } from "../core/jwt";

interface AuthenticatedUser {
  _id: string;
}

interface AuthInfo {
  message: string;
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
      async(
        error: Error | null,
        user: AuthenticatedUser | false | null,
        info: AuthInfo | undefined) => {
      if (error) {
        setLog(LogLevel.ERROR, `authenticate: ${error.message}`);
        return responseHandler.serverError(response);
      }
      if (!user) {
        if (info?.message === "jwt expired") {
          const userId = getUserIdFromToken(request);
          if (userId) {
            await User.findByIdAndUpdate(
              userId,
              { $set: { token: "" } }
            );
          }
        }

        const type = /jwt|token/i.test(info?.message ?? "") ? "INVALID_TOKEN" : "WRONG_PASSWORD";

        setLog(LogLevel.ERROR, `authenticate: ${info?.message}`);
        return responseHandler.unauthorized(response, type);
      }
      setLog(LogLevel.INFO, `authenticate: ${LogMessage.SUCCESS}`);
      request.user = user;
      next();
    })(request, response, next);
  };
};