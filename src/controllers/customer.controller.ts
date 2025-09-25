import { Request, Response } from "express";
import mongoose from "mongoose";

import { responseHandler } from "../common/response";
import { getNowDate, getDateAfterMonths, isNullOrEmpty, setFunctionName } from "../common/utils";
import { getCustomerListPipeline, getCustomerDetailPipeline } from "../core/db";
import { LogLevel, LogMessage, setLog } from "../core/logger";
import Customer, { ICustomer } from "../models/customer.model";
import ServiceType from "../models/serviceType.model";
import Transaction, { ITransaction } from "../models/transaction.model";

import * as baseController from "./base.controller";
import * as txnController from "./transaction.controller";

export const getCustList = setFunctionName(
  async(_request: Request, response: Response): Promise<void> => {
    try {
      const customers = await Customer.aggregate(getCustomerListPipeline());

      setLog(LogLevel.INFO, LogMessage.SUCCESS, getCustList.name);
      responseHandler.success(response, customers);
    } catch (error) {
      baseController.errorHandler(response, error, getCustList.name);
    }
  },
  "getCustList"
);

export const getCustomer = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    try {
      const custId = request.params.custId;

      if (!baseController.validateCustId(custId, response, getCustomer.name)) {
        return;
      }

      if (custId) {
        const customer = await Customer.aggregate(getCustomerDetailPipeline(custId));

        if (customer.length > 0) {
          setLog(LogLevel.INFO, LogMessage.SUCCESS, getCustomer.name);
          responseHandler.success(response, customer.at(0));
        } else {
          setLog(LogLevel.ERROR, LogMessage.ERROR.NOTFOUND, getCustomer.name);
          responseHandler.notFound(response);
        }
      }
    } catch (error) {
      baseController.errorHandler(response, error, getCustomer.name);
    }
  },
  "getCustomer"
);

export const createCustomer = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      if (!baseController.validateContentType(request, response, createCustomer.name)) {
        return;
      }

      const fields = [
        { key: "custName", type: "string" },
        { key: "amount", type: "integer" }
      ];
      const createDate = request.body.createDate;
      if (!isNullOrEmpty(createDate)) {
        fields.push({ key: "createDate", type: "date" });
      }
      if (!baseController.validateBodyFields(request, response, createCustomer.name, fields)) {
        return;
      }

      const custName = request.body.custName.trim();
      const amount = request.body.amount;
      const isCustExist = await Customer.findOne({ custName });
      if (isCustExist) {
        const logMsg = `${LogMessage.ERROR.CUSTEXISTS}, custName: ${custName}`;
        setLog(LogLevel.ERROR, logMsg, createCustomer.name);
        responseHandler.conflict(response);
        return;
      }

      const nowDate = getNowDate(createDate);
      const expiryDate = getDateAfterMonths(nowDate, 3);
      const serviceTypeId = (await ServiceType.findOne({}, "_id"))?._id;
      if (serviceTypeId) {
        const custData: ICustomer = {
          custName: custName,
          serviceTypes: [serviceTypeId],
          createDate: nowDate
        };
        const [custDoc] = await Customer.create([custData], { session });

        const txnData: ITransaction = {
          customerId: custDoc._id,
          amount: amount,
          serviceTypeId: serviceTypeId,
          currentBalance: amount,
          spendDate: nowDate,
          expiryDate: expiryDate
        };
        await Transaction.create([txnData], { session });

        await session.commitTransaction();
        setLog(LogLevel.INFO, LogMessage.SUCCESS, createCustomer.name);
        responseHandler.created(response);
      }
    } catch (error) {
      await session.abortTransaction();
      baseController.errorHandler(response, error, createCustomer.name);
    } finally {
      session.endSession();
    }
  },
  "createCustomer"
);

export const updateCustInfo = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    try {
      if (!baseController.validateContentType(request, response, updateCustInfo.name)){
        return;
      }

      const fields = [
        { key: "action", type: "string" },
        { key: "custId", type: "string" },
        { key: "custName", type: "string" },
        { key: "amount", type: "integer" }
      ];
      const { custId, createDate } = request.body;
      if (!isNullOrEmpty(createDate)) {
        fields.push({ key: "createDate", type: "date" });
      }
      if (!baseController.validateBodyFields(request, response, updateCustInfo.name, fields)) {
        return;
      }

      if (!baseController.validateCustId(custId, response, updateCustInfo.name)) {
        return;
      }

      switch (request.body.action) {
        case "name": {
          const result = await Customer.findOneAndUpdate(
            { _id: request.body.custId },
            { custName: request.body.custName }
          );
          if (!result) {
            setLog(LogLevel.ERROR, LogMessage.ERROR.NOTFOUND, updateCustInfo.name);
            responseHandler.notFound(response);
            return;
          }
          setLog(LogLevel.INFO, LogMessage.SUCCESS, updateCustInfo.name);
          responseHandler.success(response);
          break;
        }
        case "extend": {
          txnController.extendExpiryDate(request, response);
          break;
        }
        case "charge": {
          txnController.processPayment(request, response);
          break;
        }
        case "refill": {
          txnController.topUpAccount(request, response);
          break;
        }
      }
    } catch (error) {
      baseController.errorHandler(response, error, updateCustInfo.name);
    }
  },
  "updateCustInfo"
);