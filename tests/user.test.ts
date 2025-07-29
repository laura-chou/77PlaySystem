import { HTTP_STATUS, RESPONSE_MESSAGE } from "../src/common/constants";
import User from "../src/models/user.model";

import { createRequest, expectResponse } from "./fixtures/testUtils";
import { ROUTE, MOCK_ADMIN_DATA, MOCK_INCORRECT_PASSWORD_DATA } from "./fixtures/user";

jest.mock("../src/models/user.model", () => ({
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn()
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
            password: MOCK_ADMIN_DATA.userName
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
            password: "userName",
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
            password: MOCK_INCORRECT_PASSWORD_DATA.userName,
          },
          HTTP_STATUS.UNAUTHORIZED
        );

        expectResponse.unauthorized(response);
      });
    });

    describe("Validation Error Cases", () => {
      test.each([
        ["invalid Content-Type", { password: MOCK_ADMIN_DATA.userName }, false, RESPONSE_MESSAGE.INVALID_CONTENT_TYPE],
        ["missing key in JSON body", { useuserNamerCode: "userName" }, true, RESPONSE_MESSAGE.INVALID_JSON_KEY],
        ["invalid data type", { password: 123456 }, true, RESPONSE_MESSAGE.INVALID_JSON_FORMAT]
      ])("should bad request for %s", async (_, requestBody, isSetJson, expectedMessage) => {
        const response = await createRequest.post(ROUTE.LOGIN, requestBody, HTTP_STATUS.BAD_REQUEST, isSetJson);
        expectResponse.badRequest(response, expectedMessage);
      });
    });

    describe("Server Error Cases", () => {
      test("should return 500 if User.findOne throws error", async () => {
        (User.findOne as jest.Mock).mockRejectedValue(new Error("DB Error"));
        
        const response = await createRequest.post(
          ROUTE.LOGIN,
          {
            password: MOCK_INCORRECT_PASSWORD_DATA.userName,
          },
          HTTP_STATUS.SERVER_ERROR
        );
        expectResponse.error(response);
      });
    });
  });
});