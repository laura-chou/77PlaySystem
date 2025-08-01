import "dotenv/config";

import { Document, Model, model, Schema } from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { isNullOrEmpty } from "../common/utils";

interface ICustomer extends Document {
  custName: string;
  serviceTypes: Array<number>;
  createDate: Date;
}

const custSchema = new Schema<ICustomer>({
  custName: {
    type: String,
    required: true,
    unique: true
  },
  serviceTypes: {
    type: [Number],
    required: true
  },
  createDate: {
    type: Date,
    required: true
  }
}, {
  versionKey: false,
  collection: "customer"
});

if (isNullOrEmpty(process.env.COLLECTION_CUSTOMER)) {
  throw new Error(RESPONSE_MESSAGE.ENV_ERROR);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const Customer: Model<ICustomer> = model(process.env.COLLECTION_CUSTOMER!, custSchema);

export default Customer;