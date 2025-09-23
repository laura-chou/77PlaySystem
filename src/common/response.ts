import { Response } from "express";

import { LOG_MESSAGE } from "../core/logger";

import { HTTP_STATUS, RESPONSE_MESSAGE } from "./constants";

interface ApiResponse<T> {
  status: number
  message: string
  data?: T
}
  
const sendResponse = <T>(
  res: Response,
  status: number,
  message: string,
  data?: T
): void => {
  const response: ApiResponse<T> = {
    status,
    message,
    ...(data !== undefined && { data })
  };
  res.status(status).json(response);
};
  
export const responseHandler = {
  success<T>(res: Response, data?: T): void {
    sendResponse(
      res, 
      HTTP_STATUS.OK, 
      RESPONSE_MESSAGE.SUCCESS,
      data
    );
  },

  created(res: Response): void {
    sendResponse(
      res, 
      HTTP_STATUS.CREATED, 
      RESPONSE_MESSAGE.SUCCESS
    );
  },

  badRequest(
    res: Response,
    type: "CONTENT_TYPE" | "JSON_KEY" | "JSON_FORMAT" | "CUST_ID" | "LOGIC"
  ): void {
    const messageMap = {
      CONTENT_TYPE: RESPONSE_MESSAGE.INVALID_CONTENT_TYPE,
      JSON_KEY: RESPONSE_MESSAGE.INVALID_JSON_KEY,
      JSON_FORMAT: RESPONSE_MESSAGE.INVALID_JSON_FORMAT,
      CUST_ID: RESPONSE_MESSAGE.INVALID_CUSTID,
      LOGIC: RESPONSE_MESSAGE.INVALID_LOGIC
    };

    sendResponse(
      res, 
      HTTP_STATUS.BAD_REQUEST, 
      messageMap[type]
    );
  },

  unauthorized(res: Response, message: string = LOG_MESSAGE.ERROR.UNKNOWN): void {
    sendResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      message
    );
  },

  forbidden(res: Response): void {
    sendResponse(
      res, 
      HTTP_STATUS.FORBIDDEN, 
      RESPONSE_MESSAGE.FORBIDDEN_CORS
    );
  },

  notFound(res: Response): void {
    sendResponse(
      res,
      HTTP_STATUS.NOT_FOUND,
      RESPONSE_MESSAGE.NOT_FOUND
    );
  },

  conflict(res: Response, message: string = RESPONSE_MESSAGE.DATA_ALREADY_EXISTS): void {
    sendResponse(
      res,
      HTTP_STATUS.CONFLICT,
      message
    );
  },

  serverError(res: Response): void {
    sendResponse(
      res, 
      HTTP_STATUS.SERVER_ERROR, 
      RESPONSE_MESSAGE.SERVER_ERROR
    );
  }
};