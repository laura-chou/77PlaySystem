import { Request, Response } from "express";
import mongoose from "mongoose";

import { responseHandler } from "../common/response";
import { getNowDate, getDateAfterMonths, isNullOrEmpty, setFunctionName } from "../common/utils";
import { getCustomerListPipeline, getCustomerDetailPipeline } from "../core/db";
import { LOG_LEVEL, LOG_MESSAGE, setLog } from "../core/logger";
import Customer, { ICustomer } from "../models/customer.model";
import ServiceType from "../models/serviceType.model";
import Transaction, { ITransaction } from "../models/transaction.model";

import * as baseController from "./base.controller";

export const getCustList = setFunctionName(
  async(_request: Request, response: Response): Promise<void> => {
    try {
      const customers = await Customer.aggregate(getCustomerListPipeline());

      setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, getCustList.name);
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
          setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, getCustomer.name);
          responseHandler.success(response, customer.at(0));
        } else {
          setLog(LOG_LEVEL.ERROR, LOG_MESSAGE.ERROR.NOTFOUND, getCustomer.name);
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
        const logMsg = `${LOG_MESSAGE.ERROR.CUSTEXISTS}, custName: ${custName}`;
        setLog(LOG_LEVEL.ERROR, logMsg, createCustomer.name);
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
        setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, createCustomer.name);
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
      const custId = request.params.custId;

      if (!baseController.validateCustId(custId, response, updateCustInfo.name)) {
        return;
      }

      if (!baseController.validateContentType(request, response, updateCustInfo.name)){
        return;
      }

      const fields = [
        { key: "custName", type: "string" }
      ];
      if (!baseController.validateBodyFields(request, response, updateCustInfo.name, fields)) {
        return;
      }

      const custName = request.body.custName.trim();
      if (custId) {
        await Customer.findByIdAndUpdate(
          custId,
          { custName }
        );
        setLog(LOG_LEVEL.INFO, LOG_MESSAGE.SUCCESS, updateCustInfo.name);
        responseHandler.success(response);
      }
    } catch (error) {
      baseController.errorHandler(response, error, updateCustInfo.name);
    }
  },
  "updateCustInfo"
);