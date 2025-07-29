import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { LOG_LEVEL, LOG_MESSAGE } from "../common/constants";
import { responseHandler } from "../common/response";
import { setFunctionName } from "../common/utils";
import { setLog } from "../core/logger";
import User from "../models/user.model";

import * as baseController from "./base.controller";

export const userLogin = setFunctionName(
  async (request: Request, response: Response): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const user = request.user!;
      const token = jwt.sign(
        { user: user.userName },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        process.env.JWT_SECRET!, 
        { expiresIn: "1h" }
      );

      await User.findByIdAndUpdate(
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
