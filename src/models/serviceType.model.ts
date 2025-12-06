import "dotenv/config";

import { Model, model, Schema } from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { isNullOrEmpty } from "../common/utils";

interface IServiceType{
  serviceName: string;
}

if (isNullOrEmpty(process.env.COLLECTION_SERVICETYPE)) {
  throw new Error(RESPONSE_MESSAGE.ENV_ERROR);
}

const serviceTypeSchema = new Schema<IServiceType>({
  serviceName: { 
    type: String,
    required: true
  }
}, {
  versionKey: false,
  collection: process.env.COLLECTION_SERVICETYPE
});

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const ServiceType: Model<IServiceType> = model(process.env.COLLECTION_SERVICETYPE!, serviceTypeSchema);

export default ServiceType;
