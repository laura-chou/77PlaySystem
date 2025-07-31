import { Request, Response } from "express";

import { LOG_LEVEL, LOG_MESSAGE } from "../common/constants";
import { responseHandler } from "../common/response";
import { setFunctionName } from "../common/utils";
import { setLog } from "../core/logger";
import Customer from "../models/customer.model";

import * as baseController from "./base.controller";

export const getCustList = setFunctionName(
  async (_request: Request, response: Response): Promise<void> => {
    try {
      const customers = await Customer.aggregate([
        {
          $lookup: {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            from: process.env.COLLECTION_TRANSACTION!,
            localField: "_id",
            foreignField: "customerId",
            as: "transactions"
          }
        },
        {
          $project: {
            custId: "$_id",
            _id: 0, 
            custName: 1,
            expiryDate: {
              $let: {
                vars: {
                  sortedTx: {
                    $sortArray: {
                      input: "$transactions",
                      sortBy: { createDate: -1 }
                    }
                  }
                },
                in: { $arrayElemAt: ["$$sortedTx.expiryDate", 0] }
              }
            }
          }
        }
      ]);
      setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, getCustList.name);
      responseHandler.success(response, customers);
    } catch (error) {
      baseController.errorHandler(response, error, getCustList.name);
    }
  },
  "getCustList"
);