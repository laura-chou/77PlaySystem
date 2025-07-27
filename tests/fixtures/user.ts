const base = "/user";

export const ROUTE = {
  LOGIN: `${base}/login`,
  LIST: `${base}/list`
} as const;

export const MOCK_ADMIN_DATA =  { 
  userCode: "testuser",
  userType: "admin",
  password: "$2b$10$19l0oH5kUuLaxRlX.IVCEuOaKptCPyyVV.9jxPlhKER8cot4oNUHi",
  token: "token"
};

export const MOCK_USER_DATA= [
  { 
    userCode: "testuser2",
    userType: "member",
    password: "",
    token: ""
  },
  { 
    userCode: "testuser3",
    userType: "member",
    password: "",
    token: ""
  },
];

export const MOCK_INCORRECT_PASSWORD_DATA =  { userCode: "testuser", password: "password", };