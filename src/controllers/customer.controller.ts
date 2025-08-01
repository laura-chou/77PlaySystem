import { Request, Response } from "express";
import { Types } from "mongoose";

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
                      sortBy: { spendDate: -1 }
                    }
                  }
                },
                in: { 
                  $dateToString: {
                    format: "%Y-%m-%d",
                    date: { $arrayElemAt: ["$$sortedTx.expiryDate", 0] },
                    timezone: "+08:00"
                  }
                }
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

export const getCustomer = setFunctionName(
  async (request: Request, response: Response): Promise<void> => {
    try {
      const custId = request.params.custId;
      if (custId) {
        const customer = await Customer.aggregate([
          { $match: { _id: new Types.ObjectId(custId) } },
          {
            $lookup: {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              from: process.env.COLLECTION_TRANSACTION!,
              localField: "_id",
              foreignField: "customerId",
              as: "transactions"
            }
          },
          { $unwind: "$transactions" },
          {
            $lookup: {
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              from: process.env.COLLECTION_SERVICETYPE!,
              localField: "transactions.serviceTypeId",
              foreignField: "_id",
              as: "serviceTypes"
            }
          },
          { $unwind: "$serviceTypes" },
          {
            $group: {
              _id: "$_id",
              custName: { $first: "$custName" },
              createDate: { $first: { 
                $dateToString: {
                  format: "%Y-%m-%d",
                  date: "$createDate",
                  timezone: "+08:00"
                }
              }},
              history: {
                $push: {
                  serviceName: "$serviceTypes.serviceName",
                  amount: "$transactions.amount",
                  currentBalance: "$transactions.currentBalance",
                  spendDate: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$transactions.spendDate",
                      timezone: "+08:00"
                    }
                  },
                  expiryDate: {
                    $dateToString: {
                      format: "%Y-%m-%d",
                      date: "$transactions.expiryDate",
                      timezone: "+08:00"
                    }
                  }
                }
              }
            }
          },
          {
            $addFields: {
              history: {
                $sortArray: {
                  input: "$history",
                  sortBy: { spendDate: -1 }
                }
              }
            }
          },
          {
            $project: {
              custId: "$_id",
              _id: 0,
              custName: 1,
              createDate: 1,
              history: 1
            }
          }
        ]);

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