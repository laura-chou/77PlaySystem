import bcrypt from "bcrypt";
import { Request, Response } from "express";

import { responseHandler } from "../common/response";
import { getNowDate, isProductionEnv, setFunctionName } from "../common/utils";
import { getUserIdFromToken, signToken } from "../core/jwt";
import { LogLevel, LogMessage, setLog } from "../core/logger";
import User, { IUser, UserRole } from "../models/user.model";

import * as baseController from "./base.controller";

export const userLogin = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const user = request.user!;
      const token = signToken({ user: user._id });

      await User.findByIdAndUpdate(
        user._id,
        { token }
      );

      setLog(LogLevel.INFO, LogMessage.SUCCESS, userLogin.name);
      responseHandler.success(response, { token });
    } catch (error) {
      baseController.errorHandler(response, error, userLogin.name);
    }
  },
  "userLogin"
);

export const userCreate = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    if (!baseController.validateContentType(request, response, userCreate.name)){
      return;
    }

    const fields = [
      { key: "account", type: "string" },
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
      const { account, password } = request.body;
      const role = userRole ? UserRole.ADMIN : UserRole.USER;
      const isUserExist = await User.findOne({ userName: account });
      if (isUserExist) {
        const logMsg = `${LogMessage.ERROR.USEREXISTS}, userName: ${account}`;
        setLog(LogLevel.ERROR, logMsg, userCreate.name);
        responseHandler.conflict(response);
        return;
      }
      const data: IUser = {
        userName: account,
        userRole: role,
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        password: await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS!)),
        createDate: getNowDate()
      };
      await User.create(data);
      setLog(LogLevel.INFO, LogMessage.SUCCESS, userCreate.name);
      responseHandler.created(response);
    } catch (error) {
      baseController.errorHandler(response, error, userCreate.name);
    }
  },
  "userCreate"
);

export const userLogout = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    try {
      const userId = getUserIdFromToken(request);
      if (userId) {
        await User.findByIdAndUpdate(
          userId,
          { $set: { token: "" } }
        );
      }
      setLog(LogLevel.INFO, LogMessage.SUCCESS, userLogout.name);
      responseHandler.success(response);
    } catch (error) {
      baseController.errorHandler(response, error, userLogout.name);
    }
  },
  "userLogout"
);