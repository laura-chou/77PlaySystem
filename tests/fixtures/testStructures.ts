import request from "supertest";

import { HTTP_STATUS, RESPONSE_MESSAGE } from "../../src/common/constants";
import User from "../../src/models/user.model";

import { expectResponse } from "./testUtils";
import { MOCK_ADMIN_DATA } from "./userTestConfig";

type TokenInfo = {
  showToken: boolean;
  existUser?: boolean;
  isInvalid?: boolean;
  isExpired?: boolean;
};

type AuthTestCase = [string, Partial<TokenInfo>, string, boolean?];

type ValidationTestCase = [string, object, boolean, string];

interface ValidationConfig {
  route: string;
  validBody: object;
  requestFn: (
    route: string, 
    body: object, 
    status: number,
    tokenInfo?: Partial<TokenInfo>,
    isSetJson?: boolean
  ) => Promise<request.Response>;
}

type GetRequestFunction = (
  route: string,
  status: number,
  tokenInfo?: Partial<TokenInfo>
) => Promise<request.Response>;

type ModifyRequestFunction = (
  route: string,
  body: string | object,
  status: number,
  tokenInfo?: Partial<TokenInfo>
) => Promise<request.Response>;

interface ServerErrorConfig {
  route: string;
  requestFn: GetRequestFunction | ModifyRequestFunction;
  requestBody?: object;
  dbErrorCases: {
    name: string;
    mockFn: jest.Mock;
    setupMocks?: () => void;
  }[];
}

export const describeCustIdValidationTest = (
  route: string,
  requestFn: (
    route: string,
    status: number,
    tokenInfo?: Partial<TokenInfo>
  ) => Promise<request.Response>,
  expectResponseFn: typeof expectResponse
): void => {
  describe("custId Parameter Validation", () => {
    test("should return 400 if custId format is invalid", async () => {
      (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
      
      const response = await requestFn(
        route,
        HTTP_STATUS.BAD_REQUEST,
        {}
      );
      expectResponseFn.badRequest(response, RESPONSE_MESSAGE.INVALID_CUSTID);
    });
  });
};

export const describeAuthErrorTests = (
  route: string,
  requestFn: (
    route: string,
    status: number,
    tokenInfo?: Partial<TokenInfo>
  ) => Promise<request.Response>,
  expectResponseFn: typeof expectResponse
): void => {
  const authTestCases: AuthTestCase[] = [
    ["no JWT", { showToken: false }, "No auth token"],
    ["invalid JWT", { isInvalid: true }, "jwt malformed"],
    ["expired JWT", { isExpired: true }, "jwt expired"],
    ["Customer in JWT does not exist", { existUser: false, showToken: true }, RESPONSE_MESSAGE.USER_NOT_EXIST, true]
  ];

  describe("Authentication Error Cases", () => {
    test.each(authTestCases)(
      "should fail if %s",
      async (
        _: string,
        tokenInfo: Partial<TokenInfo>,
        expectedMessage: string,
        isUserNull: boolean = false
      ) => {
        if (isUserNull) {
          (User.findOne as jest.Mock).mockResolvedValue(null);
        } else {
          (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
        }
        const response = await requestFn(route, HTTP_STATUS.UNAUTHORIZED, tokenInfo);
        expectResponseFn.unauthorized(response, expectedMessage);
      }
    );
  });
};

export const describeValidationErrorTests = (
  config: ValidationConfig,
  expectResponseFn: typeof expectResponse
): void => {
  describe("Validation Error Cases", () => {
    const validationTestCases: ValidationTestCase[] = [
      ["invalid Content-Type", config.validBody, false, RESPONSE_MESSAGE.INVALID_CONTENT_TYPE],
      ["missing key in JSON body", { wrongKey: "value" }, true, RESPONSE_MESSAGE.INVALID_JSON_KEY],
      ["invalid data type", { ...config.validBody, ...{ [Object.keys(config.validBody)[0]]: 123456 } }, true, RESPONSE_MESSAGE.INVALID_JSON_FORMAT]
    ];

    test.each(validationTestCases)(
      "should bad request for %s",
      async (_, requestBody, isSetJson, expectedMessage) => {
        (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
        
        const response = await config.requestFn(
          config.route,
          requestBody,
          HTTP_STATUS.BAD_REQUEST,
          {},
          isSetJson
        );
        expectResponseFn.badRequest(response, expectedMessage);
      }
    );
  });
};

export const describeServerErrorTests = (
  config: ServerErrorConfig,
  expectResponseFn: typeof expectResponse
): void => {
  describe("Server Error Cases", () => {
    test.each(config.dbErrorCases)(
      "should return 500 if $name throws error",
      async ({ mockFn, setupMocks }) => {
        if (setupMocks) {
          setupMocks();
        }

        mockFn.mockRejectedValue(new Error("DB Error"));

        const isModifyRequest = config.requestBody !== undefined;

        const response = await (isModifyRequest
          ? (config.requestFn as ModifyRequestFunction)(
              config.route,
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              config.requestBody!,
              HTTP_STATUS.SERVER_ERROR
            )
          : (config.requestFn as GetRequestFunction)(
              config.route,
              HTTP_STATUS.SERVER_ERROR
            ));

        expectResponseFn.error(response);
      }
    );
  });
};
