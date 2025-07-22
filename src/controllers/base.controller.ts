import { Request, Response } from "express";

import { LOG_LEVEL, LOG_MESSAGE, RESPONSE_MESSAGE } from "../common/constants";
import { responseHandler } from "../common/response";
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
