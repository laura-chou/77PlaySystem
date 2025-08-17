import { HTTP_STATUS } from "../src/common/constants";
import * as utils from "../src/common/utils";
import Transaction from "../src/models/transaction.model";
import User from "../src/models/user.model";

import { describeAuthErrorTests, describeValidationCustIdTest, describeServerErrorTests, describeValidationErrorTests } from "./fixtures/testStructures";
import { createRequest, expectResponse, mockUserFindOne } from "./fixtures/testUtils";
import { ROUTE, MOCK_LATEST_TRANSACTION, MOCK_CREATE_TRANSACTION } from "./fixtures/transactionTestConfig";
import { MOCK_USER_ADMIN } from "./fixtures/userTestConfig";

const customerId = MOCK_LATEST_TRANSACTION[0].customerId;
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

const mockTransactionFindOne = (type?: "null" | "error"): void => {
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

    default:
      mock.mockReturnValue({
        sort: jest.fn().mockResolvedValue(MOCK_LATEST_TRANSACTION[0]),
      });
      break;
  }
};

describe("Transaction API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    spy = jest.spyOn(utils, "getThreeMonthsLater").mockReturnValue(new Date("2025-08-12T16:47:39"));
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
      test("should create transaction successfully", async () => {
        mockUserFindOne();
        mockTransactionFindOne();

        const response = await createRequest.post(
          txnRoute,
          MOCK_CREATE_TRANSACTION,
          HTTP_STATUS.CREATED
        );

        expectResponse.created(response);
      });

      test("should call getThreeMonthsLater when refill is true", async () => {
        mockUserFindOne();
        mockTransactionFindOne();

        await createRequest.post(
          txnRoute,
          { amount: 100, refill: true },
          HTTP_STATUS.CREATED
        );

        expect(spy).toHaveBeenCalledTimes(1);
      });

      test("should call getThreeMonthsLater when refill is false", async () => {
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

    describe("Not Found Cases", () => {
      test("should return not found when customer does not exist", async () => {
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
        requestBody: MOCK_CREATE_TRANSACTION,
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
            }
          },
          {
            name: "Transaction.create",
            mockFn: Transaction.create as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
              mockTransactionFindOne();
            }
          }
        ]
      },
      expectResponse
    );
  });
});