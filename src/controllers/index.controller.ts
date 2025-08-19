import { Request, Response } from "express";

export const getResponse = (_: Request, response: Response): void => {
  response.send("OK");
};