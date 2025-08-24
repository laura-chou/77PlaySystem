import { HTTP_STATUS, RESPONSE_MESSAGE } from "../src/common/constants";
import * as utils from "../src/common/utils";
import Customer, { ICustomer } from "../src/models/customer.model";
import Transaction from "../src/models/transaction.model";
import User from "../src/models/user.model";

import { MOCK_CUSTOMER_INFO } from "./fixtures/customerTestConfig";
import { describeAuthErrorTests, describeValidationCustIdTest, describeServerErrorTests, describeValidationErrorTests } from "./fixtures/testStructures";
import { createRequest, expectResponse, mockSession, mockStartSession, mockTransactionFindOne, mockUserFindOne } from "./fixtures/testUtils";
import { ROUTE, MOCK_LATEST_TRANSACTION_NOT_EXPIRED, MOCK_CREATE_TRANSACTION, MOCK_EXTEND_TRANSACTION, MOCK_REFILL_TRANSACTION } from "./fixtures/transactionTestConfig";
import { MOCK_USER_ADMIN } from "./fixtures/userTestConfig";

const customerId = MOCK_LATEST_TRANSACTION_NOT_EXPIRED.customerId;
let spy: jest.SpyInstance;

jest.mock("../src/models/user.model", () => ({
  findOne: jest.fn(),
  updateOne: jest.fn(),
  UserRole: {
    ADMIN: "admin"
  }
}));

jest.mock("../src/models/transaction.model", () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock("../src/models/customer.model", () => ({
  findOneAndUpdate: jest.fn()
}));

const mockCustFindOneAndUpdate = (data: ICustomer | null = MOCK_CUSTOMER_INFO): void => {
  (Customer.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(data);
};

describe("Transaction API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockStartSession();
    spy = jest.spyOn(utils, "getDateAfterMonths").mockReturnValue(new Date("2025-08-12T16:47:39"));
  });

  afterEach(() => {
    spy.mockRestore();
  });

  describe(`POST ${ROUTE.CREATE}/:custId`, () => {
    const txnRoute = `${ROUTE.CREATE}/${customerId}`;
    
    describeAuthErrorTests(
      txnRoute,
      (route, status, tokenInfo) => createRequest.post(route, { password: MOCK_USER_ADMIN.userName }, status, tokenInfo),
      expectResponse
    );

    describeValidationCustIdTest(
      `${ROUTE.CREATE}/invalid-id`,
      (route, status, tokenInfo) => createRequest.post(route, MOCK_CREATE_TRANSACTION, status, tokenInfo),
      expectResponse
    );

    describeValidationErrorTests(
      {
        route: txnRoute,
        validBody: MOCK_CREATE_TRANSACTION,
        requestFn: createRequest.post,
        includeInvalidLogicTest: true
      },
      expectResponse
    );

    describe("Success Cases", () => {
      test("should create transaction successfully", async() => {
        mockStartSession();
        mockUserFindOne();
        mockTransactionFindOne();

        const response = await createRequest.post(
          txnRoute,
          MOCK_CREATE_TRANSACTION,
          HTTP_STATUS.CREATED
        );

        expectResponse.created(response);
        expect(mockSession.startTransaction).toHaveBeenCalled();
        expect(mockSession.commitTransaction).toHaveBeenCalled();
        expect(mockSession.endSession).toHaveBeenCalled();
      });

      test("should call getDateAfterMonths with 3 months when refill is true", async() => {
        mockStartSession();
        mockUserFindOne();
        mockTransactionFindOne();

        await createRequest.post(
          txnRoute,
          MOCK_REFILL_TRANSACTION,
          HTTP_STATUS.CREATED
        );

        expect(spy).toHaveBeenCalledWith(expect.any(Date), 3);
        expect(spy).toHaveBeenCalledTimes(1);
      });

      test("should call getDateAfterMonths with 1 month when extend is true", async() => {
        mockStartSession();
        mockUserFindOne();
        mockTransactionFindOne("expiry");
        mockCustFindOneAndUpdate();

        await createRequest.post(
          txnRoute,
          MOCK_EXTEND_TRANSACTION,
          HTTP_STATUS.CREATED
        );

        expect(spy).toHaveBeenCalledWith(expect.any(Date), 1);
        expect(spy).toHaveBeenCalledTimes(1);
      });

      test("should not call getDateAfterMonths when both refill and extend are false", async() => {
        mockStartSession();
        mockUserFindOne();
        mockTransactionFindOne();

        await createRequest.post(
          txnRoute,
          MOCK_CREATE_TRANSACTION,
          HTTP_STATUS.CREATED
        );

        expect(spy).not.toHaveBeenCalled();
      });
    });
    
    describe("Validate Customer Extension", () => {
      test("should return conflict if customer extendedTimes more than 3", async() => {
        mockStartSession();
        mockUserFindOne();
        mockTransactionFindOne("expiry");
        mockCustFindOneAndUpdate(null);

        const response = await createRequest.post(
          txnRoute,
          MOCK_EXTEND_TRANSACTION,
          HTTP_STATUS.CONFLICT
        );

        expectResponse.conflict(response, RESPONSE_MESSAGE.EXTENSION_LIMIT);
      });
    });

    describe("Not Found Cases", () => {
      test("should return not found when customer does not exist", async() => {
        mockStartSession();
        mockUserFindOne();
        mockTransactionFindOne("null");

        const response = await createRequest.post(
          txnRoute,
          MOCK_CREATE_TRANSACTION,
          HTTP_STATUS.NOT_FOUND
        );

        expectResponse.notFound(response);
      });
    });

    describeServerErrorTests(
      {
        route: txnRoute,
        requestFn: createRequest.post,
        requestBody: MOCK_EXTEND_TRANSACTION,
        dbErrorCases: [
          {
            name: "User.findOne",
            mockFn: User.findOne as jest.Mock
          },
          {
            name: "Transaction.findOne",
            mockFn: Transaction.findOne as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
              mockTransactionFindOne("error");
            },
            includeAbortTransactionTest: true
          },
          {
            name: "Customer.findOneAndUpdate",
            mockFn: Customer.findOneAndUpdate as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
              mockTransactionFindOne("expiry");
            },
            includeAbortTransactionTest: true
          }
        ]
      },
      expectResponse
    );
  });
});