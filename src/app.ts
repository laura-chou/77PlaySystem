import "dotenv/config";
import "./middleware/passport";

if (!process.env.JWT_SECRET) {
  // eslint-disable-next-line no-console
  console.error("FATAL ERROR: JWT_SECRET is not defined.");
  process.exit(1);
}

import cors, { CorsOptions } from "cors";
import express, { Express, NextFunction, Request, Response } from "express";
import morgan from "morgan";

import { responseHandler } from "./common/response";
import { isJestTest, isNullOrEmpty } from "./common/utils";
import { connectDB } from "./core/db";
import { LOG_LEVEL, setLog } from "./core/logger";
import { router } from "./routes/router";

const app: Express = express();
const whiteList: string[] = process.env.WHITELIST?.split(",") || [];

morgan.token("apiPath", (req: Request) => `${req.method} ${req.originalUrl}`);
app.use(morgan(":apiPath", {
  immediate: true,
  stream: {
    write: (message: string) => {
      setLog(LOG_LEVEL.HTTP, message.trim());
    }
  }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const corsOptions: CorsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (isJestTest) {
      callback(null, true);
    }
    if (!isNullOrEmpty(origin)) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const hostName: string = new URL(origin!).hostname;
      setLog(LOG_LEVEL.INFO, `origin: ${origin}`);
      callback(null, whiteList.includes(hostName));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

app.use((error: Error, _request: Request, response: Response, _next: NextFunction) => {
  if (!isNullOrEmpty(error.message)) {
    setLog(LOG_LEVEL.ERROR, error.message);
    responseHandler.forbidden(response);
  } else {
    setLog(LOG_LEVEL.ERROR, `Unhandled error:\n ${error}`);
    responseHandler.serverError(response);
  }
});

router.forEach(route => {
  app.use(route.prefix, route.router);
});

if (!isJestTest) connectDB();

app.listen(process.env.PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`http://localhost:${process.env.PORT}`);
});

export default app;
