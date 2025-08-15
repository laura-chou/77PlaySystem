const base = "/user";

export const ROUTE = {
  LOGIN: `${base}/login`,
  CREATE: `${base}/create`
} as const;

type LoginRequest = {
  password: string;
}

interface UserAuthInfo {
  userName: string;
  password: string;
  token: string;
}

export const MOCK_USER_ADMIN: UserAuthInfo = { 
  userName: "testuser",
  password: "$2b$10$19l0oH5kUuLaxRlX.IVCEuOaKptCPyyVV.9jxPlhKER8cot4oNUHi",
  token: "token"
};

export const MOCK_EXIST_USER: LoginRequest = {
  password: MOCK_USER_ADMIN.userName
};

export const MOCK_NOTEXIST_USER: LoginRequest = { 
  password: "not exist"
};

