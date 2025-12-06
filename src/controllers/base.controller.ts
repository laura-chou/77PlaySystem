import { Request, Response } from "express";
import { Types } from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { responseHandler } from "../common/response";
import { isNullOrEmpty, isTypeBoolean, isTypeDate,
  isTypeInteger, isTypeString } from "../common/utils";
import { LogLevel, LogMessage, setLog } from "../core/logger";

export const validateContentType = (
  request: Request,
  response: Response,
  functionName: string
): boolean => {
  const contentType: string | undefined = request.headers["content-type"];
  if (contentType !== "application/json") {
    setLog(LogLevel.ERROR, RESPONSE_MESSAGE.INVALID_CONTENT_TYPE, functionName);
    responseHandler.badRequest(response, "CONTENT_TYPE");
    return false;
  }
  return true;
};

const validateFieldType = (
  value: unknown,
  type: string
): boolean => {
  switch (type) {
    case "string":
      return isTypeString(value);
    case "integer":
      return isTypeInteger(value);
    case "boolean":
      return isTypeBoolean(value);
    case "date":
      return typeof value === "string" && isTypeDate(value);
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
      setLog(LogLevel.ERROR, RESPONSE_MESSAGE.INVALID_JSON_KEY, functionName);
      responseHandler.badRequest(response, "JSON_KEY");
      return false;
    }
    
    if (!validateFieldType(request.body[field.key], field.type)) {
      setLog(LogLevel.ERROR, RESPONSE_MESSAGE.INVALID_JSON_FORMAT, functionName);
      responseHandler.badRequest(response, "JSON_FORMAT");
      return false;
    }
  }
  return true;
};

export const validateCustId = (
  custId: string,
  response: Response,
  functionName: string
): boolean => {
  if (Types.ObjectId.isValid(custId)) {
    return true;
  } else {
    setLog(LogLevel.ERROR, RESPONSE_MESSAGE.INVALID_CUSTID, functionName);
    responseHandler.badRequest(response, "CUST_ID");
    return false;
  }
};

export const errorHandler = (
  response: Response,
  error: unknown,
  functionName: string
): void => {
  setLog(
    LogLevel.ERROR,
    error instanceof Error ? error.message : LogMessage.ERROR.UNKNOWN, 
    functionName
  );
  responseHandler.serverError(response);
};

