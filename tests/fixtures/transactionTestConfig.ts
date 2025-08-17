const base = "/transaction";

export const ROUTE = {
  CREATE: `${base}/create`
} as const;

type TransactionInput = {
  amount: number;
  refill: boolean;
  extend: boolean;
  createDate?: string;
}

interface LatestTransaction {
  customerId: string;
  serviceTypeId: string;
  amount: number;
  currentBalance: number;
  expiryDate: Date;
  spendDate: Date;
}

export const MOCK_CREATE_TRANSACTION: TransactionInput = { 
  amount: -200,
  refill: false,
  extend: false,
  createDate: "2025-07-02 19:00"
};

export const MOCK_EXTEND_TRANSACTION: TransactionInput = { 
  amount: 200,
  refill: false,
  extend: true,
  createDate: "2025-07-02 19:00"
};

export const MOCK_REFILL_TRANSACTION: TransactionInput = { 
  amount: 1500,
  refill: true,
  extend: false,
  createDate: "2025-07-02 19:00"
};

export const MOCK_LATEST_TRANSACTION_EXPIRED: LatestTransaction = {
  customerId: "507f1f77bcf86cd799439011",
  serviceTypeId: "507f1f77bcf86cd799439022",
  amount: 1500,
  currentBalance: 2800,
  expiryDate: new Date("2024-09-30"),
  spendDate: new Date("2024-06-30")
};

export const MOCK_LATEST_TRANSACTION_NOT_EXPIRED: LatestTransaction = {
  customerId: "507f1f77bcf86cd799439011",
  serviceTypeId: "507f1f77bcf86cd799439022",
  amount: 1500,
  currentBalance: 2800,
  expiryDate: new Date("2125-09-30"),
  spendDate: new Date("2125-06-30")
};





