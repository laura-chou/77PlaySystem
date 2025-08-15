const base = "/customer";

export const ROUTE = {
  CUSTOMER: `${base}`,
  CREATE: `${base}/create`,
  UPDATE: `${base}/update`
} as const;

type UpdateCustModel = {
  custName?: string;
};

type CreateCustModel = {
  custName: string;
  amount: number;
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
  createDate: string;
  history: CustHistoryItem[];
}

interface IdOnlyItem {
  _id: string;
}

export const MOCK_UPDATE_DATA: UpdateCustModel = { 
  custName: "updateName"
};

export const MOCK_CREATE_DATA: CreateCustModel = { 
  custName: "createName",
  amount: 1500
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

export const MOCK_CUSTOMER: CustTransaction[] = [
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

export const MOCK_ID: IdOnlyItem = {
  _id: "507f1f77bcf86cd799439011"
};
