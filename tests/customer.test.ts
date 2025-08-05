import { HTTP_STATUS, RESPONSE_MESSAGE } from "../src/common/constants";
import Customer from "../src/models/customer.model";
import User from "../src/models/user.model";

import { ROUTE, MOCK_CUSTOMER_DATA, MOCK_CUSTOMERS_DATA } from "./fixtures/customer";
import { describeSuccessTests, describeAuthErrorTests, describeServerErrorTests, describeCustIdValidationTest } from "./fixtures/testStructures";
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

    describeCustIdValidationTest(
      ROUTE.CUSTOMER,
      MOCK_ADMIN_DATA,
      createRequest.get,
      expectResponse
    );
  });

  describe(`PATCH ${ROUTE.UPDATE_CUSTOMER}/:custId`, () => {
    const customerId = MOCK_CUSTOMER_DATA[0].custId;
    const customerRoute = `${ROUTE.UPDATE_CUSTOMER}/${customerId}`;

    describeAuthErrorTests(
      customerRoute,
      (route, status, tokenInfo) =>
        createRequest.patch(route, { password: MOCK_ADMIN_DATA.userName }, status, tokenInfo),
      expectResponse
    );

    describeCustIdValidationTest(
      ROUTE.UPDATE_CUSTOMER,
      MOCK_ADMIN_DATA,
      (route, status, tokenInfo) =>
        createRequest.patch(route, { custName: "updatedName" }, status, tokenInfo),
      expectResponse
    );

    describe("Validation Error Cases", () => {
      test.each([
        ["invalid Content-Type", { custName: "updateName" }, false, RESPONSE_MESSAGE.INVALID_CONTENT_TYPE],
        ["missing key in JSON body", { custNameCode: "updateName" }, true, RESPONSE_MESSAGE.INVALID_JSON_KEY],
        ["invalid data type", { custName: 123456 }, true, RESPONSE_MESSAGE.INVALID_JSON_FORMAT]
      ])("should bad request for %s", async (_, requestBody, isSetJson, expectedMessage) => {
        (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);

        const response = await createRequest.patch(customerRoute, requestBody, HTTP_STATUS.BAD_REQUEST, {}, isSetJson);
        expectResponse.badRequest(response, expectedMessage);
      });
    });

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

    describe("Server Error Cases", () => {
      test("should return 500 if User.findOne throws error", async () => {
        (User.findOne as jest.Mock).mockRejectedValue(new Error("DB Error"));
        
        const response = await createRequest.patch(
          customerRoute,
          { custName: "updateName" },
          HTTP_STATUS.SERVER_ERROR
        );
        expectResponse.error(response);
      });

      test("should return 500 if Customer.findByIdAndUpdate throws error", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
        (Customer.findByIdAndUpdate as jest.Mock).mockRejectedValue(new Error("DB Error"));
        
        const response = await createRequest.patch(
          customerRoute,
          { custName: "updateName" },
          HTTP_STATUS.SERVER_ERROR
        );
        expectResponse.error(response);
      });
    });
  });
});