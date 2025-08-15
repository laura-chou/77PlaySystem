const base = "/user";

export const ROUTE = {
  LOGIN: `${base}/login`,
  CREATE: `${base}/create`
} as const;

type PostModel = Record<string, unknown> & {
  password: string;
}

interface UserInfoModel {
  userName: string;
  password: string;
  token: string;
}

export const MOCK_ADMIN: UserInfoModel = { 
  userName: "testuser",
  password: "$2b$10$19l0oH5kUuLaxRlX.IVCEuOaKptCPyyVV.9jxPlhKER8cot4oNUHi",
  token: "token"
};

export const MOCK_EXIST_USER: PostModel = {
  password: MOCK_ADMIN.userName
};

export const MOCK_NOTEXIST_USER: PostModel = { 
  password: "not exist"
};

