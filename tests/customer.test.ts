import { HTTP_STATUS, RESPONSE_MESSAGE } from "../src/common/constants";
import Customer from "../src/models/customer.model";
import User from "../src/models/user.model";

import { ROUTE, MOCK_CUSTOMER_DATA, MOCK_CUSTOMERS_DATA } from "./fixtures/customer";
import { describeCustIdValidationTest, describeAuthErrorTests, describeValidationErrorTests, describeServerErrorTests } from "./fixtures/testStructures";
import { createRequest, expectResponse } from "./fixtures/testUtils";
import { MOCK_ADMIN_DATA } from "./fixtures/user";

jest.mock("../src/models/user.model", () => ({
  findOne: jest.fn(),
  updateOne: jest.fn()
}));

jest.mock("../src/models/customer.model", () => ({
  aggregate: jest.fn(),
  findByIdAndUpdate: jest.fn()
}));

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
        (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
        (Customer.aggregate as jest.Mock).mockResolvedValue(MOCK_CUSTOMERS_DATA);

        const response = await createRequest.get(ROUTE.CUSTOMER, HTTP_STATUS.OK);
        expectResponse.success(response, MOCK_CUSTOMERS_DATA);
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
              (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
            }
          }
        ]
      },
      expectResponse
    );
  });

  describe(`GET ${ROUTE.CUSTOMER}/:custId`, () => {
    describeCustIdValidationTest(
      `${ROUTE.CUSTOMER}/invalid-id`,
      (route, status, tokenInfo) => createRequest.get(route, status, tokenInfo),
      expectResponse
    );
    
    describeAuthErrorTests(
      `${ROUTE.CUSTOMER}/${MOCK_CUSTOMER_DATA[0].custId}`,
      (route, status, tokenInfo) => createRequest.get(route, status, tokenInfo),
      expectResponse
    );

    describe("Success Cases", () => {
      test("should return customer information with valid JWT", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
        (Customer.aggregate as jest.Mock).mockResolvedValue(MOCK_CUSTOMER_DATA);

        const response = await createRequest.get(
          `${ROUTE.CUSTOMER}/${MOCK_CUSTOMER_DATA[0].custId}`,
          HTTP_STATUS.OK);
        expectResponse.success(response, MOCK_CUSTOMER_DATA);
      });

      test("should return no data when customer does not exist", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
        (Customer.aggregate as jest.Mock).mockResolvedValue([]);
    
        const response = await createRequest.get(
          `${ROUTE.CUSTOMER}/${MOCK_CUSTOMER_DATA[0].custId}`,
          HTTP_STATUS.OK);
        expectResponse.noData(response);
      });
    });

    describeServerErrorTests(
      {
        route: `${ROUTE.CUSTOMER}/${MOCK_CUSTOMER_DATA[0].custId}`,
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
              (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
            }
          }
        ]
      },
      expectResponse
    );
  });

  describe(`PATCH ${ROUTE.UPDATE_CUSTOMER}/:custId`, () => {
    const customerId = MOCK_CUSTOMER_DATA[0].custId;
    const customerRoute = `${ROUTE.UPDATE_CUSTOMER}/${customerId}`;

    describeCustIdValidationTest(
      `${ROUTE.UPDATE_CUSTOMER}/invalid-id`,
      (route, status, tokenInfo) =>
        createRequest.patch(route, { custName: "updateName" }, status, tokenInfo),
      expectResponse
    );

    describeAuthErrorTests(
      customerRoute,
      (route, status, tokenInfo) => createRequest.patch(route, { custName: "updateName" }, status, tokenInfo),
      expectResponse
    );

    describeValidationErrorTests(
      {
        route: customerRoute,
        validBody: { custName: "updateName" },
        requestFn: createRequest.patch
      },
      expectResponse
    );

    describe("Success Cases", () => {
      test("should update customer information successfully", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);

        const response = await createRequest.patch(
          customerRoute,
          { custName: "updateName" },
          HTTP_STATUS.OK
        );
        expect(response.body).toEqual({
          status: HTTP_STATUS.OK,
          message: RESPONSE_MESSAGE.SUCCESS
        });
      });
    });

    describeServerErrorTests(
      {
        route: customerRoute,
        requestFn: createRequest.patch,
        requestBody: { custName: "updateName" },
        dbErrorCases: [
          {
            name: "User.findOne",
            mockFn: User.findOne as jest.Mock
          },
          {
            name: "Customer.findByIdAndUpdate",
            mockFn: Customer.findByIdAndUpdate as jest.Mock,
            setupMocks: (): void => {
              (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
            }
          }
        ]
      },
      expectResponse
    );
  });
});