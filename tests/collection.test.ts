import mongoose from "mongoose";

import { HTTP_STATUS } from "../src/common/constants";
import User from "../src/models/user.model";

import { describeAuthErrorTests, describeServerErrorTests } from "./fixtures/testStructures";
import { createRequest, expectResponse, mockUserFindOne } from "./fixtures/testUtils";

jest.mock("../src/models/user.model", () => ({
  findOne: jest.fn(),
  updateOne: jest.fn(),
  UserRole: {
    ADMIN: "admin"
  }
}));

describe("Collection API", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("DELETE /collection/:name/clear", () => {
    const router = "/collection/testCollection/clear";

    describeAuthErrorTests(
      router,
      (route, status, tokenInfo) => createRequest.delete(route, status, tokenInfo),
      expectResponse
    );

    describe("Success Cases", () => {
      test("should clear collection if it exists", async () => {
        mockUserFindOne();

        const mockCollections = [{ name: "testCollection" }];
        const mockDeleteMany = jest.fn().mockResolvedValue({});

        (mongoose.connection.db as unknown) = {
          listCollections: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockCollections)
          }),
          collection: jest.fn().mockReturnValue({
            deleteMany: mockDeleteMany
          })
        };

        const response = await createRequest.delete(
            router,
            HTTP_STATUS.OK);

        expectResponse.updated(response);
      });
    });

    describe("Not Found Cases", () => {
      it("should return notFound if collection does not exist", async () => {
        const mockCollections = [{ name: "otherCollection" }];

        (mongoose.connection.db as unknown) = {
          listCollections: jest.fn().mockReturnValue({
            toArray: jest.fn().mockResolvedValue(mockCollections)
          })
        };

        const response = await createRequest.delete(
            router,
            HTTP_STATUS.NOT_FOUND);

        expectResponse.notFound(response);
      });
    });

    describeServerErrorTests(
      {
        route: router,
        requestFn: createRequest.delete,
        dbErrorCases: [
          {
            name: "User.findOne",
            mockFn: User.findOne as jest.Mock
          },
          {
            name: "mongoose.connection.db.listCollections",
            mockFn: jest.fn(),
            setupMocks: (): void => {
              mockUserFindOne();

              const toArrayMock = jest.fn().mockRejectedValue(new Error("DB error"));
              const listCollectionsMock = jest.fn().mockReturnValue({ toArray: toArrayMock });
              (mongoose.connection.db as unknown) = {
                listCollections: listCollectionsMock
              };
            }
          }
        ]
      },
      expectResponse
    );
  });
});