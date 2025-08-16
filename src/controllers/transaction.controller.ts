import { Request, Response } from "express";
import { Types } from "mongoose";

import { responseHandler } from "../common/response";
import { getNowDate, getThreeMonthsLater, isNegative, isNullOrEmpty, setFunctionName } from "../common/utils";
import { LOG_LEVEL, LOG_MESSAGE , setLog } from "../core/logger";
import Transaction, { ITransaction } from "../models/transaction.model";

import * as baseController from "./base.controller";

export const createTransaction = setFunctionName(
  async (request: Request, response: Response): Promise<void> => {
    const custId = request.params.custId;
    if (!baseController.validateCustId(custId, response, createTransaction.name)) {
      return;
    }

    if(!baseController.validateContentType(request, response, createTransaction.name)){
      return;
    }

    const fields = [
      { key: "amount", type: "integer" },
      { key: "refill", type: "boolean" }
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
    if (refill && isNegative(amount)) {
      setLog(LOG_LEVEL.ERROR, LOG_MESSAGE.ERROR.LOGIC, createTransaction.name);
      responseHandler.badRequest(response, "LOGIC");
      return;
    }

    try {
      const lastTransaction = await Transaction.findOne({ customerId: custId }).sort({ spendDate: -1 });
      if (lastTransaction) {
        const currentBalance = lastTransaction?.currentBalance + amount;
        const nowDate = getNowDate(createDate);
        const expiryDate = refill ? getThreeMonthsLater(nowDate) : lastTransaction?.expiryDate;

        const data: ITransaction = {
          customerId: new Types.ObjectId(custId),
          amount: amount,
          serviceTypeId: lastTransaction?.serviceTypeId,
          currentBalance: currentBalance,
          spendDate: nowDate,
          expiryDate: expiryDate
        };
        await Transaction.create(data);
        setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, createTransaction.name);
        responseHandler.created(response);
      } else {
        setLog(LOG_LEVEL.INFO, LOG_MESSAGE.TXNNOTFOUND, createTransaction.name);
        responseHandler.noData(response);
      }
    } catch (error) {
      baseController.errorHandler(response, error, createTransaction.name);
    }
  },
  "createTransaction"
);