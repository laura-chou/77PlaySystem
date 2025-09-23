import { Request, Response } from "express";
import mongoose from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { responseHandler } from "../common/response";
import { getNowDate, getDateAfterMonths, isNegative, isNullOrEmpty, setFunctionName, isExpiry } from "../common/utils";
import { toObjectId } from "../core/db";
import { LOG_LEVEL, LOG_MESSAGE, setLog } from "../core/logger";
import Customer from "../models/customer.model";
import Transaction, { ITransaction } from "../models/transaction.model";

import * as baseController from "./base.controller";

export const createTransaction = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    const custId = request.params.custId;
    if (!baseController.validateCustId(custId, response, createTransaction.name)) {
      return;
    }

    if (!baseController.validateContentType(request, response, createTransaction.name)){
      return;
    }

    const fields = [
      { key: "amount", type: "integer" },
      { key: "refill", type: "boolean" },
      { key: "extend", type: "boolean" }
    ];
    const createDate = request.body.createDate;
    if (!isNullOrEmpty(createDate)) {
      fields.push({ key: "createDate", type: "date" });
    }
    if (!baseController.validateBodyFields(request, response, createTransaction.name, fields)) {
      return;
    }

    const amount = request.body.amount;
    const refill = request.body.refill;
    const extend = request.body.extend;
    if (refill && extend ||
        refill && isNegative(amount) || 
        extend && isNegative(amount))
    {
      setLog(LOG_LEVEL.ERROR, LOG_MESSAGE.ERROR.LOGIC, createTransaction.name);
      responseHandler.badRequest(response, "LOGIC");
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const lastTransaction = await Transaction.findOne({ customerId: custId }).sort({ spendDate: -1 });
      if (lastTransaction) {
        if (extend && !isExpiry(lastTransaction.expiryDate)) {
          setLog(LOG_LEVEL.ERROR, LOG_MESSAGE.ERROR.LOGIC, createTransaction.name);
          responseHandler.badRequest(response, "LOGIC");
          return;
        }

        const currentBalance = lastTransaction?.currentBalance + amount;
        const nowDate = getNowDate(createDate);
        let expiryDate = refill ? getDateAfterMonths(nowDate, 3) : lastTransaction?.expiryDate;
        if (extend) {
          expiryDate = getDateAfterMonths(nowDate, 1);
        }
        const data: ITransaction = {
          customerId: toObjectId(custId),
          amount: amount,
          serviceTypeId: lastTransaction?.serviceTypeId,
          currentBalance: currentBalance,
          spendDate: nowDate,
          expiryDate: expiryDate
        };

        await Transaction.create([data], { session });

        if (extend) {
          const updated = await Customer.findOneAndUpdate(
            { _id: custId, extendedTimes: { $lt: 3 } },
            { $inc: { extendedTimes: 1 } },
            { session }
          );
          if (!updated) {
            throw new Error("invalid extended");
          }
        }

        await session.commitTransaction();
        setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, createTransaction.name);
        responseHandler.created(response);
      } else {
        setLog(LOG_LEVEL.ERROR, LOG_MESSAGE.ERROR.NOTFOUND, createTransaction.name);
        responseHandler.notFound(response);
      }
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof Error && error.message.includes("invalid extended")) {
        const logMsg = `${LOG_MESSAGE.ERROR.EXTENSIONLIMIT}, custId: ${custId}`;
        setLog(LOG_LEVEL.ERROR, logMsg, createTransaction.name);
        responseHandler.conflict(response, RESPONSE_MESSAGE.EXTENSION_LIMIT);
      } else {
        baseController.errorHandler(response, error, createTransaction.name);
      }
    } finally {
      session.endSession();
    }
  },
  "createTransaction"
);

export const extendExpiryDate = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    const createDate = request.body.createDate;
    const custId = request.body.custId;
    const amount = request.body.amount;
    const extend = request.body.extend;
    if (extend && isNegative(amount))
    {
      setLog(LOG_LEVEL.ERROR, LOG_MESSAGE.ERROR.LOGIC, createTransaction.name);
      responseHandler.badRequest(response, "LOGIC");
      return;
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const lastTransaction = await Transaction.findOne({ customerId: custId }).sort({ spendDate: -1 });
      if (lastTransaction) {
        if (isExpiry(lastTransaction.expiryDate)) {
          setLog(LOG_LEVEL.ERROR, LOG_MESSAGE.ERROR.LOGIC, createTransaction.name);
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
        setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, createTransaction.name);
        responseHandler.success(response);
      } else {
        setLog(LOG_LEVEL.ERROR, LOG_MESSAGE.ERROR.NOTFOUND, createTransaction.name);
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