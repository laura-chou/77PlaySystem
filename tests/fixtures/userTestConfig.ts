const base = "/user";

export const ROUTE = {
  LOGIN: `${base}/login`,
  CREATE: `${base}/create`,
  LOGOUT: `${base}/logout`
} as const;

type LoginRequest = {
  account: string;
  password: string;
  userRole?: string;
}

interface UserAuthInfo {
  _id: string;
  userName: string;
  userRole: string;
  password: string;
  token: string;
}

export const MOCK_USER_ADMIN: UserAuthInfo = {
  _id: "507f1f77bcf86cd799439012",
  userName: "testuser",
  userRole: "user",
  password: "$2b$12$DlEWSRXNIK0PgqYeRTj14eLwUpAiwo09/ofV0bcKhw0YMS58GGQiy",
  token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoidGVzdHVzZXIiLCJpYXQiOjE3NjM0MDIyNzd9.ObH_7KNAR9PdJAqTYP0PtGEsv-8YM3vM98g5CSHis2A"
};

export const MOCK_EXIST_USER: LoginRequest = {
  account: MOCK_USER_ADMIN.userName,
  password: "111111"
};

export const MOCK_NOTEXIST_USER: LoginRequest = { 
  account: "not exist user",
  password: "password"
};

