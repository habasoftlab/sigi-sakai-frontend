const nextJest = require('next/jest');

const createJestConfig = nextJest({
    dir: './',
});

/** @type {import('jest').Config} */
const customJestConfig = {
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    collectCoverage: true,
    collectCoverageFrom: [
        'app/**/*.{js,jsx,ts,tsx}',
        '!app/**/*.d.ts',
        '!app/**/layout.tsx',
        '!node_modules/**',
    ],
    coverageReporters: ['text', 'lcov'],
    coverageDirectory: 'coverage',
};

module.exports = createJestConfig(customJestConfig);