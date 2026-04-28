import { Request, Response } from "express";
import mongoose from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { responseHandler } from "../common/response";
import { getNowDate, getDateAfterMonths, setFunctionName, isExpiry } from "../common/utils";
import { toObjectId } from "../core/db";
import { LogLevel, LogMessage, setLog } from "../core/logger";
import Customer from "../models/customer.model";
import Transaction, { ITransaction } from "../models/transaction.model";

import * as baseController from "./base.controller";

interface TransactionData {
  custId: string;
  amount: number;
  createDate: string;
  serviceTypeId: mongoose.Types.ObjectId;
  currentBalance: number;
  expiryDate: Date;
}

const isExtendThreeMonths = (amount: number): boolean => {
  return amount === 1200;
};

const getLastTransaction = async(custId: string): Promise<ITransaction | null> => {
  return await Transaction.findOne({ customerId: custId }).sort({ spendDate: -1 });
};

const createTransactionData = ({
  custId,
  amount,
  createDate,
  serviceTypeId,
  currentBalance,
  expiryDate
}: TransactionData): ITransaction => {
  return {
    customerId: toObjectId(custId),
    amount,
    serviceTypeId,
    currentBalance,
    spendDate: getNowDate(createDate),
    expiryDate
  };
};

export const processPayment = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    try {
      const { createDate, custId, amount } = request.body;
      
      const lastTransaction = await getLastTransaction(custId);
      if (!lastTransaction) {
        setLog(LogLevel.ERROR, LogMessage.ERROR.NOTFOUND, processPayment.name);
        responseHandler.notFound(response);
        return;
      }

      const transactionData = createTransactionData({
        custId,
        amount: -Math.abs(amount),
        createDate,
        serviceTypeId: lastTransaction.serviceTypeId,
        currentBalance: lastTransaction.currentBalance - Math.abs(amount),
        expiryDate: lastTransaction.expiryDate
      });

      await Transaction.create(transactionData);
      setLog(LogLevel.INFO, LogMessage.SUCCESS, processPayment.name);
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
      const { createDate, custId, amount } = request.body;

      const lastTransaction = await getLastTransaction(custId);
      if (!lastTransaction) {
        setLog(LogLevel.ERROR, LogMessage.ERROR.NOTFOUND, topUpAccount.name);
        responseHandler.notFound(response);
        return;
      }

      const nowDate = getNowDate(createDate);
      const expiryDate = isExtendThreeMonths(amount) ? getDateAfterMonths(nowDate, 3) : lastTransaction?.expiryDate;

      const transactionData = createTransactionData({
        custId,
        amount,
        createDate,
        serviceTypeId: lastTransaction.serviceTypeId,
        currentBalance: lastTransaction.currentBalance + amount,
        expiryDate: expiryDate
      });

      await Transaction.create(transactionData);
      setLog(LogLevel.INFO, LogMessage.SUCCESS, topUpAccount.name);
      responseHandler.success(response);
    } catch (error) {
      baseController.errorHandler(response, error, topUpAccount.name);
    }
  },
  "topUpAccount"
);

export const extendExpiryDate = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    const { custId, createDate, amount } = request.body;

    try {  
      const lastTransaction = await getLastTransaction(custId);
      if (!lastTransaction) {
        setLog(LogLevel.ERROR, LogMessage.ERROR.NOTFOUND, extendExpiryDate.name);
        responseHandler.notFound(response);
        return;
      }

      if (!isExpiry(lastTransaction.expiryDate)) {
        const logMsg = `${LogMessage.ERROR.CUSTNOTDUE} custId: ${custId}`;
        setLog(LogLevel.ERROR, logMsg, extendExpiryDate.name);
        responseHandler.badRequest(response, "CUST_NOT_DUE");
        return;
      }

      const transactionData = createTransactionData({
        custId,
        amount,
        createDate,
        serviceTypeId: lastTransaction.serviceTypeId,
        currentBalance: lastTransaction.currentBalance + amount,
        expiryDate: getDateAfterMonths(getNowDate(createDate), 1)
      });

      await Transaction.create([transactionData], { session });

      const updated = await Customer.findOneAndUpdate(
        { _id: custId, extendedTimes: { $lt: 3 } },
        { $inc: { extendedTimes: 1 } },
        { session }
      );

      if (!updated) {
        throw new Error("invalid extended");
      }

      await session.commitTransaction();
      setLog(LogLevel.INFO, LogMessage.SUCCESS, extendExpiryDate.name);
      responseHandler.success(response);
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof Error && error.message.includes("invalid extended")) {
        const logMsg = `${LogMessage.ERROR.EXTENSIONLIMIT} custId: ${custId}`;
        setLog(LogLevel.ERROR, logMsg, extendExpiryDate.name);
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