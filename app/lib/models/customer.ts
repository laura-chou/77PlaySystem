export enum ActionEnum {
    REFILL = 'refill',
    EXTEND = 'extend',
    CHARGE = 'charge',
    NAME = 'name'
}

export interface ICustomer {
    custId: string;
    custName: string;
    createDate: string;
    extendedTimes: number;
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
    action: ActionEnum;
    custId: string;
    custName: string;
    amount: number;
}
