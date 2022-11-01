/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  // preset: 'ts-jest',
  preset: 'ts-jest/presets/default-esm',
  resolver: 'ts-jest-resolver',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  verbose: true, // https://stackoverflow.com/questions/41093368/does-jest-swallow-console-log-statements-is-there-a-way-to-change-this
  globals: { 'ts-jest': { useESM: true } },

  // from https://stackoverflow.com/a/57916712/15076557 & https://www.reddit.com/r/typescript/comments/tkvsgk/typescript_jest_unexpected_token_export/
  transformIgnorePatterns: ['node_modules/@jest/globals'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  modulePaths: ['<rootDir>'],
  testTimeout: 1000 * 10,
}
