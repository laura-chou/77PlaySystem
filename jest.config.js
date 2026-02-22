const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/app/$1',
    '^.+\\.(css|sass|scss)$': 'identity-obj-proxy',
  },
  setupFiles: ['<rootDir>/tests/setupFetch.ts'],
  testEnvironmentOptions: {
    customExportConditions: [''],
  },
};

module.exports = async () => {
  const config = await createJestConfig(customJestConfig)();
  // We need to override transformIgnorePatterns to allow msw to be transformed
  config.transformIgnorePatterns = [
    '/node_modules/(?!(msw|@mswjs|until-async|@open-draft|headers-polyfill|@mswjs/interceptors|is-node-process|outvariant)/)',
  ];
  return config;
};
