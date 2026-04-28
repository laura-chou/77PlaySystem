import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request, { Response, Request } from "supertest";

import app from "../../src/app";
import { CONTENT_TYPE, HTTP_STATUS, RESPONSE_MESSAGE } from "../../src/common/constants";
import { BADREQUEST_MESSAGE_MAP, BadRequestType, UNAUTHORIZED_MESSAGE_MAP, UnAuthorizedType } from "../../src/common/response";
import { isTypeString } from "../../src/common/utils";
import * as jwtCore from "../../src/core/jwt";
import Transaction from "../../src/models/transaction.model";
import User from "../../src/models/user.model";

import { MOCK_LATEST_TRANSACTION_EXPIRED, MOCK_LATEST_TRANSACTION_NOT_EXPIRED } from "./transactionTestConfig";
import { MOCK_USER_ADMIN } from "./userTestConfig";

export interface TokenOptions {
  showToken: boolean;
  mockToken: boolean;
  isExpired: boolean;
  isInvalid: boolean;
  existUser: boolean;
}

const defaultTokenOptions: Required<TokenOptions> = {
  showToken: true,
  mockToken: true,
  existUser: true,
  isExpired: false,
  isInvalid: false
};

const attachTokenHeader = (req: Request, options: TokenOptions): void => {
  if (!options.showToken) return;

  const payload = {
    user: options.existUser ? MOCK_USER_ADMIN._id : "notExistUser",
  };

  const signOptions: jwt.SignOptions = {};
  if (options.isExpired) signOptions.expiresIn = -1;

  const token = jwt.sign(
    payload,
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    process.env.JWT_SECRET!,
    signOptions
  );

  if (options.mockToken && options.existUser && !options.isExpired && !options.isInvalid) {
    MOCK_USER_ADMIN.token = token;
  }

  req.set("Authorization", `Bearer ${options.isInvalid ? "invalidtoken" : token}`);
};

export const mockUserFindOne = (data: object | null = MOCK_USER_ADMIN): void => {
  (User.findOne as jest.Mock).mockResolvedValue(data);
};

export const spyOnGetUserIdFromToken = (data: string | null = MOCK_USER_ADMIN._id): void => {
  jest.spyOn(jwtCore, "getUserIdFromToken").mockReturnValue(data);
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
    TokenOptions?: Partial<TokenOptions>,    
    isExpectJson: boolean = true
  ): request.Test => {
    const mergedTokenOptions = { ...defaultTokenOptions, ...TokenOptions };
    const expectContentType = isExpectJson ? CONTENT_TYPE.JSON_WITH_CHARSET : CONTENT_TYPE.TEXT_WITH_CHARSET;
    const req = request(app).get(route);

    attachTokenHeader(req, mergedTokenOptions);

    return req
      .expect("Content-Type", expectContentType)
      .expect(status);
  },

  post: (
    route: string,
    body: string | object,
    status: number,
    TokenOptions?: Partial<TokenOptions>,
    isSetJson: boolean = true,
    isExpectJson: boolean = true
  ): request.Test => {
    const mergedTokenOptions = { ...defaultTokenOptions, ...TokenOptions };
    const setContentType = isSetJson ? CONTENT_TYPE.JSON : CONTENT_TYPE.FORM_URLENCODED;
    const expectContentType = isExpectJson ? CONTENT_TYPE.JSON_WITH_CHARSET : CONTENT_TYPE.TEXT_WITH_CHARSET;
    const req = request(app)
      .post(route)
      .set("Content-Type", setContentType)
      .send(body);

    attachTokenHeader(req, mergedTokenOptions);

    return req
      .expect("Content-Type", expectContentType)
      .expect(status);
  },

  patch: (
    route: string,
    body: string | object,
    status: number,
    TokenOptions?: Partial<TokenOptions>,
    isSetJson: boolean = true,
    isExpectJson: boolean = true
  ): request.Test => {
    const mergedTokenOptions = { ...defaultTokenOptions, ...TokenOptions };
    const setContentType = isSetJson ? CONTENT_TYPE.JSON : CONTENT_TYPE.FORM_URLENCODED;
    const expectContentType = isExpectJson ? CONTENT_TYPE.JSON_WITH_CHARSET : CONTENT_TYPE.TEXT_WITH_CHARSET;
    const req = request(app)
      .patch(route)
      .set("Content-Type", setContentType)
      .send(body);

    attachTokenHeader(req, mergedTokenOptions);

    return req
      .expect("Content-Type", expectContentType)
      .expect(status);
  },

  delete: (
    route: string,
    status: number,
    TokenOptions?: Partial<TokenOptions>,
    isExpectJson: boolean = true
  ): request.Test => {
    const mergedTokenOptions = { ...defaultTokenOptions, ...TokenOptions };
    const expectContentType = isExpectJson ? CONTENT_TYPE.JSON_WITH_CHARSET : CONTENT_TYPE.TEXT_WITH_CHARSET;
    const req = request(app).delete(route);

    attachTokenHeader(req, mergedTokenOptions);

    return req
      .expect("Content-Type", expectContentType)
      .expect(status);
  }
};

export const expectResponse = {
  success: (response: Response, data?: string | object): void => {
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

  badRequest: (
    response: Response,
    type: BadRequestType,
    data?: string | object
  ): void => {
    expect(response.body).toEqual({
      status: HTTP_STATUS.BAD_REQUEST,
      message: BADREQUEST_MESSAGE_MAP[type],
      data,
      errorType: type
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
    type: UnAuthorizedType): void => {
    expect(response.body).toEqual({
      status: HTTP_STATUS.UNAUTHORIZED,
      message: UNAUTHORIZED_MESSAGE_MAP[type],
      errorType: type
    });
  },

  conflict: (response: Response, message: string = RESPONSE_MESSAGE.DATA_ALREADY_EXISTS): void => {
    expect(response.body).toEqual({
      status: HTTP_STATUS.CONFLICT,
      message: message
    });
  },

  noContent: (response: Response): void => {
    expect(response.body).toEqual({
      status: 204,
      message: RESPONSE_MESSAGE.SUCCESS
    });
  },
};
