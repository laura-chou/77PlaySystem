import { HTTP_STATUS } from "../src/common/constants";
import * as utils from "../src/common/utils";
import Transaction from "../src/models/transaction.model";
import User from "../src/models/user.model";

import { describeAuthErrorTests, describeCustIdValidationTest, describeServerErrorTests, describeValidationErrorTests } from "./fixtures/testStructures";
import { createRequest, expectResponse, mockUserFindOne } from "./fixtures/testUtils";
import { ROUTE, MOCK_LASTEST_TRANSACTION } from "./fixtures/transactionTestConfig";
import { MOCK_ADMIN } from "./fixtures/userTestConfig";

const customerId = MOCK_LASTEST_TRANSACTION[0].customerId;
let spy: jest.SpyInstance;

jest.mock("../src/models/user.model", () => ({
  findOne: jest.fn(),
  updateOne: jest.fn()
}));

jest.mock("../src/models/transaction.model", () => ({
  findOne: jest.fn(),
  create: jest.fn()
}));

describe("Transaction API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    spy = jest.spyOn(utils, "getThreeMonthsLater").mockReturnValue("2025-08-12T16:47:39");
  });

  afterEach(() => {
    spy.mockRestore();
  });

  describe(`POST ${ROUTE.CREATE}/:custId`, () => {
    const txnRoute = `${ROUTE.CREATE}/${customerId}`;
    
    describeAuthErrorTests(
      txnRoute,
      (route, status, tokenInfo) => createRequest.post(route, { password: MOCK_ADMIN.userName }, status, tokenInfo),
      expectResponse
    );

    describeCustIdValidationTest(
      `${ROUTE.CREATE}/invalid-id`,
      (route, status, tokenInfo) => createRequest.post(route, { amount: 100, refill: true }, status, tokenInfo),
      expectResponse
    );

    describeValidationErrorTests(
      {
        route: txnRoute,
        validBody: { amount: 100, refill: true },
        requestFn: createRequest.post,
        includeInvalidLogicTest: true
      },
      expectResponse
    );

    describe("Success Cases", () => {
      test("should create transaction successfully", async () => {
        mockUserFindOne();
        (Transaction.findOne as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue(MOCK_LASTEST_TRANSACTION[0])
        });

        const response = await createRequest.post(
          txnRoute,
          { amount: 100, refill: true },
          HTTP_STATUS.CREATED
        );

        expectResponse.created(response);
      });

      test("should return no data when customer does not exist", async () => {
        mockUserFindOne();
        (Transaction.findOne as jest.Mock).mockImplementationOnce(() => ({
          sort: jest.fn().mockResolvedValue(null)
        }));

        const response = await createRequest.post(
          txnRoute,
          { amount: 100, refill: true },
          HTTP_STATUS.OK
        );
        expectResponse.noData(response);
      });

      test("should call getThreeMonthsLater when refill is true", async () => {
        mockUserFindOne();
        (Transaction.findOne as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue(MOCK_LASTEST_TRANSACTION[0])
        });

        await createRequest.post(
          txnRoute,
          { amount: 100, refill: true },
          HTTP_STATUS.CREATED
        );

        expect(spy).toHaveBeenCalledTimes(1);
      });

      test("should call getThreeMonthsLater when refill is false", async () => {
        mockUserFindOne();
        (Transaction.findOne as jest.Mock).mockReturnValue({
          sort: jest.fn().mockResolvedValue(MOCK_LASTEST_TRANSACTION[0])
        });

        await createRequest.post(
          txnRoute,
          { amount: 100, refill: false },
          HTTP_STATUS.CREATED
        );

        expect(spy).not.toHaveBeenCalled();
      });
    });

    describeServerErrorTests(
      {
        route: txnRoute,
        requestFn: createRequest.post,
        requestBody: { amount: 100, refill: true },
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
              (Transaction.findOne as jest.Mock).mockImplementationOnce(() => ({
                sort: jest.fn().mockRejectedValue(new Error("DB Error"))
              }));
            }
          },
          {
            name: "Transaction.create",
            mockFn: Transaction.create as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
              (Transaction.findOne as jest.Mock).mockImplementationOnce(() => ({
                sort: jest.fn().mockResolvedValue(MOCK_LASTEST_TRANSACTION[0])
              }));
            }
          }
        ]
      },
      expectResponse
    );
  });
});