export const enum LOG_LEVEL {
  INFO = "info",
  ERROR = "error",
  WARN = "warn",
  HTTP = "http"
}

export const LOG_MESSAGE = {
  SUCCESS: "success",
  ERROR: {
    UNKNOWN: "unknown error"
  }
} as const;

export const HTTP_STATUS = {
  OK: 200,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
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
  NO_DATA: "No data.",
  SERVER_ERROR: "Internal server error.",
  WRONG_PASSWORD: "Wrong password.",
  INVALID_CONTENT_TYPE: "Invalid content type.",
  INVALID_JSON_KEY: "Invalid JSON key.",
  INVALID_JSON_FORMAT: "Invalid JSON format.",
  ENV_ERROR: "Environment variable is not setting.",
  FORBIDDEN_CORS: "Forbidden: CORS policy does not allow access from this origin.",
  AUTHENTICATION_REQUIRED: "Authentication required.",
  TOKEN_EXPIRED: "Token expired."
} as const;