import { Request, Response } from "express";

import { LOG_LEVEL, LOG_MESSAGE } from "../common/constants";
import { responseHandler } from "../common/response";
import { setFunctionName } from "../common/utils";
import { setLog } from "../core/logger";
import Customer from "../models/customer.model";

import * as baseController from "./base.controller";

export const getCustList = setFunctionName(
  async (request: Request, response: Response): Promise<void> => {
    try {
      const userList = await Customer.find({}, "-serviceTypes -createDate");
      setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, getCustList.name);
      responseHandler.success(response, userList);
    } catch (error) {
      baseController.errorHandler(response, error, getCustList.name);
    }
  },
  "getCustList"
);