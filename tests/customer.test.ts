import { ROUTE, MOCK_CUSTOMER_DATA, MOCK_CUSTOMERS_DATA } from "./fixtures/customer";
import { describeSuccessTests, describeAuthErrorTests, describeServerErrorTests } from "./fixtures/testStructures";
import { createRequest, expectResponse } from "./fixtures/testUtils";
import { MOCK_ADMIN_DATA } from "./fixtures/user";

jest.mock("../src/models/user.model");
jest.mock("../src/models/customer.model");

describe("Customer API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(`GET ${ROUTE.CUSTOMER}`, () => {
    describeSuccessTests(
      ROUTE.CUSTOMER,
      MOCK_ADMIN_DATA,
      MOCK_CUSTOMERS_DATA,
      createRequest.get,
      expectResponse
    );

    describeAuthErrorTests(
      ROUTE.CUSTOMER,
      createRequest.get,
      expectResponse
    );

    describeServerErrorTests(
      ROUTE.CUSTOMER,
      MOCK_ADMIN_DATA,
      createRequest.get,
      expectResponse
    );
  });

  describe(`GET ${ROUTE.CUSTOMER}/:custId`, () => {
    const customerId = MOCK_CUSTOMER_DATA[0].custId;
    const customerRoute = `${ROUTE.CUSTOMER}/${customerId}`;

    describeSuccessTests(
      customerRoute,
      MOCK_ADMIN_DATA,
      MOCK_CUSTOMER_DATA,
      createRequest.get,
      expectResponse
    );

    describeAuthErrorTests(
      customerRoute,
      createRequest.get,
      expectResponse
    );

    describeServerErrorTests(
      customerRoute,
      MOCK_ADMIN_DATA,
      createRequest.get,
      expectResponse
    );
  });
});