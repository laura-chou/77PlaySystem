import request from "supertest";
import users from "../src/models/user.model";
import app from "../src/app";
import { HTTP_STATUS, RESPONSE_MESSAGE } from "../src/common/constants";
import { ROUTE, MOCK_DATA, MOCK_INCORRECT_PASSWORD_DATA } from "./fixtures/user";
import { createRequest, expectResponse } from "./fixtures/testUtils";

jest.mock("../src/models/user.model", () => ({
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
}));

describe("User API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(`POST ${ROUTE.LOGIN}`, () => {
    describe("Success Cases", () => {
      test("should login successfully and return a token", async () => {
        (users.findOne as jest.Mock).mockResolvedValue(MOCK_DATA);
    
        const res = await request(app)
          .post(ROUTE.LOGIN)
          .send({
            password: MOCK_DATA.userCode
          });
    
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty("token");
      });
    });

    describe("Authentication Error Cases", () => {
      test("should fail if user does not exist", async () => {
        (users.findOne as jest.Mock).mockResolvedValue(null);
    
        const res = await request(app)
          .post(ROUTE.LOGIN)
          .send({
            password: "userCode",
          });
    
        expect(res.statusCode).toBe(401);
        expect(res.body).not.toHaveProperty("token");
      });
    
      it("should fail if password is incorrect", async () => {
        (users.findOne as jest.Mock).mockResolvedValue(MOCK_INCORRECT_PASSWORD_DATA);

        const res = await request(app)
          .post(ROUTE.LOGIN)
          .send({
            password: MOCK_INCORRECT_PASSWORD_DATA.userCode,
          });
    
        expect(res.statusCode).toBe(401);
        expect(res.body).not.toHaveProperty("token");
      });
    });

    describe("Validation Error Cases", () => {
      test.each([
        ["invalid Content-Type", { password: MOCK_DATA.userCode }, false, RESPONSE_MESSAGE.INVALID_CONTENT_TYPE],
        ["missing key in JSON body", { userCode: "userCode" }, true, RESPONSE_MESSAGE.INVALID_JSON_KEY],
        ["invalid data type", { password: 123456 }, true, RESPONSE_MESSAGE.INVALID_JSON_FORMAT]
      ])("should bad request for %s", async (_, requestBody, isSetJson, expectedMessage) => {
        const response = await createRequest.post(ROUTE.LOGIN, requestBody, HTTP_STATUS.BAD_REQUEST, isSetJson);

        expectResponse.badRequest(response, expectedMessage);
      });
    });
  });

  



});