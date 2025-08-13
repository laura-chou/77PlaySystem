import "dotenv/config";

import { Model, model, Schema } from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { isNullOrEmpty } from "../common/utils";

export interface IUser {
  userName: string;
  password: string;
  token?: string;
  createDate: Date;
}

const userSchema = new Schema<IUser>({
  userName: {
    type: String,
    required: true,
    unique: true
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
  collection: "user"
});

if (isNullOrEmpty(process.env.COLLECTION_USER)) {
  throw new Error(RESPONSE_MESSAGE.ENV_ERROR);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const User: Model<IUser> = model(process.env.COLLECTION_USER!, userSchema);

export default User;