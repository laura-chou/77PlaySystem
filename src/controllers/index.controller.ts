import { Request, Response } from "express";

import { HTTP_STATUS } from "../common/constants";

export const getResponse = (_: Request, response: Response): void => {
  response.status(HTTP_STATUS.OK).send();
};