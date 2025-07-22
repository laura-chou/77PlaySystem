import request from "supertest";
import users from "../src/models/user.model";
import app from "../src/app";
import jwt from "jsonwebtoken";
import { HTTP_STATUS, RESPONSE_MESSAGE } from "../src/common/constants";
import { ROUTE, MOCK_ADMIN_DATA, MOCK_USER_DATA,MOCK_INCORRECT_PASSWORD_DATA } from "./fixtures/user";
import { createRequest, expectResponse } from "./fixtures/testUtils";

jest.mock("../src/models/user.model", () => ({
  find: jest.fn(),
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
        (users.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
    
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
        (users.find as jest.Mock).mockResolvedValue(MOCK_USER_DATA);
        (users.findOne as jest.Mock).mockReturnValue({
          select: () => ({
            lean: () : Promise<typeof MOCK_ADMIN_DATA> => Promise.resolve(MOCK_ADMIN_DATA)
          })
        });

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
  });
});