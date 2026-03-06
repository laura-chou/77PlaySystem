import type { Config } from "jest";

const config: Config = {
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": ["ts-jest", {}],
  },
  maxWorkers: 1,
  setupFiles: ["<rootDir>/tests/setupEnv.ts"]
};

export default config;