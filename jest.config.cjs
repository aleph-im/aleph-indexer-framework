/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  // preset: 'ts-jest',
  preset: 'ts-jest/presets/default-esm',
  resolver: 'ts-jest-resolver',
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],

  globals: { 'ts-jest': { useESM: true } },

  // from https://stackoverflow.com/a/57916712/15076557
  // transformIgnorePatterns: [
  //   'node_modules/(?!(module-that-needs-to-be-transformed)/)',
  // ],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  modulePaths: ['<rootDir>'],
  testTimeout: 1000 * 10,
}
