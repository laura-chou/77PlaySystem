import { Request, Response } from "express";
import { Types } from "mongoose";

import { LOG_LEVEL, LOG_MESSAGE, RESPONSE_MESSAGE } from "../common/constants";
import { responseHandler } from "../common/response";
import {
  isNullOrEmpty, isTypeBoolean, isTypeInteger, isTypeString
} from "../common/utils";
import { setLog } from "../core/logger";


export const validateContentType = (request: Request, response: Response, functionName: string): boolean => {
  const contentType: string | undefined = request.headers["content-type"];
  if (contentType !== "application/json") {
    setLog(LOG_LEVEL.ERROR, RESPONSE_MESSAGE.INVALID_CONTENT_TYPE, functionName);
    responseHandler.badRequest(response, "CONTENT_TYPE");
    return false;
  }
  return true;
};

const validateFieldType = (value: unknown, type: string): boolean => {
  switch (type) {
    case "string":
      return isTypeString(value);
    case "integer":
      return isTypeInteger(value);
    case "boolean":
      return isTypeBoolean(value);
    default:
      return false;
  }
};

export const validateBodyFields = (
  request: Request,
  response: Response,
  functionName: string,
  fields: { key: string, type: string }[]
): boolean => {
  for (const field of fields) {
    if (isNullOrEmpty(request.body[field.key])) {
      setLog(LOG_LEVEL.ERROR, RESPONSE_MESSAGE.INVALID_JSON_KEY, functionName);
      responseHandler.badRequest(response, "JSON_KEY");
      return false;
    }
    
    if (!validateFieldType(request.body[field.key], field.type)) {
      setLog(LOG_LEVEL.ERROR, RESPONSE_MESSAGE.INVALID_JSON_FORMAT, functionName);
      responseHandler.badRequest(response, "JSON_FORMAT");
      return false;
    }
  }
  return true;
};

export const validateCustId = (custId: string, response: Response, functionName: string): boolean => {
  if (Types.ObjectId.isValid(custId)) {
    return true;
  }
  setLog(LOG_LEVEL.ERROR, RESPONSE_MESSAGE.INVALID_CUSTID, functionName);
  responseHandler.badRequest(response, "CUST_ID");
  return false;
};


export const errorHandler = (
  response: Response,
  error: unknown,
  functionName: string
): void => {
  setLog(
    LOG_LEVEL.ERROR,
    error instanceof Error ? error.message : LOG_MESSAGE.ERROR.UNKNOWN, 
    functionName);
  responseHandler.serverError(response);
};

