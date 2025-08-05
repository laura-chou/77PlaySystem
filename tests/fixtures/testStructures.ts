import { Response } from "supertest";

import { HTTP_STATUS, RESPONSE_MESSAGE } from "../../src/common/constants";
import Customer from "../../src/models/customer.model";
import User from "../../src/models/user.model";


const mockUserFindOne = User.findOne as jest.Mock;
const mockCustomerAggregate = Customer.aggregate as jest.Mock;

interface AuthErrorTestCase {
  name: string;
  tokenInfo: {
    showToken?: boolean;
    isExpired?: boolean;
    isInvalid?: boolean;
    existUser?: boolean;
  };
  mockSetup?: () => void;
  expectedMessage: string;
}

type RequestFunction = (
  route: string,
  status: number,
  tokenInfo?: Partial<AuthErrorTestCase["tokenInfo"]>,
  isExpectJson?: boolean
) => Promise<Response>;

interface ResponseValidator {
  unauthorized: (response: Response, message: string) => void;
  success: (response: Response, data: string | object) => void;
  badRequest: (response: Response, message: string) => void;
  noData: (response: Response) => void;
  error: (response: Response) => void;
}

interface MockAdminData {
  userName: string;
  password: string;
  token: string;
}

interface MockCustomerData {
  custId: string;
  custName: string;
  expiryDate?: string;
  createDate?: string;
  history?: Array<{
    serviceName: string;
    amount: number;
    currentBalance: number;
    spendDate: string;
    expiryDate: string;
  }>;
}

interface ServerErrorTestCase {
  name: string;
  mockSetup: () => void;
}

export const describeSuccessTests = (
  route: string,
  mockAdminData: MockAdminData,
  mockData: MockCustomerData[],
  createRequestFn: RequestFunction,
  expectResponseFn: ResponseValidator
) : void => {
  describe("Success Cases", () => {
    test("should return data with valid JWT", async () => {
      mockUserFindOne.mockResolvedValue(mockAdminData);
      mockCustomerAggregate.mockResolvedValue(mockData);

      const response = await createRequestFn(route, HTTP_STATUS.OK);
      expectResponseFn.success(response, mockData);
    });

    test("should return no data when data does not exist", async () => {
      mockUserFindOne.mockResolvedValue(mockAdminData);
      mockCustomerAggregate.mockResolvedValue([]);

      const response = await createRequestFn(route, HTTP_STATUS.OK);
      expectResponseFn.noData(response);
    });
  });
};

export const describeAuthErrorTests = (
  route: string,
  createRequestFn: RequestFunction,
  expectResponseFn: ResponseValidator
) : void => {
  describe("Authentication Error Cases", () => {
    const authErrorTestCases: AuthErrorTestCase[] = [
      {
        name: "should fail if no JWT is provided",
        tokenInfo: { showToken: false },
        expectedMessage: "No auth token"
      },
      {
        name: "should fail if JWT is invalid",
        tokenInfo: { isInvalid: true },
        expectedMessage: "jwt malformed"
      },
      {
        name: "should fail if JWT is expired",
        tokenInfo: { isExpired: true },
        expectedMessage: "jwt expired"
      },
      {
        name: "should fail if Customer in JWT does not exist",
        tokenInfo: { existUser: false },
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        mockSetup: (): void => {},
        expectedMessage: RESPONSE_MESSAGE.USER_NOT_EXIST
      }
    ];
    
    authErrorTestCases.forEach(({ name, tokenInfo, mockSetup, expectedMessage }) => {
      test(name, async (): Promise<void> => {
        if (mockSetup && name.includes("does not exist")) {
          mockUserFindOne.mockResolvedValue(null);
        }

        const response = await createRequestFn(route, HTTP_STATUS.UNAUTHORIZED, tokenInfo);
        expectResponseFn.unauthorized(response, expectedMessage);
      });
    });
  });
};

export const describeServerErrorTests = (
  route: string,
  mockAdminData: MockAdminData,
  createRequestFn: RequestFunction,
  expectResponseFn: ResponseValidator,
  customTestCases?: ServerErrorTestCase[]
): void => {
  describe("Server Error Cases", () => {
    const defaultTestCases: ServerErrorTestCase[] = [
      {
        name: "should return 500 if User.findOne throws error",
        mockSetup: (): void => {
          mockUserFindOne.mockRejectedValue(new Error("DB Error"));
        }
      },
      {
        name: "should return 500 if Customer.aggregate throws error",
        mockSetup: (): void => {
          mockUserFindOne.mockResolvedValue(mockAdminData);
          mockCustomerAggregate.mockRejectedValue(new Error("DB Error"));
        }
      }
    ];

    const testCases = customTestCases || defaultTestCases;
    
    testCases.forEach(({ name, mockSetup }) => {
      test(name, async (): Promise<void> => {
        mockSetup();
        
        const response = await createRequestFn(route, HTTP_STATUS.SERVER_ERROR);
        expectResponseFn.error(response);
      });
    });
  });
};

export const describeCustIdValidationTest = (
  route: string,
  mockAdminData: MockAdminData,
  createRequestFn: RequestFunction,
  expectResponseFn: ResponseValidator
): void => {
  describe("custId Parameter Validation", () => {
    test("should return 400 if custId format is invalid", async () => {
      mockUserFindOne.mockResolvedValue(mockAdminData);
      
      const response = await createRequestFn(
        `${route}/invalid-id`,
        HTTP_STATUS.BAD_REQUEST
      );
      expectResponseFn.badRequest(response, RESPONSE_MESSAGE.INVALID_CUSTID);
    });
  });
};