import "dotenv/config";

import { Model, model, Schema } from "mongoose";

import { RESPONSE_MESSAGE } from "../common/constants";
import { isNullOrEmpty } from "../common/utils";

interface IServiceType{
  serviceName: string;
}

const serviceTypeSchema = new Schema<IServiceType>({
  serviceName: { 
    type: String,
    required: true
  }
}, {
  versionKey: false,
  collection: "serviceType"
});

if (isNullOrEmpty(process.env.COLLECTION_SERVICETYPE)) {
  throw new Error(RESPONSE_MESSAGE.ENV_ERROR);
}

const ServiceType: Model<IServiceType> = model("ServiceType", serviceTypeSchema);

export default ServiceType;
