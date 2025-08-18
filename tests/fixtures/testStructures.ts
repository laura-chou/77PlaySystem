import request from "supertest";

import { HTTP_STATUS, RESPONSE_MESSAGE } from "../../src/common/constants";

import { expectResponse, mockSession, mockTransactionFindOne, mockUserFindOne } from "./testUtils";

type TokenInfo = {
  showToken: boolean;
  existUser?: boolean;
  isInvalid?: boolean;
  isExpired?: boolean;
};

type AuthTestCase = [string, Partial<TokenInfo>, string, boolean?];

type ValidationTestCase = [
  description: string,
  requestBody: Record<string, unknown>,
  isSetJson: boolean,
  expectedMessage: string
];

interface ValidationConfig<T extends Record<string, unknown>> {
  route: string;
  validBody: T;
  requestFn: (
    route: string,
    body: Partial<T> | Record<string, unknown>,
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
    includeAbortTransactionTest?: boolean;
  }[];
}

type ValidationBaseModel = {
  [key: string]: unknown;
};

const generateInvalidTypeBody = <T extends Record<string, unknown>>(validBody: T): { [K in keyof T]: unknown } => {
  return Object.keys(validBody).reduce((acc, key) => {
    const value = validBody[key as keyof T];

    let invalidValue: unknown;

    if (typeof value === "number") {
      invalidValue = "not a number";
    } else if (typeof value === "string") {
      invalidValue = 9999;
    } else if (typeof value === "boolean") {
      invalidValue = "true";
    } else if (Array.isArray(value)) {
      invalidValue = "not an array";
    } else if (typeof value === "object" && value !== null) {
      invalidValue = "not an object";
    } else {
      invalidValue = null;
    }

    return { ...acc, [key]: invalidValue };
  }, {} as { [K in keyof T]: unknown });
};

export const describeValidationCustIdTest = (
  route: string,
  requestFn: (
    route: string,
    status: number,
    tokenInfo?: Partial<TokenInfo>
  ) => Promise<request.Response>,
  expectResponseFn: typeof expectResponse
): void => {
  describe("Validation CustId Parameter", () => {
    test("should return 400 if custId format is invalid", async () => {
      mockUserFindOne();
      
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
    ["User in JWT does not exist", { existUser: false, showToken: true }, RESPONSE_MESSAGE.USER_NOT_EXIST, true]
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
          mockUserFindOne(null);
        } else {
          mockUserFindOne();
        }
        const response = await requestFn(route, HTTP_STATUS.UNAUTHORIZED, tokenInfo);
        expectResponseFn.unauthorized(response, expectedMessage);
      }
    );
  });
};

export const describeValidationErrorTests = <T extends ValidationBaseModel>(
  config: ValidationConfig<T> & { includeInvalidLogicTest?: boolean },
  expectResponseFn: typeof expectResponse
): void => {
  describe("Validation Error Cases", () => {
    const validationTestCases: ValidationTestCase[] = [
      ["invalid Content-Type", config.validBody, false, RESPONSE_MESSAGE.INVALID_CONTENT_TYPE],
      ["missing key in JSON body", { wrongKey: "value" }, true, RESPONSE_MESSAGE.INVALID_JSON_KEY],
      ["invalid data type", generateInvalidTypeBody(config.validBody), true, RESPONSE_MESSAGE.INVALID_JSON_FORMAT]
    ];

    if (config.includeInvalidLogicTest) {
      const logicCases: ValidationTestCase[] = [
        [
          "invalid logic: refill is true and amount is negative",
          { refill: true, extend: false, amount: -100 },
          true,
          RESPONSE_MESSAGE.INVALID_LOGIC
        ],
        [
          "invalid logic: extend is true and amount is negative",
          { refill: false, extend: true, amount: -100 },
          true,
          RESPONSE_MESSAGE.INVALID_LOGIC
        ],
        [
          "invalid logic: refill and extend are both true",
          { refill: true, extend: true, amount: 100 },
          true,
          RESPONSE_MESSAGE.INVALID_LOGIC
        ],
        [
          "invalid logic: extend is true but expiryDate is not expired",
          { refill: false, extend: true, amount: 100 },
          true,
          RESPONSE_MESSAGE.INVALID_LOGIC
        ]
      ];
      validationTestCases.push(...logicCases);
      // mockTransactionFindOne("expiry");
    }

    test.each(validationTestCases)(
      "should bad request for %s",
      async (_, requestBody, isSetJson, expectedMessage) => {
        mockUserFindOne();
        if (expectedMessage.includes(RESPONSE_MESSAGE.INVALID_LOGIC)) {
          mockTransactionFindOne();
        }

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
      async ({ mockFn, setupMocks, includeAbortTransactionTest }) => {
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

        if (includeAbortTransactionTest) {
          expect(mockSession.abortTransaction).toHaveBeenCalled();
          expect(mockSession.commitTransaction).not.toHaveBeenCalled();
          expect(mockSession.endSession).toHaveBeenCalled();
        }
      }
    );
  });
};