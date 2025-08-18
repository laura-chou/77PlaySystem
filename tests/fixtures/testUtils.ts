import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request, { Response } from "supertest";

import app from "../../src/app";
import { CONTENT_TYPE, HTTP_STATUS, RESPONSE_MESSAGE } from "../../src/common/constants";
import { isTypeString } from "../../src/common/utils";
import Transaction from "../../src/models/transaction.model";
import User from "../../src/models/user.model";

import { MOCK_LATEST_TRANSACTION_EXPIRED, MOCK_LATEST_TRANSACTION_NOT_EXPIRED } from "./transactionTestConfig";
import { MOCK_USER_ADMIN } from "./userTestConfig";

interface TokenInfo {
  showToken: boolean;
  isExpired: boolean;
  isInvalid: boolean;
  existUser: boolean;
}

const defaultTokenInfo: Required<TokenInfo> = {
  showToken: true,
  existUser: true,
  isExpired: false,
  isInvalid: false
};

export const mockUserFindOne = (data: object | null = MOCK_USER_ADMIN): void => {
  (User.findOne as jest.Mock).mockResolvedValue(data);
};

export const mockTransactionFindOne = (type?: "null" | "error" | "expiry"): void => {
  const mock = Transaction.findOne as jest.Mock;

  switch (type) {
    case "null":
      mock.mockReturnValue({
        sort: jest.fn().mockResolvedValue(null),
      });
      break;

    case "error":
      mock.mockImplementationOnce(() => ({
        sort: jest.fn().mockRejectedValue(new Error("DB Error")),
      }));
      break;
    
    case "expiry":
      mock.mockReturnValue({
        sort: jest.fn().mockResolvedValue(MOCK_LATEST_TRANSACTION_EXPIRED),
      });
      break;

    default:
      mock.mockReturnValue({
        sort: jest.fn().mockResolvedValue(MOCK_LATEST_TRANSACTION_NOT_EXPIRED),
      });
      break;
  }
};

export const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

export const mockStartSession = (): void => {
  mongoose.startSession = jest.fn().mockResolvedValue(mockSession);
};

