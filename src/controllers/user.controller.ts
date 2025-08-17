import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";

import { responseHandler } from "../common/response";
import { getNowDate, setFunctionName } from "../common/utils";
import { LOG_LEVEL, LOG_MESSAGE , setLog } from "../core/logger";
import User, { IUser, UserRole } from "../models/user.model";

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
        { token }
      );
      setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, userLogin.name);
      responseHandler.success(response, { token });
    } catch (error) {
      baseController.errorHandler(response, error, userLogin.name);
    }
  },
  "userLogin"
);

export const userCreate = setFunctionName(
  async (request: Request, response: Response): Promise<void> => {
    if(!baseController.validateContentType(request, response, userCreate.name)){
      return;
    }

    const fields = [
      { key: "password", type: "string" }
    ];
    const userRole = request.body.userRole;
    if (userRole) {
      fields.push({ key: "userRole", type: "string" });
    }
    if (!baseController.validateBodyFields(request, response, userCreate.name, fields)) {
      return;
    }

    try {
      const userName = request.body.password;
      const role = userRole ? UserRole.ADMIN : UserRole.USER;
      const isUserExist = await User.findOne({ userName });
      if (isUserExist) {
        const logMsg = `${LOG_MESSAGE.ERROR.USEREXISTS}, userName: ${userName}`;
        setLog(LOG_LEVEL.ERROR, logMsg, userCreate.name);
        responseHandler.conflict(response);
        return;
      }
      const data: IUser = {
        userName: userName,
        userRole: role,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        password: await bcrypt.hash(userName, parseInt(process.env.BCRYPT_SALT_ROUNDS!)),
        createDate: getNowDate()
      };
      await User.create(data);
      setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, userCreate.name);
      responseHandler.created(response);
    } catch (error) {
      baseController.errorHandler(response, error, userCreate.name);
    }
  },
  "userCreate"
);