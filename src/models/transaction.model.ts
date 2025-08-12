import "dotenv/config";

import { Document, Model, model, Schema, Types } from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { isNullOrEmpty } from "../common/utils";

interface ITransaction extends Document {
  customerId: Types.ObjectId;
  serviceTypeId: Types.ObjectId;
  amount: number;
  currentBalance: number;
  spendDate: Date;
  expiryDate: Date;
}

const txnSchema = new Schema<ITransaction>({
  customerId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  serviceTypeId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currentBalance: {
    type: Number,
    required: true
  },
  spendDate: {
    type: Date,
    required: true
  },
  expiryDate: {
    type: Date,
    required: true
  }
}, {
  versionKey: false,
  collection: "transaction"
});

if (isNullOrEmpty(process.env.COLLECTION_TRANSACTION)) {
  throw new Error(RESPONSE_MESSAGE.ENV_ERROR);
}

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const Transaction: Model<ITransaction> = model(process.env.COLLECTION_TRANSACTION!, txnSchema);

export default Transaction;