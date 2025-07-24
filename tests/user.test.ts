import jwt from "jsonwebtoken";
import request from "supertest";

import app from "../src/app";
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
    
        const res = await request(app)
          .post(ROUTE.LOGIN)
          .send({
            password: MOCK_ADMIN_DATA.userCode
          });
    
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveProperty("token");
      });
    });

    describe("Authentication Error Cases", () => {
      test("should fail if user does not exist", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
    
        const res = await request(app)
          .post(ROUTE.LOGIN)
          .send({
            password: "userCode",
          });
    
        expect(res.statusCode).toBe(401);
        expect(res.body).not.toHaveProperty("token");
      });
    
      it("should fail if password is incorrect", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(MOCK_INCORRECT_PASSWORD_DATA);

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
        (User.find as jest.Mock).mockResolvedValue(MOCK_USER_DATA);
        (User.findOne as jest.Mock).mockReturnValue(MOCK_ADMIN_DATA);

        const token = jwt.sign(
          { user: MOCK_ADMIN_DATA.userCode },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          process.env.JWT_SECRET!,
          { expiresIn: "2h" }
        );
  
        const res = await request(app)
          .get(ROUTE.BASE)
          .set("Authorization", `Bearer ${token}`);
  
        expect(res.statusCode).toBe(200);
        expect(res.body.data).toEqual(MOCK_USER_DATA);
      });
    });

    describe("Authentication Error Cases", () => {
      test("should fail if no JWT is provided", async () => {
        const res = await request(app)
          .get(ROUTE.BASE);

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("No auth token");
      });

      test("should fail if JWT is invalid", async () => {
        const res = await request(app)
          .get(ROUTE.BASE)
          .set("Authorization", "Bearer invalidtoken");

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("jwt malformed");
      });

      test("should fail if JWT is expired", async () => {
        const expiredToken = jwt.sign(
          { user: MOCK_ADMIN_DATA.userCode },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          process.env.JWT_SECRET!,
          { expiresIn: -1 }
        );

        const res = await request(app)
          .get(ROUTE.BASE)
          .set("Authorization", `Bearer ${expiredToken}`);

        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe("jwt expired");
      });

      test("should fail if user in JWT does not exist", async () => {
        (User.findOne as jest.Mock).mockResolvedValue(null);
      
        const token = jwt.sign(
          { user: "notExistUser" },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          process.env.JWT_SECRET!,
          { expiresIn: "2h" }
        );
      
        const res = await request(app)
          .get(ROUTE.BASE)
          .set("Authorization", `Bearer ${token}`);
        
        expect(res.statusCode).toBe(401);
        expect(res.body.message).toBe(RESPONSE_MESSAGE.USER_NOT_EXIST);
      });
    });
  });
});