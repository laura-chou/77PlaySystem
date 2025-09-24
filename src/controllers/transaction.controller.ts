import { Request, Response } from "express";
import mongoose from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { responseHandler } from "../common/response";
import { getNowDate, getDateAfterMonths, setFunctionName, isExpiry } from "../common/utils";
import { toObjectId } from "../core/db";
import { LOG_LEVEL, LOG_MESSAGE, setLog } from "../core/logger";
import Customer from "../models/customer.model";
import Transaction, { ITransaction } from "../models/transaction.model";

import * as baseController from "./base.controller";

const isExtendThreeMonths = (amount: number): boolean => {
  return amount === 1500;
};

export const processPayment = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    try {
      const createDate = request.body.createDate;
      const custId = request.body.custId;
      const amount = -Math.abs(request.body.amount);
      const lastTransaction = await Transaction.findOne({ customerId: custId }).sort({ spendDate: -1 });
      if (lastTransaction) {
        const currentBalance = lastTransaction?.currentBalance + amount;
        const nowDate = getNowDate(createDate);
        const expiryDate = lastTransaction?.expiryDate;

        const data: ITransaction = {
          customerId: toObjectId(custId),
          amount: amount,
          serviceTypeId: lastTransaction?.serviceTypeId,
          currentBalance: currentBalance,
          spendDate: nowDate,
          expiryDate: expiryDate
        };

        await Transaction.create(data);
      }
      setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, processPayment.name);
      responseHandler.success(response);
    } catch (error) {
      baseController.errorHandler(response, error, processPayment.name);
    }
  },
  "processPayment"
);

export const topUpAccount = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    try {
      const createDate = request.body.createDate;
      const custId = request.body.custId;
      const amount = request.body.amount;
      const lastTransaction = await Transaction.findOne({ customerId: custId }).sort({ spendDate: -1 });
      if (lastTransaction) {
        const currentBalance = lastTransaction?.currentBalance + amount;
        const nowDate = getNowDate(createDate);
        const expiryDate = isExtendThreeMonths(amount) ? getDateAfterMonths(nowDate, 3) : lastTransaction?.expiryDate;

        const data: ITransaction = {
          customerId: toObjectId(custId),
          amount: amount,
          serviceTypeId: lastTransaction?.serviceTypeId,
          currentBalance: currentBalance,
          spendDate: nowDate,
          expiryDate: expiryDate
        };

        await Transaction.create(data);

        setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, topUpAccount.name);
        responseHandler.success(response);
      }
    } catch (error) {
      baseController.errorHandler(response, error, topUpAccount.name);
    }
  },
  "topUpAccount"
);

export const extendExpiryDate = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    const custId = request.body.custId;
    const createDate = request.body.createDate;
    const amount = -Math.abs(request.body.amount);

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const lastTransaction = await Transaction.findOne({ customerId: custId }).sort({ spendDate: -1 });
      if (lastTransaction) {
        if (isExpiry(lastTransaction.expiryDate)) {
          setLog(LOG_LEVEL.ERROR, LOG_MESSAGE.ERROR.LOGIC, extendExpiryDate.name);
          responseHandler.badRequest(response, "LOGIC");
          return;
        }

        const currentBalance = lastTransaction?.currentBalance + amount;
        const nowDate = getNowDate(createDate);
        const expiryDate = getDateAfterMonths(nowDate, 1);

        const data: ITransaction = {
          customerId: toObjectId(custId),
          amount: amount,
          serviceTypeId: lastTransaction?.serviceTypeId,
          currentBalance: currentBalance,
          spendDate: nowDate,
          expiryDate: expiryDate
        };

        await Transaction.create([data], { session });

        const updated = await Customer.findOneAndUpdate(
          { _id: custId, extendedTimes: { $lt: 3 } },
          { $inc: { extendedTimes: 1 } },
          { session }
        );

        if (!updated) {
          throw new Error("invalid extended");
        }

        await session.commitTransaction();
        setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, extendExpiryDate.name);
        responseHandler.success(response);
      } else {
        setLog(LOG_LEVEL.ERROR, LOG_MESSAGE.ERROR.NOTFOUND, extendExpiryDate.name);
        responseHandler.notFound(response);
      }
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof Error && error.message.includes("invalid extended")) {
        const logMsg = `${LOG_MESSAGE.ERROR.EXTENSIONLIMIT}, custId: ${custId}`;
        setLog(LOG_LEVEL.ERROR, logMsg, extendExpiryDate.name);
        responseHandler.conflict(response, RESPONSE_MESSAGE.EXTENSION_LIMIT);
      } else {
        baseController.errorHandler(response, error, extendExpiryDate.name);
      }
    } finally {
      session.endSession();
    }
  },
  "extendExpiryDate"
);