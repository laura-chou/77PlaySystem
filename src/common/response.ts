import { Response } from "express";

import { HTTP_STATUS, RESPONSE_MESSAGE } from "./constants";

export const BADREQUEST_MESSAGE_MAP = {
  CONTENT_TYPE: RESPONSE_MESSAGE.INVALID_CONTENT_TYPE,
  JSON_KEY: RESPONSE_MESSAGE.INVALID_JSON_KEY,
  JSON_FORMAT: RESPONSE_MESSAGE.INVALID_JSON_FORMAT,
  INVALID_LOGIC: RESPONSE_MESSAGE.INVALID_LOGIC,
  CUST_ID: RESPONSE_MESSAGE.INVALID_CUSTID,
  CUSTNOTDUE: RESPONSE_MESSAGE.CUSTNOTDUE
} as const;

export const UNAUTHORIZED_MESSAGE_MAP = {
  INVALID_TOKEN: RESPONSE_MESSAGE.INVALID_TOKEN,
  WRONG_PASSWORD: RESPONSE_MESSAGE.WRONG_PASSWORD
} as const;

export type BadRequestType = keyof typeof BADREQUEST_MESSAGE_MAP;
export type UnAuthorizedType = keyof typeof UNAUTHORIZED_MESSAGE_MAP;

interface ApiResponse<T> {
  status: number
  message: string
  data?: T
}

const sendResponse = <T>(
  res: Response,
  status: number,
  message: string,
  data?: T,
  errorType?: string
): void => {
  const response: ApiResponse<T> = {
    status,
    message,
    ...(errorType && { errorType }),
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

  badRequest<T>(
    res: Response,
    type: BadRequestType,
    data?: T
  ): void {
    sendResponse(
      res, 
      HTTP_STATUS.BAD_REQUEST, 
      BADREQUEST_MESSAGE_MAP[type],
      data,
      type
    );
  },

  unauthorized(res: Response, type: UnAuthorizedType): void {
    sendResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      UNAUTHORIZED_MESSAGE_MAP[type],
      undefined,
      type
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