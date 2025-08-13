import { HTTP_STATUS } from "../src/common/constants";
import Customer from "../src/models/customer.model";
import User from "../src/models/user.model";

import { ROUTE, MOCK_CUSTOMER, MOCK_CUSTOMERS, MOCK_UPDATE_DATA } from "./fixtures/customerTestConfig";
import { describeValidationCustIdTest, describeAuthErrorTests, describeValidationErrorTests, describeServerErrorTests } from "./fixtures/testStructures";
import { createRequest, expectResponse, mockUserFindOne } from "./fixtures/testUtils";

const customerId = MOCK_CUSTOMER[0].custId;

jest.mock("../src/models/user.model", () => ({
  findOne: jest.fn(),
  updateOne: jest.fn()
}));

jest.mock("../src/models/customer.model", () => ({
  aggregate: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));

const mockCustAggregate = (data: Array<object>): void => {
  (Customer.aggregate as jest.Mock).mockResolvedValue(data);
};

describe("Customer API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  describe(`PATCH ${ROUTE.UPDATE_CUSTOMER}/:custId`, () => {
    const customerRoute = `${ROUTE.UPDATE_CUSTOMER}/${customerId}`;

    describeValidationCustIdTest(
      `${ROUTE.UPDATE_CUSTOMER}/invalid-id`,
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