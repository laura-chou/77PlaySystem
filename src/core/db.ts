import mongoose from "mongoose";

import { LOG_LEVEL, LOG_MESSAGE, RESPONSE_MESSAGE } from "../common/constants";
import { isNullOrEmpty } from "../common/utils";
import { setLog } from "./logger";

if (isNullOrEmpty(process.env.DBURL)) {
  throw new Error(RESPONSE_MESSAGE.ENV_ERROR);
}

export const connectDB = async (): Promise<void> => {
  try {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await mongoose.connect(process.env.DBURL!);
    setLog(LOG_LEVEL.INFO, "MongoDB connected successfully");
  } catch (error) {
    setLog(LOG_LEVEL.ERROR, `MongoDB connection error: 
      ${error instanceof Error ? error.message : LOG_MESSAGE.ERROR.UNKNOWN}`);
    process.exit(1);
  }
};
