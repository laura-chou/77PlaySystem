export interface ICustomer {
    custId: string;
    custName: string;
    createDate: string;
    balance: number;
    balanceExpiryDate: string;
    history: ICustomerHistory[];
}

export interface ICustomerHistory {
    amount: number;
    currentBalance: number;
    expiryDate: string;
    serviceName: string;
    spendDate: string;
}

export interface INewCustomer {
    custName: string;
    createDate: string;
    amount: number;
}

export interface ICustomerFormData {
    custId: string;
    custName: string;
    createDate: string;
    balance: number;
    balanceExpiryDate: string;
}