export const createRequest = {
  get: (
    route: string,
    status: number,
    tokenInfo?: Partial<TokenInfo>,    
    isExpectJson: boolean = true
  ): request.Test => {
    const mergedTokenInfo = { ...defaultTokenInfo, ...tokenInfo };
    const expectContentType = isExpectJson ? CONTENT_TYPE.JSON_WITH_CHARSET : CONTENT_TYPE.TEXT_WITH_CHARSET;
    const req = request(app).get(route);

    if (mergedTokenInfo.showToken) {
      const validToken = jwt.sign(
        { user: mergedTokenInfo.existUser ? "testuser" : "notExistUser"},
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        process.env.JWT_SECRET!,
        { expiresIn: mergedTokenInfo.isExpired ? -1 : "1h" }
      );
      const token = mergedTokenInfo.isInvalid ? "invalidtoken" : validToken;
      req.set("Authorization", `Bearer ${token}`);
    }

    return req
      .expect("Content-Type", expectContentType)
      .expect(status);
  },

  post: (
    route: string,
    body: string | object,
    status: number,
    tokenInfo?: Partial<TokenInfo>,
    isSetJson: boolean = true,
    isExpectJson: boolean = true
  ): request.Test => {
    const mergedTokenInfo = { ...defaultTokenInfo, ...tokenInfo };
    const setContentType = isSetJson ? CONTENT_TYPE.JSON : CONTENT_TYPE.FORM_URLENCODED;
    const expectContentType = isExpectJson ? CONTENT_TYPE.JSON_WITH_CHARSET : CONTENT_TYPE.TEXT_WITH_CHARSET;
    const req = request(app)
      .post(route)
      .set("Content-Type", setContentType)
      .send(body);
    if (mergedTokenInfo.showToken) {
      const validToken = jwt.sign(
        { user: mergedTokenInfo.existUser ? "testuser" : "notExistUser" },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        process.env.JWT_SECRET!,
        { expiresIn: mergedTokenInfo.isExpired ? -1 : "1h" }
      );
      const token = mergedTokenInfo.isInvalid ? "invalidtoken" : validToken;
      req.set("Authorization", `Bearer ${token}`);
    }

    return req
      .expect("Content-Type", expectContentType)
      .expect(status);
  },

  patch: (
    route: string,
    body: string | object,
    status: number,
    tokenInfo?: Partial<TokenInfo>,
    isSetJson: boolean = true,
    isExpectJson: boolean = true
  ): request.Test => {
    const mergedTokenInfo = { ...defaultTokenInfo, ...tokenInfo };
    const setContentType = isSetJson ? CONTENT_TYPE.JSON : CONTENT_TYPE.FORM_URLENCODED;
    const expectContentType = isExpectJson ? CONTENT_TYPE.JSON_WITH_CHARSET : CONTENT_TYPE.TEXT_WITH_CHARSET;
    const req = request(app)
      .patch(route)
      .set("Content-Type", setContentType)
      .send(body);

    if (mergedTokenInfo.showToken) {
      const validToken = jwt.sign(
        { user: mergedTokenInfo.existUser ? "testuser" : "notExistUser" },
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        process.env.JWT_SECRET!,
        { expiresIn: mergedTokenInfo.isExpired ? -1 : "1h" }
      );
      const token = mergedTokenInfo.isInvalid ? "invalidtoken" : validToken;
      req.set("Authorization", `Bearer ${token}`);
    }
    
    return req
      .expect("Content-Type", expectContentType)
      .expect(status);
  },

  delete: (
    route: string,
    status: number,
    tokenInfo?: Partial<TokenInfo>,    
    isExpectJson: boolean = true
  ): request.Test => {
    const mergedTokenInfo = { ...defaultTokenInfo, ...tokenInfo };
    const expectContentType = isExpectJson ? CONTENT_TYPE.JSON_WITH_CHARSET : CONTENT_TYPE.TEXT_WITH_CHARSET;
    const req = request(app).delete(route);

    if (mergedTokenInfo.showToken) {
      const validToken = jwt.sign(
        { user: mergedTokenInfo.existUser ? "testuser" : "notExistUser"},
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        process.env.JWT_SECRET!,
        { expiresIn: mergedTokenInfo.isExpired ? -1 : "1h" }
      );
      const token = mergedTokenInfo.isInvalid ? "invalidtoken" : validToken;
      req.set("Authorization", `Bearer ${token}`);
    }

    return req
      .expect("Content-Type", expectContentType)
      .expect(status);
  }
};

export const expectResponse = {
  success: (response: Response, data: string | object): void => {
    if (isTypeString(data)) {
      expect(response.text).toBe(data);
    } else {
      expect(response.body).toEqual({
        status: HTTP_STATUS.OK,
        message: RESPONSE_MESSAGE.SUCCESS,
        data: data
      });
    }
  },

  created: (response: Response): void => {
    expect(response.body).toEqual({
      status: HTTP_STATUS.CREATED,
      message: RESPONSE_MESSAGE.SUCCESS
    });
  },

  updated: (response: Response): void => {
    expect(response.body).toEqual({
      status: HTTP_STATUS.OK,
      message: RESPONSE_MESSAGE.SUCCESS
    });
  },

  noData: (response: Response): void => {
    expect(response.body).toEqual({
      status: HTTP_STATUS.OK,
      message: RESPONSE_MESSAGE.NO_DATA,
    });
  },

  badRequest: (response: Response, message: string): void => {
    expect(response.body).toEqual({
      status: HTTP_STATUS.BAD_REQUEST,
      message: message
    });
  },

  notFound: (response: Response): void => {
    expect(response.body).toEqual({
      status: HTTP_STATUS.NOT_FOUND,
      message: RESPONSE_MESSAGE.NOT_FOUND,
    });
  },

  error: (response: Response): void => {
    expect(response.body).toEqual({
      status: HTTP_STATUS.SERVER_ERROR,
      message: RESPONSE_MESSAGE.SERVER_ERROR
    });
  },

  unauthorized: (
    response: Response,
    message: string = RESPONSE_MESSAGE.WRONG_PASSWORD): void => {
    expect(response.body).toEqual({
      status: HTTP_STATUS.UNAUTHORIZED,
      message: message
    });
  },

  conflict: (response: Response, message: string = RESPONSE_MESSAGE.DATA_ALREADY_EXISTS): void => {
    expect(response.body).toEqual({
      status: HTTP_STATUS.CONFLICT,
      message: message
    });
  },
};
