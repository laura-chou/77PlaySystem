import { Request, Response } from "express";

import { LOG_LEVEL, LOG_MESSAGE } from "../common/constants";
import { responseHandler } from "../common/response";
import { setFunctionName } from "../common/utils";
import { getCustomerListPipeline, getCustomerDetailPipeline } from "../core/db";
import { setLog } from "../core/logger";
import Customer from "../models/customer.model";

import * as baseController from "./base.controller";

export const getCustList = setFunctionName(
  async (_request: Request, response: Response): Promise<void> => {
    try {
      const customers = await Customer.aggregate(getCustomerListPipeline());

      setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, getCustList.name);

      if (customers.length > 0) {
        responseHandler.success(response, customers);
      } else {
        responseHandler.noData(response);
      }
    } catch (error) {
      baseController.errorHandler(response, error, getCustList.name);
    }
  },
  "getCustList"
);

export const getCustomer = setFunctionName(
  async (request: Request, response: Response): Promise<void> => {
    try {
      const custId = request.params.custId;

      if (!baseController.validateCustId(custId, response, getCustomer.name)) {
        return;
      }

      if (custId) {
        const customer = await Customer.aggregate(getCustomerDetailPipeline(custId));

        setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, getCustomer.name);

        if (customer.length > 0) {
          responseHandler.success(response, customer);
        } else {
          responseHandler.noData(response);
        }
      }
    } catch (error) {
      baseController.errorHandler(response, error, getCustomer.name);
    }
  },
  "getCustomer"
);