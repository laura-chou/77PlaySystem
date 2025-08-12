import { Request, Response } from "express";

import { LOG_LEVEL, LOG_MESSAGE } from "../common/constants";
import { responseHandler } from "../common/response";
import { getNowDate, getThreeMonthsLater, setFunctionName } from "../common/utils";
import { setLog } from "../core/logger";
import Transaction from "../models/transaction.model";

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
    if (!baseController.validateBodyFields(request, response, createTransaction.name, fields)) {
      return;
    }
    try {
      const lastTransaction = await Transaction.findOne({ custId }).sort({ spendDate: -1 });
      const amount = request.body["amount"];
      const currentBalance = lastTransaction?.currentBalance + amount;
      const refill = request.body["refill"];
      const createDate = getNowDate();
      const expiryDate = refill ? getThreeMonthsLater(createDate) : lastTransaction?.expiryDate;

      const data = {
        customerId: custId,
        amount: amount,
        serviceTypeId: lastTransaction?.serviceTypeId,
        currentBalance: currentBalance,
        createDate: createDate,
        expiryDate: expiryDate
      };
      await Transaction.create(data);
      setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, createTransaction.name);
      responseHandler.created(response);
    } catch (error) {
      baseController.errorHandler(response, error, createTransaction.name);
    }
  },
  "createTransaction"
);