const base = "/transaction";

export const ROUTE = {
  CREATE: `${base}/create`
} as const;

type TransactionInput = {
  amount: number;
  refill: boolean;
}

interface LatestTransaction {
  customerId: string;
  serviceTypeId: string;
  amount: number;
  currentBalance: number;
  expiryDate: string;
  spendDate: string;
}

export const MOCK_CREATE_TRANSACTION: TransactionInput = { 
  amount: -100,
  refill: false
};

export const MOCK_LATEST_TRANSACTION: LatestTransaction[] = [
  {
    customerId: "507f1f77bcf86cd799439011",
    serviceTypeId: "507f1f77bcf86cd799439022",
    amount: 1500,
    currentBalance: 2800,
    expiryDate: "2025-09-30",
    spendDate: "2025-06-30"
  }
];

