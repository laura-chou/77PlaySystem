import { HTTP_STATUS } from "../src/common/constants";
import User from "../src/models/user.model";

import { describeAuthErrorTests, describeServerErrorTests, describeValidationErrorTests } from "./fixtures/testStructures";
import { createRequest, expectResponse, mockUserFindOne } from "./fixtures/testUtils";
import { ROUTE, MOCK_USER_ADMIN, MOCK_NOTEXIST_USER, MOCK_EXIST_USER } from "./fixtures/userTestConfig";

jest.mock("../src/models/user.model", () => ({
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  create: jest.fn(),
  UserRole: {
    ADMIN: "admin"
  }
}));

describe("User API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe(`POST ${ROUTE.LOGIN}`, () => {
    describe("Success Cases", () => {
      test("should login successfully and return a token", async () => {
        mockUserFindOne();

        const response = await createRequest.post(
          ROUTE.LOGIN,
          {
            password: MOCK_USER_ADMIN.userName
          },
          HTTP_STATUS.OK
        );
        expect(response.statusCode).toBe(200);
        expect(response.body.data).toHaveProperty("token");
      });
    });

    describe("Authentication Error Cases", () => {
      test("should fail if user does not exist", async () => {
        mockUserFindOne(null);
        
        const response = await createRequest.post(
          ROUTE.LOGIN,
          MOCK_NOTEXIST_USER,
          HTTP_STATUS.UNAUTHORIZED
        );
    
        expectResponse.unauthorized(response);
      });

      it("should fail if password is incorrect", async () => {
        mockUserFindOne(MOCK_USER_ADMIN);

        const response = await createRequest.post(
          ROUTE.LOGIN,
          MOCK_NOTEXIST_USER,
          HTTP_STATUS.UNAUTHORIZED
        );

        expectResponse.unauthorized(response);
      });
    });

    describeValidationErrorTests(
      {
        route: ROUTE.LOGIN,
        validBody: MOCK_EXIST_USER,
        requestFn: createRequest.post
      },
      expectResponse
    );

    describeServerErrorTests(
      {
        route: ROUTE.LOGIN,
        requestFn: createRequest.post,
        requestBody: MOCK_EXIST_USER,
        dbErrorCases: [
          {
            name: "User.findOne",
            mockFn: User.findOne as jest.Mock
          }
        ]
      },
      expectResponse
    );
  });

  describe(`POST ${ROUTE.CREATE}`, () => {
    describeAuthErrorTests(
      ROUTE.CREATE,
      (route, status, tokenInfo) => createRequest.post(route, MOCK_EXIST_USER, status, tokenInfo),
      expectResponse
    );

    describeValidationErrorTests(
      {
        route: ROUTE.CREATE,
        validBody: MOCK_EXIST_USER,
        requestFn: createRequest.post
      },
      expectResponse
    );

    describe("Success Cases", () => {
      test("should create user successfully", async () => {
        (User.findOne as jest.Mock)
          .mockImplementationOnce(() => Promise.resolve(MOCK_USER_ADMIN)) // 第一次
          .mockImplementationOnce(() => Promise.resolve(null));

        const response = await createRequest.post(
          ROUTE.CREATE,
          MOCK_NOTEXIST_USER,
          HTTP_STATUS.CREATED
        );

        expectResponse.created(response);
      });
    });

    describeServerErrorTests(
      {
        route: ROUTE.CREATE,
        requestFn: createRequest.post,
        requestBody: MOCK_EXIST_USER,
        dbErrorCases: [
          {
            name: "first User.findOne",
            mockFn: User.findOne as jest.Mock
          },
          {
            name: "second User.findOne",
            mockFn: User.findOne as jest.Mock,
            setupMocks: (): void => {
              mockUserFindOne();
            }
          },
          {
            name: "User.create",
            mockFn: User.create as jest.Mock,
            setupMocks: (): void => {
              (User.findOne as jest.Mock)
                .mockImplementationOnce(() => Promise.resolve(MOCK_USER_ADMIN)) // 第一次
                .mockImplementationOnce(() => Promise.resolve(null));
            }
          }
        ]
      },
      expectResponse
    );
  });
});