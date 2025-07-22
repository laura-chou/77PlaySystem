import { Request, Response } from "express";
import { setFunctionName } from "../common/utils";
import { responseHandler } from "../common/response";
import { LOG_LEVEL, LOG_MESSAGE } from "../common/constants";
import { setLog } from "../core/logger";
import users from "../models/user.model";
import * as baseController from "./base.controller";
import jwt from "jsonwebtoken";

export const userLogin = setFunctionName(
  async (request: Request, response: Response): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const user = request.user!;
      const token = jwt.sign(
        { user: user.userCode },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        process.env.JWT_SECRET!, 
        { expiresIn: "2h" }
      );

      await users.findByIdAndUpdate(
        user._id,
        { token },
        { new: true }
      );
      setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, userLogin.name);
      responseHandler.success(response, { token });
    } catch (error) {
      baseController.errorHandler(response, error, userLogin.name);
    }
  },
  "userLogin"
);

export const getUserList = setFunctionName(
  async (request: Request, response: Response): Promise<void> => {
    try {
      const userList = await users.find({
        password: { $in: ["", null] }
      });
      responseHandler.success(response, userList);
    } catch (error) {
      baseController.errorHandler(response, error, getUserList.name);
    }
  },
  "getUserList"
);