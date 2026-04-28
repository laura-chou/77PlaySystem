import { HTTP_STATUS, RESPONSE_MESSAGE } from "../src/common/constants";
import * as utils from "../src/common/utils";
import Customer, { ICustomer } from "../src/models/customer.model";
import ServiceType from "../src/models/serviceType.model";
import Transaction from "../src/models/transaction.model";
import User from "../src/models/user.model";

import { ROUTE, MOCK_CUSTOMER_WITH_HISTORY, MOCK_CUSTOMERS, MOCK_CUSTOMER_INFO, MOCK_CREATE_DATA, MOCK_ID, 
  MOCK_UPDATE_NAME, MOCK_UPDATE_EXTEND, MOCK_UPDATE_CHARGE, MOCK_UPDATE_REFILL } from "./fixtures/customerTestConfig";
import { describeValidationCustIdTest, describeAuthErrorTests, describeReqBodyValidationTests, describeServerErrorTests } from "./fixtures/testStructures";
import { createRequest, expectResponse, mockSession, mockStartSession, mockUserFindOne, mockTransactionFindOne } from "./fixtures/testUtils";

const customerId = MOCK_CUSTOMER_WITH_HISTORY[0].custId;
let spy: jest.SpyInstance;

jest.mock("../src/models/user.model", () => ({
  findOne: jest.fn(),
  updateOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  UserRole: {
    ADMIN: "admin"
  }
}));

jest.mock("../src/models/customer.model", () => ({
  aggregate: jest.fn(),
  findOneAndUpdate: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findById: jest.fn(),
  deleteOne: jest.fn()
}));

jest.mock("../src/models/serviceType.model", () => ({
  findOne: jest.fn()
}));

