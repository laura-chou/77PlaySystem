import mongoose from "mongoose";

import { HTTP_STATUS } from "../src/common/constants";
import Customer from "../src/models/customer.model";
import ServiceType from "../src/models/serviceType.model";
import Transaction from "../src/models/transaction.model";
import User from "../src/models/user.model";

import { ROUTE, MOCK_CUSTOMER, MOCK_CUSTOMERS, MOCK_UPDATE_DATA, MOCK_CREATE_DATA, MOCK_ID } from "./fixtures/customerTestConfig";
import { describeValidationCustIdTest, describeAuthErrorTests, describeValidationErrorTests, describeServerErrorTests } from "./fixtures/testStructures";
import { createRequest, expectResponse, mockSession, mockUserFindOne } from "./fixtures/testUtils";

const customerId = MOCK_CUSTOMER[0].custId;

jest.mock("../src/models/user.model", () => ({
  findOne: jest.fn(),
  updateOne: jest.fn()
}));

jest.mock("../src/models/customer.model", () => ({
  aggregate: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn()
}));

jest.mock("../src/models/serviceType.model", () => ({
  findOne: jest.fn()
}));

jest.mock("../src/models/transaction.model", () => ({
  create: jest.fn()
}));

const mockCustAggregate = (data: Array<object>): void => {
  (Customer.aggregate as jest.Mock).mockResolvedValue(data);
};

const mockCustFindOne = (data: object | null = null): void => {
  (Customer.findOne as jest.Mock).mockResolvedValue(data);
};

const mockCustCreate = (): void => {
  (Customer.create as jest.Mock).mockResolvedValue([MOCK_ID]);
};

const mockTxnCreate = (): void => {
  (Transaction.create as jest.Mock).mockResolvedValue([MOCK_ID]);
};

const mockServiceTypeFindOne = (): void => {
  (ServiceType.findOne as jest.Mock).mockResolvedValue(MOCK_ID);
};

