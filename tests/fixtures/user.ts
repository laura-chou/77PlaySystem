export const ROUTE = {
  BASE: "/user",
  LOGIN: "/user/action"
} as const;

export const MOCK_DATA =  { userCode: "testuser", password: "$2b$10$19l0oH5kUuLaxRlX.IVCEuOaKptCPyyVV.9jxPlhKER8cot4oNUHi", };

export const MOCK_INCORRECT_PASSWORD_DATA =  { userCode: "testuser", password: "password", };