import "dotenv/config";

import { Model, model, Schema, Types } from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { isNullOrEmpty } from "../common/utils";

export interface ICustomer {
  custName: string;
  serviceTypes: Array<Types.ObjectId>;
  createDate: Date;
  extendedTimes?: number;
}

if (isNullOrEmpty(process.env.COLLECTION_CUSTOMER)) {
  throw new Error(RESPONSE_MESSAGE.ENV_ERROR);
}

const custSchema = new Schema<ICustomer>({
  custName: {
    type: String,
    required: true,
    unique: true
  },
  serviceTypes: {
    type: [Types.ObjectId],
    required: true
  },
  extendedTimes: {
    type: Number,
    required: true,
    default: 0
  },
  createDate: {
    type: Date,
    required: true
  }
}, {
  versionKey: false,
  collection: process.env.COLLECTION_CUSTOMER
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const Customer: Model<ICustomer> = model(process.env.COLLECTION_CUSTOMER!, custSchema);

export default Customer;