describe("Customer API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mongoose.startSession = jest.fn().mockResolvedValue(mockSession);
  });

  describe(`GET ${ROUTE.CUSTOMER}`, () => {
    describeAuthErrorTests(
      ROUTE.CUSTOMER,
      (route, status, tokenInfo) => createRequest.get(route, status, tokenInfo),
      expectResponse
    );

    describe("Success Cases", () => {
      test("should return all customer with valid JWT", async () => {
        mockUserFindOne();
        mockCustAggregate(MOCK_CUSTOMERS);

        const response = await createRequest.get(ROUTE.CUSTOMER, HTTP_STATUS.OK);
        expectResponse.success(response, MOCK_CUSTOMERS);
      });
    });

    describeServerErrorTests(
      {
        route: ROUTE.CUSTOMER,
        requestFn: createRequest.get,
        dbErrorCases: [
          {
            name: "User.findOne",
            mockFn: User.findOne as jest.Mock
          },
          {
            name: "Customer.aggregate",
            mockFn: Customer.aggregate as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
            }
          }
        ]
      },
      expectResponse
    );
  });

  describe(`GET ${ROUTE.CUSTOMER}/:custId`, () => {
    const customerRoute = `${ROUTE.CUSTOMER}/${customerId}`;

    describeValidationCustIdTest(
      `${ROUTE.CUSTOMER}/invalid-id`,
      (route, status, tokenInfo) => createRequest.get(route, status, tokenInfo),
      expectResponse
    );

    describeAuthErrorTests(
      customerRoute,
      (route, status, tokenInfo) => createRequest.get(route, status, tokenInfo),
      expectResponse
    );

    describe("Success Cases", () => {
      test("should return customer information with valid JWT", async () => {
        mockUserFindOne();
        mockCustAggregate(MOCK_CUSTOMER);

        const response = await createRequest.get(
          customerRoute,
          HTTP_STATUS.OK);
        expectResponse.success(response, MOCK_CUSTOMER);
      });

      test("should return no data when customer does not exist", async () => {
        mockUserFindOne();
        mockCustAggregate([]);

        const response = await createRequest.get(
          customerRoute,
          HTTP_STATUS.OK);
        expectResponse.noData(response);
      });
    });

    describeServerErrorTests(
      {
        route: customerRoute,
        requestFn: createRequest.get,
        dbErrorCases: [
          {
            name: "User.findOne",
            mockFn: User.findOne as jest.Mock
          },
          {
            name: "Customer.aggregate",
            mockFn: Customer.aggregate as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
            }
          }
        ]
      },
      expectResponse
    );
  });

  describe(`POST ${ROUTE.CREATE}`, () => {
    describeAuthErrorTests(
      ROUTE.CREATE,
      (route, status, tokenInfo) => createRequest.post(route, MOCK_CREATE_DATA, status, tokenInfo),
      expectResponse
    );

    describeValidationErrorTests(
      {
        route: ROUTE.CREATE,
        validBody: MOCK_CREATE_DATA,
        requestFn: createRequest.post
      },
      expectResponse
    );

    describe("Validate Customer Existence", () => {
      test("should return conflict if customer already exists", async () => {
        mockUserFindOne();
        mockCustFindOne(MOCK_ID);

        const response = await createRequest.post(
          ROUTE.CREATE,
          MOCK_CREATE_DATA,
          HTTP_STATUS.CONFLICT
        );

        expectResponse.conflict(response);
      });
    });

    describe("Success Cases", () => {
      test("should create customer successfully with transaction", async () => {
        (mongoose.startSession as jest.Mock).mockResolvedValue(mockSession);

        mockUserFindOne();
        mockCustFindOne();
        mockServiceTypeFindOne();
        mockCustCreate();
        mockTxnCreate();

        const response = await createRequest.post(
          ROUTE.CREATE,
          MOCK_CREATE_DATA,
          HTTP_STATUS.CREATED
        );

        expectResponse.created(response);
        expect(mockSession.startTransaction).toHaveBeenCalled();
        expect(mockSession.commitTransaction).toHaveBeenCalled();
        expect(mockSession.endSession).toHaveBeenCalled();
      });
    });

    describeServerErrorTests(
      {
        route: ROUTE.CREATE,
        requestFn: createRequest.post,
        requestBody: MOCK_CREATE_DATA,
        dbErrorCases: [
          {
            name: "User.findOne",
            mockFn: User.findOne as jest.Mock
          },
          {
            name: "ServiceType.findOne",
            mockFn: ServiceType.findOne as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
            },
            includeAbortTransactionTest: true
          },
          {
            name: "Customer.create",
            mockFn: Customer.create as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
              mockServiceTypeFindOne();
            },
            includeAbortTransactionTest: true
          },
          {
            name: "Transaction.create",
            mockFn: Transaction.create as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
              mockServiceTypeFindOne();
              mockCustCreate();
            },
            includeAbortTransactionTest: true
          }
        ]
      },
      expectResponse
    );
  });

  describe(`PATCH ${ROUTE.UPDATE}/:custId`, () => {
    const customerRoute = `${ROUTE.UPDATE}/${customerId}`;

    describeValidationCustIdTest(
      `${ROUTE.UPDATE}/invalid-id`,
      (route, status, tokenInfo) =>
        createRequest.patch(route, MOCK_UPDATE_DATA, status, tokenInfo),
      expectResponse
    );

    describeAuthErrorTests(
      customerRoute,
      (route, status, tokenInfo) => createRequest.patch(route, MOCK_UPDATE_DATA, status, tokenInfo),
      expectResponse
    );

    describeValidationErrorTests(
      {
        route: customerRoute,
        validBody: MOCK_UPDATE_DATA,
        requestFn: createRequest.patch
      },
      expectResponse
    );

    describe("Success Cases", () => {
      test("should update customer information successfully", async () => {
        mockUserFindOne();

        const response = await createRequest.patch(
          customerRoute,
          MOCK_UPDATE_DATA,
          HTTP_STATUS.OK
        );

        expectResponse.updated(response);
      });
    });

    describeServerErrorTests(
      {
        route: customerRoute,
        requestFn: createRequest.patch,
        requestBody: MOCK_UPDATE_DATA,
        dbErrorCases: [
          {
            name: "User.findOne",
            mockFn: User.findOne as jest.Mock
          },
          {
            name: "Customer.findByIdAndUpdate",
            mockFn: Customer.findByIdAndUpdate as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
            }
          }
        ]
      },
      expectResponse
    );
  });
});