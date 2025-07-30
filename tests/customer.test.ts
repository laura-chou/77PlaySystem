import { HTTP_STATUS, RESPONSE_MESSAGE } from "../src/common/constants";
import Customer from "../src/models/customer.model";
import User from "../src/models/user.model";

import { ROUTE, MOCK_CUSTOMER_DATA } from "./fixtures/customer";
import { createRequest, expectResponse } from "./fixtures/testUtils";
import { MOCK_ADMIN_DATA } from "./fixtures/user";

jest.mock("../src/models/user.model", () => ({
  findOne: jest.fn(),
  updateOne: jest.fn()
}));

jest.mock("../src/models/customer.model", () => ({
  aggregate: jest.fn()
}));

describe("Customer API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(`GET ${ROUTE.BASE}`, () => {
    describe("Success Cases", () => {
      test("should return all customer with valid JWT", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
        (Customer.aggregate as jest.Mock).mockResolvedValue(MOCK_CUSTOMER_DATA);

        const response = await createRequest.get(ROUTE.BASE, HTTP_STATUS.OK);
        expectResponse.success(response, MOCK_CUSTOMER_DATA);
      });
    });

    describe("Authentication Error Cases", () => {
      test("should fail if no JWT is provided", async () => {
        const tokenInfo = { showToken: false };
        const response = await createRequest.get(ROUTE.BASE, HTTP_STATUS.UNAUTHORIZED, tokenInfo);
        expectResponse.unauthorized(response, "No auth token");
      });

      test("should fail if JWT is invalid", async () => {
        const tokenInfo = { isInvalid: true };
        const response = await createRequest.get(ROUTE.BASE, HTTP_STATUS.UNAUTHORIZED, tokenInfo);
        expectResponse.unauthorized(response, "jwt malformed");
      });

      test("should fail if JWT is expired", async () => {
        const tokenInfo = { isExpired: true };
        const response = await createRequest.get(ROUTE.BASE, HTTP_STATUS.UNAUTHORIZED, tokenInfo);
        expectResponse.unauthorized(response, "jwt expired");
      });

      test("should fail if Customer in JWT does not exist", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
      
        const tokenInfo = { existUser: false };
        const response = await createRequest.get(ROUTE.BASE, HTTP_STATUS.UNAUTHORIZED, tokenInfo);
        expectResponse.unauthorized(response, RESPONSE_MESSAGE.USER_NOT_EXIST);
      });
    });

    describe("Server Error Cases", () => {
      test("should return 500 if User.findOne throws error", async () => {
        (User.findOne as jest.Mock).mockRejectedValue(new Error("DB Error"));
        
        const response = await createRequest.get(ROUTE.BASE, HTTP_STATUS.SERVER_ERROR);
        expectResponse.error(response);
      });

      test("should return 500 if Customer.find throws error", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
        (Customer.aggregate as jest.Mock).mockRejectedValue(new Error("DB Error"));

        const response = await createRequest.get(ROUTE.BASE, HTTP_STATUS.SERVER_ERROR);
        expectResponse.error(response);
      });
    });
  });
});