const base = "/customer";

export const ROUTE = {
  BASE: `${base}`
} as const;

export const MOCK_CUSTOMER_DATA= [
  { 
    custName: "customer1",
    serviceType: [1]
  },
  { 
    custName: "customer2",
    serviceType: [1]
  },
];