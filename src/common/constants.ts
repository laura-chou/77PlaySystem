export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  SERVER_ERROR: 500
} as const;

export const CONTENT_TYPE = {
  JSON: "application/json",
  JSON_WITH_CHARSET: /application\/json/,
  TEXT: "text/html",
  TEXT_WITH_CHARSET: /text\/html/,
  FORM_URLENCODED: "application/x-www-form-urlencoded"
} as const;

export const RESPONSE_MESSAGE = {
  SUCCESS: "",
  NOT_FOUND: "No data found.",
  SERVER_ERROR: "Internal server error.",
  WRONG_PASSWORD: "Wrong password.",
  INVALID_CONTENT_TYPE: "Invalid content type.",
  INVALID_JSON_KEY: "Invalid JSON key.",
  INVALID_JSON_FORMAT: "Invalid JSON format.",
  ENV_ERROR: "Environment variable is not setting.",
  FORBIDDEN_CORS: "Forbidden: CORS policy does not allow access from this origin.",
  USER_NOT_EXIST: "User does not exist.",
  TOKEN_EXPIRED: "Token expired.",
  INVALID_CUSTID: "Invalid Customer ID format.",
  INVALID_LOGIC: "Invalid logic in request.",
  DATA_ALREADY_EXISTS: "This record already exists.",
  EXTENSION_LIMIT: "The maximum number of extensions has been reached."
} as const;