/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  // preset: 'ts-jest',
  preset: 'ts-jest/presets/default-esm',
  resolver: 'ts-jest-resolver',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  globals: { 'ts-jest': { useESM: true } },

  verbose: true, // https://stackoverflow.com/questions/41093368/does-jest-swallow-console-log-statements-is-there-a-way-to-change-this

  // from https://stackoverflow.com/a/57916712/15076557
  transformIgnorePatterns: ['node_modules/@jest/globals'], // 'node_modules/(?!(module-that-needs-to-be-transformed)/)',
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  modulePaths: ['<rootDir>'],
  testTimeout: 1000 * 10,
}
