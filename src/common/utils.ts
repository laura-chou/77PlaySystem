import { NextFunction, Request, Response } from "express";
import moment from "moment-timezone";

export const isJestTest: boolean = typeof jest !== "undefined";

export const getNowDate = (): string => {
  return moment().tz("Asia/Taipei").format();
};

export const isNullOrEmpty = (value: string | null | undefined): boolean => {
  if (value == null) {
    return true;
  }
  if (!isTypeString(value)) {
    return false ;
  }
  return value.trim().length === 0;
};

export const isTypeInteger = (value: unknown): boolean => {
  return Number.isInteger(value);
};

export const isTypeString = (value: unknown): boolean => {
  return typeof value === "string";
};

export const isTypeBoolean = (value: unknown): boolean => {
  return typeof value === "boolean";
};

export const convertToBool = (value: string | undefined): boolean => {
  if (!value) {
    return false;
  }
  return value.toLowerCase() === "true" || value === "1";
};

export const setFunctionName = <T extends (
  request: Request,
  response: Response,
  next?: NextFunction) => void> (fn: T, name: string): T => {
  Object.defineProperty(fn, "name", { value: name });
  return fn;
};