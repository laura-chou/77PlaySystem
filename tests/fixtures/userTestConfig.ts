const base = "/user";

export const ROUTE = {
  LOGIN: `${base}/login`,
  CREATE: `${base}/create`
} as const;

export const MOCK_ADMIN = { 
  userName: "testuser",
  password: "$2b$10$19l0oH5kUuLaxRlX.IVCEuOaKptCPyyVV.9jxPlhKER8cot4oNUHi",
  token: "token"
};

export const MOCK_INCORRECT_PASSWORD = { 
  userName: "testuser",
  password: "incorrect password"
};