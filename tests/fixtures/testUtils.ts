import jwt from "jsonwebtoken";
import request, { Response } from "supertest";

import app from "../../src/app";
import { CONTENT_TYPE, HTTP_STATUS, RESPONSE_MESSAGE } from "../../src/common/constants";
import { isTypeString } from "../../src/common/utils";

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
  }
};
