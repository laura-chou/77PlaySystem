const base = "/customer";

export const ROUTE = {
  CUSTOMER: `${base}`,
  CREATE: `${base}/create`,
  UPDATE: `${base}/update`
} as const;

export const MOCK_UPDATE_DATA = { 
  custName: "updateName"
};

export const MOCK_CREATE_DATA = { 
  custName: "createName",
  amount: 1500
};

export const MOCK_CUSTOMERS = [
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


export const MOCK_CUSTOMER= [
  {
    custId: "507f1f77bcf86cd799439011",
    custName: "customer1",
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
