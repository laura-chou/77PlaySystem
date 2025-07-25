import { HTTP_STATUS, RESPONSE_MESSAGE } from "../src/common/constants";
import User from "../src/models/user.model";

import { createRequest, expectResponse } from "./fixtures/testUtils";
import { ROUTE, MOCK_ADMIN_DATA, MOCK_USER_DATA,MOCK_INCORRECT_PASSWORD_DATA } from "./fixtures/user";

jest.mock("../src/models/user.model", () => ({
  find: jest.fn(),
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  updateOne: jest.fn()
}));

describe("User API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(`POST ${ROUTE.LOGIN}`, () => {
    describe("Success Cases", () => {
      test("should login successfully and return a token", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
        
        const response = await createRequest.post(
          ROUTE.LOGIN,
          {
            password: MOCK_ADMIN_DATA.userCode
          },
          HTTP_STATUS.OK
        );
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveProperty("token");
      });
    });

    describe("Authentication Error Cases", () => {
      test("should fail if user does not exist", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
        
        const response = await createRequest.post(
          ROUTE.LOGIN,
          {
            password: "userCode",
          },
          HTTP_STATUS.UNAUTHORIZED
        );
    
        expectResponse.unauthorized(response);
      });
    
      it("should fail if password is incorrect", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(MOCK_INCORRECT_PASSWORD_DATA);

        const response = await createRequest.post(
          ROUTE.LOGIN,
          {
            password: MOCK_INCORRECT_PASSWORD_DATA.userCode,
          },
          HTTP_STATUS.UNAUTHORIZED
        );

        expectResponse.unauthorized(response);
      });
    });

    describe("Validation Error Cases", () => {
      test.each([
        ["invalid Content-Type", { password: MOCK_ADMIN_DATA.userCode }, false, RESPONSE_MESSAGE.INVALID_CONTENT_TYPE],
        ["missing key in JSON body", { userCode: "userCode" }, true, RESPONSE_MESSAGE.INVALID_JSON_KEY],
        ["invalid data type", { password: 123456 }, true, RESPONSE_MESSAGE.INVALID_JSON_FORMAT]
      ])("should bad request for %s", async (_, requestBody, isSetJson, expectedMessage) => {
        const response = await createRequest.post(ROUTE.LOGIN, requestBody, HTTP_STATUS.BAD_REQUEST, isSetJson);
        expectResponse.badRequest(response, expectedMessage);
      });
    });
  });

  describe(`GET ${ROUTE.BASE}`, () => {
    describe("Success Cases", () => {
      test("should return user list with valid JWT", async () => {
        (User.findOne as jest.Mock).mockReturnValue(MOCK_ADMIN_DATA);
        (User.find as jest.Mock).mockResolvedValue(MOCK_USER_DATA);

        const response = await createRequest.get(ROUTE.BASE, HTTP_STATUS.OK);
        expectResponse.success(response, MOCK_USER_DATA);
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

      test("should fail if user in JWT does not exist", async () => {
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

      test("should return 500 if User.find throws error", async () => {
        (User.findOne as jest.Mock).mockReturnValue(MOCK_ADMIN_DATA);
        (User.find as jest.Mock).mockRejectedValue(new Error("DB Error"));

        const response = await createRequest.get(ROUTE.BASE, HTTP_STATUS.SERVER_ERROR);
        expectResponse.error(response);
      });
    });
  });
});