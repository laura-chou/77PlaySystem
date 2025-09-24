import { NextFunction, Request, Response } from "express";
import moment from "moment-timezone";

export const isJestTest: boolean = typeof jest !== "undefined";

export const getNowDate = (dateStr?: string): Date => {
  return dateStr
    ? moment.tz(dateStr.replace(/\//g, "-"), "Asia/Taipei").toDate()
    : moment().tz("Asia/Taipei").toDate();
};

export const getDateAfterMonths = (nowDate: Date, months: number): Date => {
  const taipeiDate = moment.tz(nowDate, "Asia/Taipei").add(months, "months"); 
  const currentYear = moment.tz("Asia/Taipei").year();

  if (taipeiDate.year() < currentYear) {
    taipeiDate.year(currentYear);
  }

  return taipeiDate.toDate();
};

export const isExpiry = (expiryDate: Date): boolean => {
  return moment.tz("Asia/Taipei").isSameOrAfter(expiryDate);
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

export const isTypeDate = (value: string): boolean => {
  return moment(value).isValid();
};

export const setFunctionName = <T extends (
  request: Request,
  response: Response,
  next?: NextFunction) => void> (fn: T, name: string): T => {
  Object.defineProperty(fn, "name", { value: name });
  return fn;
};
