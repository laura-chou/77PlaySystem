import { Types } from "mongoose";

import { ICustomer } from "../../src/models/customer.model";

const base = "/customer";

export const ROUTE = {
  CUSTOMER: `${base}`,
  CREATE: `${base}/create`,
  UPDATE: `${base}/update`
} as const;

enum ActionType {
  Name = "name",
  Extend = "extend",
  Charge = "charge",
  Refill = "refill"
}

type UpdateCustModel = {
  action: ActionType;
  custId: string;
  custName: string;
  amount: number;
};

type CreateCustModel = {
  custName: string;
  amount: number;
  createDate?: string;
}

interface CustListItem {
  custId: string;
  custName: string;
  expiryDate: string;
}

interface CustHistoryItem {
  serviceName: string;
  amount: number;
  currentBalance: number;
  spendDate: string;
  expiryDate: string;
}

interface CustTransaction {
  custId: string;
  custName: string;
  extendedTimes: number;
  createDate: string;
  history: CustHistoryItem[];
}

interface IdOnlyItem {
  _id: string;
}

export const MOCK_UPDATE_NAME: UpdateCustModel = { 
  action: ActionType.Name,
  custId: "507f1f77bcf86cd799439011",
  custName: "updateName",
  amount: 2000
};

export const MOCK_UPDATE_EXTEND: UpdateCustModel = { 
  action: ActionType.Extend,
  custId: "507f1f77bcf86cd799439011",
  custName: "custName",
  amount: 2000
};

export const MOCK_UPDATE_CHARGE: UpdateCustModel = { 
  action: ActionType.Charge,
  custId: "507f1f77bcf86cd799439011",
  custName: "custName",
  amount: 2000
};

export const MOCK_UPDATE_REFILL: UpdateCustModel = { 
  action: ActionType.Refill,
  custId: "507f1f77bcf86cd799439011",
  custName: "custName",
  amount: 1500
};

export const MOCK_CREATE_DATA: CreateCustModel = { 
  custName: "createName",
  amount: 1500,
  createDate: "2025-07-02 19:00"
};

export const MOCK_CUSTOMERS: CustListItem[] = [
  {
    custId: "507f1f77bcf86cd799439011",
    custName: "customer1",
    expiryDate: "2025/10/01"
  },
  {
    custId: "507f1f77bcf86cd799439022",
    custName: "customer2",
    expiryDate: "2025/07/31"
  }
];

export const MOCK_CUSTOMER_WITH_HISTORY: CustTransaction[] = [
  {
    custId: "507f1f77bcf86cd799439011",
    custName: "customer1",
    extendedTimes: 0,
    createDate: "2025/07/01",
    history: [
      {
        serviceName: "桌遊",
        amount: -200,
        currentBalance: 1300,
        spendDate: "2025/07/10",
        expiryDate: "2025/10/01"
      },
      {
        serviceName: "桌遊",
        amount: 1500,
        currentBalance: 1500,
        spendDate: "2025/07/01",
        expiryDate: "2025/10/01"
      }
    ]
  }
];

export const MOCK_ID: IdOnlyItem = {
  _id: "507f1f77bcf86cd799439011"
};

export const MOCK_CUSTOMER_INFO: ICustomer = {
  custName: "customerName",
  serviceTypes: [new Types.ObjectId("507f1f77bcf86cd799439022")],
  extendedTimes: 0,
  createDate: new Date("2025-09-30"),
};