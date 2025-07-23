import { Response } from "express";

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
  isJson: boolean = true,
  data?: T
): void => {
  if (isJson) {
    const response: ApiResponse<T> = {
        status,
        message,
        ...(data !== undefined && { data })
    };
    res.status(status).json(response);
    return;
  }
  res.status(status).send(data);
};
  
export const responseHandler = {
  success<T>(res: Response, data?: T, isJson: boolean = true): void {
    sendResponse(
      res, 
      HTTP_STATUS.OK, 
      RESPONSE_MESSAGE.SUCCESS, 
      isJson,
      data
    );
  },

  noData(res: Response): void {
    sendResponse(
      res, 
      HTTP_STATUS.OK, 
      RESPONSE_MESSAGE.NO_DATA
    );
  },

  serverError(res: Response): void {
    sendResponse(
      res, 
      HTTP_STATUS.SERVER_ERROR, 
      RESPONSE_MESSAGE.SERVER_ERROR
    );
  },

  badRequest(res: Response, type: "CONTENT_TYPE" | "JSON_KEY" | "JSON_FORMAT"): void {
    const messageMap = {
      CONTENT_TYPE: RESPONSE_MESSAGE.INVALID_CONTENT_TYPE,
      JSON_KEY: RESPONSE_MESSAGE.INVALID_JSON_KEY,
      JSON_FORMAT: RESPONSE_MESSAGE.INVALID_JSON_FORMAT
    };

    sendResponse(
      res, 
      HTTP_STATUS.BAD_REQUEST, 
      messageMap[type]
    );
  },

  forbidden(res: Response): void {
    sendResponse(
      res, 
      HTTP_STATUS.FORBIDDEN, 
      RESPONSE_MESSAGE.FORBIDDEN_CORS
    );
  },

  unauthorized(res: Response, message: string = RESPONSE_MESSAGE.UNKNOWN): void {
    sendResponse(
      res,
      HTTP_STATUS.UNAUTHORIZED,
      message
    );
  },
};
  