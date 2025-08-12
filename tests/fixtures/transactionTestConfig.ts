const base = "/transaction";

export const ROUTE = {
  CREATE: `${base}/create`
} as const;


export const MOCK_LASTEST_TRANSACTION = [
  {
    customerId: "507f1f77bcf86cd799439011",
    serviceTypeId: "507f1f77bcf86cd799439022",
    amount: 1500,
    currentBalance: 2800,
    expiryDate: "2025-09-30",
    spendDate: "2025-06-30"
  }
];

