import "dotenv/config";

import { Model, model, Schema } from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { isNullOrEmpty } from "../common/utils";

export enum UserRole {
  ADMIN = "admin",
  USER = "user"
}

export interface IUser {
  userName: string;
  userRole: UserRole;
  password: string;
  token?: string;
  createDate: Date;
}

if (isNullOrEmpty(process.env.COLLECTION_USER)) {
  throw new Error(RESPONSE_MESSAGE.ENV_ERROR);
}

const userSchema = new Schema<IUser>({
  userName: {
    type: String,
    required: true,
    unique: true
  },
  userRole: {
    type: String,
    required: true
  },
  password: {
    type: String,
    required: true
  },
  token: {
    type: String
  },
  createDate: {
    type: Date,
    required: true
  }
}, {
  versionKey: false,
  collection: process.env.COLLECTION_USER
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const User: Model<IUser> = model(process.env.COLLECTION_USER!, userSchema);

export default User;