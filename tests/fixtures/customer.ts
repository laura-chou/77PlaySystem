const base = "/customer";

export const ROUTE = {
  BASE: `${base}`
} as const;

export const MOCK_CUSTOMER_DATA= [
  {
    _id: "a1b2c3def",
    custName: "customer1",
    expiryDate: "2025-06-15T24:06:11+08:00"
  },
  {
    _id: "g4h5i6jkf",
    custName: "customer2",
    expiryDate: "2025-07-31T24:06:11+08:00"
  }
];
