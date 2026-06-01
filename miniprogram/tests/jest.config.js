module.exports = {
  testEnvironment: 'node',
  testTimeout: 120000,
  testMatch: ['<rootDir>/cases/**/*.test.js'],
  setupFilesAfterEach: [],
  globalSetup: '<rootDir>/helpers/global-setup.js',
  globalTeardown: '<rootDir>/helpers/global-teardown.js',
  reporters: [
    'default',
    ['jest-junit', { outputDirectory: './reports', outputName: 'junit.xml' }]
  ].filter(r => {
    try { require.resolve(Array.isArray(r) ? r[0] : r); return true; } catch (_) { return false; }
  })
};
