import request from "supertest";
import users from "../src/models/user.model";
import app from "../src/app";
import { ROUTE, MOCK_DATA } from "./fixtures/user";

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

    // describe("Server Error Cases", () => {
    //   it("should fail if user does not exist", async () => {
    //     (users.findOne as jest.Mock).mockResolvedValue(null);
    
    //     const res = await request(app)
    //       .post("/user/login")
    //       .send({
    //         userCode: "notexist",
    //         password: "any",
    //       });
    
    //     expect(res.statusCode).toBe(401);
    //     expect(res.body).not.toHaveProperty("token");
    //   });
    
    //   it("should fail if password is incorrect", async () => {
    //     // 模擬 user 存在但密碼比對失敗
    //     (users.findOne as jest.Mock).mockResolvedValue({
    //       ...testUser,
    //       password: bcrypt.hashSync("otherpassword", 10),
    //     });
    
    //     const res = await request(app)
    //       .post("/user/login")
    //       .send({
    //         userCode: testUser.userCode,
    //         password: "wrongpassword",
    //       });
    
    //     expect(res.statusCode).toBe(401);
    //     expect(res.body).not.toHaveProperty("token");
    //   });
    // })

    // describe("Validation Error Cases", () => {  
    //   test("should fail if missing fields", async () => {
    //     const res = await request(app)
    //       .post("/user/login")
    //       .send({
    //         userCode: MOCK_DATA.userCode
    //       });

    //     expect(res.statusCode).toBe(400);
    //     expect(res.body).not.toHaveProperty("token");
    //   });

    //   test("should fail if Content-Type is not application/json", async () => {
    //     const res = await request(app)
    //       .post("/user/login")
    //       .set("Content-Type", "text/plain")
    //       .send("userCode=testuser&password=testpassword");

    //     expect(res.statusCode).toBe(415);
    //   });
    // })
  });

  



});