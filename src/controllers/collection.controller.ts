import { Request, Response } from "express";
import mongoose from "mongoose";

import { responseHandler } from "../common/response";
import { setFunctionName } from "../common/utils";
import { LOG_LEVEL, LOG_MESSAGE, setLog } from "../core/logger";

import * as baseController from "./base.controller";

export const clearCollection = setFunctionName(
  async(request: Request, response: Response): Promise<void> => {
    try {
      const collectionName = request.params.name;

      const collections = await mongoose.connection.db?.listCollections().toArray();
      const exists = collections?.some(col => col.name === collectionName);

      if (!exists) {
        setLog(LOG_LEVEL.ERROR, LOG_MESSAGE.ERROR.NOTFOUND, clearCollection.name);
        responseHandler.notFound(response);
        return;
      }

      await mongoose.connection.db?.collection(collectionName).deleteMany({});
      responseHandler.success(response);
    } catch (error) {
      baseController.errorHandler(response, error, clearCollection.name);
    }
  },
  "clearCollection"
);