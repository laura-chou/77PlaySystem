
import { HTTP_STATUS, RESPONSE_MESSAGE } from "../src/common/constants";
import User from "../src/models/user.model";

import { describeAuthErrorTests, describeServerErrorTests, describeValidationErrorTests } from "./fixtures/testStructures";
import { createRequest, expectResponse, mockUserFindOne } from "./fixtures/testUtils";
import { ROUTE, MOCK_ADMIN_DATA, MOCK_INCORRECT_PASSWORD_DATA } from "./fixtures/userTestConfig";

jest.mock("../src/models/user.model", () => ({
  findOne: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  updateOne: jest.fn(),
  create: jest.fn()
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
        mockUserFindOne(null);
        
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
        mockUserFindOne(MOCK_INCORRECT_PASSWORD_DATA);

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

    describeValidationErrorTests(
      {
        route: ROUTE.LOGIN,
        validBody: { password: MOCK_ADMIN_DATA.userName },
        requestFn: createRequest.post
      },
      expectResponse
    );

    describeServerErrorTests(
      {
        route: ROUTE.LOGIN,
        requestFn: createRequest.post,
        requestBody: { password: MOCK_ADMIN_DATA.userName },
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
      (route, status, tokenInfo) => createRequest.post(route, { password: MOCK_ADMIN_DATA.userName }, status, tokenInfo),
      expectResponse
    );

    describeValidationErrorTests(
      {
        route: ROUTE.CREATE,
        validBody: { password: MOCK_ADMIN_DATA.userName },
        requestFn: createRequest.post
      },
      expectResponse
    );

    describe("Success Cases", () => {
      test("should create user successfully", async () => {
        mockUserFindOne();

        const response = await createRequest.post(
          ROUTE.CREATE,
          { password: "newUser" },
          HTTP_STATUS.CREATED
        );
        expect(response.body).toEqual({
          status: HTTP_STATUS.CREATED,
          message: RESPONSE_MESSAGE.SUCCESS
        });
      });
    });

    describeServerErrorTests(
      {
        route: ROUTE.CREATE,
        requestFn: createRequest.post,
        requestBody: { password: MOCK_ADMIN_DATA.userName },
        dbErrorCases: [
          {
            name: "User.findOne",
            mockFn: User.findOne as jest.Mock
          },
          {
            name: "User.create",
            mockFn: User.create as jest.Mock,
            setupMocks: (): void => {
              (User.findOne as jest.Mock).mockResolvedValue(MOCK_ADMIN_DATA);
            }
          }
        ]
      },
      expectResponse
    );
  });
});