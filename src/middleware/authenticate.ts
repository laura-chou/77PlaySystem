import { Request, Response, NextFunction } from "express";
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
        return responseHandler.unauthorized(res, "OTHER", info?.message);
      }

      if (strategy !== "login") {
        const authHeader = req.header("Authorization");
        if (!authHeader) {
          return responseHandler.unauthorized(res, "AUTHENTICATION");
        }
        
        const token = authHeader.replace("Bearer ", "");
        const validateToken = await users.findOne({ 
          "token": token 
        }).select("-_id -username -password -token").lean();
        
        if (!validateToken) {
          return responseHandler.unauthorized(res, "TOKEN");
        }
        
        req.token = token;
      }
      
      req.user = user;
      next();
    })(req, res, next);
  };
};