jest.mock("../src/models/transaction.model", () => ({
  create: jest.fn(),
  findOne: jest.fn(),
  deleteMany: jest.fn()
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

const mockCustFindOneAndUpdate = (data: ICustomer | null = MOCK_CUSTOMER_INFO): void => {
  (Customer.findOneAndUpdate as jest.Mock).mockResolvedValueOnce(data);
};

const mockCustFindById = (data: object | null = MOCK_CUSTOMER_INFO): void => {
  const mock = (Customer.findById as jest.Mock);
  mock.mockReturnValue({
    session: jest.fn().mockResolvedValue(data)
  });
};

const mockCustDeleteOne = (): void => {
  const mock = (Customer.deleteOne as jest.Mock);
  mock.mockReturnValue({
    session: jest.fn().mockResolvedValue({})
  });
};

const mockTransactionDeleteMany = (): void => {
  const mock = (Transaction.deleteMany as jest.Mock);
  mock.mockReturnValue({
    session: jest.fn().mockResolvedValue({})
  });
};

const mockServiceTypeFindOne = (): void => {
  (ServiceType.findOne as jest.Mock).mockResolvedValue(MOCK_ID);
};

describe("Customer API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    mockStartSession();
    spy = jest.spyOn(utils, "getDateAfterMonths").mockReturnValue(new Date("2025-08-12T16:47:39"));
  });

  afterEach(() => {
    spy.mockRestore();
  });

  describe(`GET ${ROUTE.CUSTOMER}`, () => {
    describeAuthErrorTests(
      ROUTE.CUSTOMER,
      (route, status, tokenInfo) => createRequest.get(route, status, tokenInfo),
      expectResponse
    );

    describe("Success Cases", () => {
      test("should return all customer with valid JWT", async() => {
        mockUserFindOne();
        mockCustAggregate(MOCK_CUSTOMERS);

        const response = await createRequest.get(ROUTE.CUSTOMER, HTTP_STATUS.OK);
        expectResponse.success(response, MOCK_CUSTOMERS);
      });

      test("should return empty data when no customers found", async() => {
        mockUserFindOne();
        mockCustAggregate([]);

        const response = await createRequest.get(ROUTE.CUSTOMER, HTTP_STATUS.OK);
        expectResponse.success(response, []);
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
      test("should return customer information with valid JWT", async() => {
        mockUserFindOne();
        mockCustAggregate(MOCK_CUSTOMER_WITH_HISTORY);

        const response = await createRequest.get(
          customerRoute,
          HTTP_STATUS.OK);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        expectResponse.success(response, MOCK_CUSTOMER_WITH_HISTORY.at(0)!);
      });
    });

    describe("Not Found Cases", () => {
      test("should return not found when customer does not exist", async() => {
        mockUserFindOne();
        mockCustAggregate([]);

        const response = await createRequest.get(
          customerRoute,
          HTTP_STATUS.NOT_FOUND);

        expectResponse.notFound(response);
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

    describeReqBodyValidationTests(
      {
        route: ROUTE.CREATE,
        validBody: MOCK_CREATE_DATA,
        requestFn: createRequest.post
      },
      expectResponse
    );

    describe("Validate Customer Existence", () => {
      test("should return conflict if customer already exists", async() => {
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
      test("should create customer successfully with transaction", async() => {
        mockStartSession();
        mockUserFindOne();
        mockCustFindOne();
        mockServiceTypeFindOne();
        mockCustCreate();

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

  describe(`DELETE ${ROUTE.CUSTOMER}/:custId`, () => {
    const customerRoute = `${ROUTE.CUSTOMER}/${customerId}`;

    describeValidationCustIdTest(
      `${ROUTE.CUSTOMER}/invalid-id`,
      (route, status, tokenInfo) => createRequest.delete(route, status, tokenInfo),
      expectResponse
    );

    describeAuthErrorTests(
      customerRoute,
      (route, status, tokenInfo) => createRequest.delete(route, status, tokenInfo),
      expectResponse
    );

    describe("Success Cases", () => {
      test("should delete customer successfully", async() => {
        mockUserFindOne();
        mockCustFindById();
        mockCustDeleteOne();
        mockTransactionDeleteMany();

        const response = await createRequest.delete(
          customerRoute,
          HTTP_STATUS.OK
        );

        expectResponse.success(response);
        expect(mockSession.startTransaction).toHaveBeenCalled();
        expect(mockSession.commitTransaction).toHaveBeenCalled();
        expect(mockSession.endSession).toHaveBeenCalled();
      });
    });

    describe("Not Found Cases", () => {
      test("should return 404 when customer does not exist", async() => {
        mockUserFindOne();
        mockCustFindById(null);

        const response = await createRequest.delete(
          customerRoute,
          HTTP_STATUS.NOT_FOUND
        );

        expectResponse.notFound(response);
        expect(mockSession.abortTransaction).toHaveBeenCalled();
      });
    });

    describeServerErrorTests(
      {
        route: customerRoute,
        requestFn: createRequest.delete,
        dbErrorCases: [
          {
            name: "User.findOne",
            mockFn: User.findOne as jest.Mock
          },
          {
            name: "Customer.findById",
            mockFn: Customer.findById as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
            },
            mockErrorFn: (mockFn): void => {
              mockFn.mockReturnValue({
                session: jest.fn().mockRejectedValue(new Error("DB Error"))
              });
            },
            includeAbortTransactionTest: true
          },
          {
            name: "Customer.deleteOne",
            mockFn: Customer.deleteOne as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
              mockCustFindById();
            },
            mockErrorFn: (mockFn): void => {
              mockFn.mockReturnValue({
                session: jest.fn().mockRejectedValue(new Error("DB Error"))
              });
            },
            includeAbortTransactionTest: true
          },
          {
            name: "Transaction.deleteMany",
            mockFn: Transaction.deleteMany as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
              mockCustFindById();
              mockCustDeleteOne();
            },
            mockErrorFn: (mockFn): void => {
              mockFn.mockReturnValue({
                session: jest.fn().mockRejectedValue(new Error("DB Error"))
              });
            },
            includeAbortTransactionTest: true
          }
        ]
      },
      expectResponse
    );
  });

  describe(`PATCH ${ROUTE.UPDATE}`, () => {
    const customerRoute = ROUTE.UPDATE;

    describeAuthErrorTests(
      customerRoute,
      (route, status, tokenInfo) => createRequest.patch(route, MOCK_UPDATE_NAME, status, tokenInfo),
      expectResponse
    );

    describeReqBodyValidationTests(
      {
        route: customerRoute,
        validBody: MOCK_UPDATE_NAME,
        requestFn: createRequest.patch
      },
      expectResponse
    );

    describe("Success Cases", () => {
      test("should succeed when the action is 'name'", async() => {
        mockUserFindOne();
        mockCustFindOneAndUpdate();

        const response = await createRequest.patch(
          customerRoute,
          MOCK_UPDATE_NAME,
          HTTP_STATUS.OK
        );

        expectResponse.updated(response);
      });

      test("should succeed when the action is 'extend'", async() => {
        mockUserFindOne();
        mockTransactionFindOne("expiry");
        mockCustFindOneAndUpdate();

        const response = await createRequest.patch(
          customerRoute,
          MOCK_UPDATE_EXTEND,
          HTTP_STATUS.OK
        );

        expectResponse.updated(response);
        expect(mockSession.startTransaction).toHaveBeenCalled();
        expect(mockSession.commitTransaction).toHaveBeenCalled();
        expect(mockSession.endSession).toHaveBeenCalled();
      });

      test("should succeed when the action is 'charge'", async() => {
        mockUserFindOne();
        mockTransactionFindOne();

        const response = await createRequest.patch(
          customerRoute,
          MOCK_UPDATE_CHARGE,
          HTTP_STATUS.OK
        );

        expectResponse.updated(response);
      });

      test("should succeed when the action is 'refill'", async() => {
        mockUserFindOne();
        mockTransactionFindOne();

        const response = await createRequest.patch(
          customerRoute,
          MOCK_UPDATE_REFILL,
          HTTP_STATUS.OK
        );

        expectResponse.updated(response);
      });

      test("should call getDateAfterMonths with 3 month when amount reaches 1200", async() => {
        mockUserFindOne();
        mockTransactionFindOne("expiry");

        await createRequest.patch(
          customerRoute,
          { ...MOCK_UPDATE_REFILL, amount: 1200 },
          HTTP_STATUS.OK
        );

        expect(spy).toHaveBeenCalledWith(expect.any(Date), 3);
        expect(spy).toHaveBeenCalledTimes(1);
      });
    });

    describe("Validate Customer Extension", () => {
      test("should return conflict if customer extendedTimes more than 3", async() => {
        mockUserFindOne();
        mockTransactionFindOne("expiry");
        mockCustFindOneAndUpdate(null);

        const response = await createRequest.patch(
          customerRoute,
          MOCK_UPDATE_EXTEND,
          HTTP_STATUS.CONFLICT
        );

        expectResponse.conflict(response, RESPONSE_MESSAGE.EXTENSION_LIMIT);
      });
    });

    describe("Not Found Cases", () => {
      test("should return 404 when customer does not exist and action is 'name'", async() => {
        mockUserFindOne();
        mockCustFindOneAndUpdate(null);

        const response = await createRequest.patch(
          customerRoute,
          MOCK_UPDATE_NAME,
          HTTP_STATUS.NOT_FOUND
        );

        expectResponse.notFound(response);
      });

      test("should return 404 when customer does not exist and action is 'extend'", async() => {
        mockUserFindOne();
        mockTransactionFindOne("null");

        const response = await createRequest.patch(
          customerRoute,
          MOCK_UPDATE_EXTEND,
          HTTP_STATUS.NOT_FOUND
        );

        expectResponse.notFound(response);
      });

      test("should return 404 when customer does not exist and action is 'charge'", async() => {
        mockUserFindOne();
        mockTransactionFindOne("null");

        const response = await createRequest.patch(
          customerRoute,
          MOCK_UPDATE_CHARGE,
          HTTP_STATUS.NOT_FOUND
        );

        expectResponse.notFound(response);
      });

      test("should return 404 when customer does not exist and action is 'refill'", async() => {
        mockUserFindOne();
        mockTransactionFindOne("null");

        const response = await createRequest.patch(
          customerRoute,
          MOCK_UPDATE_REFILL,
          HTTP_STATUS.NOT_FOUND
        );

        expectResponse.notFound(response);
      });
    });

    describeServerErrorTests(
      {
        route: ROUTE.UPDATE,
        requestFn: createRequest.patch,
        requestBody: MOCK_UPDATE_EXTEND,
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