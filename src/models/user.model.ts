import "dotenv/config";

import { Document, Model, model, Schema } from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { isNullOrEmpty } from "../common/utils";

interface IUser extends Document {
  userCode: string;
  password: string;
  userType: string;
  gameType: Array<number>;
  token: string;
  createDate: Date;
}

// export interface IUserTest {
//   userCode: number;
//   userType: string;
//   gameType: string;
//   createDate: Date;
// }

const userSchema = new Schema<IUser>({
  userCode: {
    type: String,
    required: true
  },
  password: {
    type: String
  },
  userType: {
    type: String,
    required: true
  },
  gameType: {
    type: [Number],
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
const users: Model<IUser> = model(process.env.COLLECTION_USER!, userSchema);

export default users;