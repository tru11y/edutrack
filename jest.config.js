/** @type {import('jest').Config} */
export default {
  preset: "ts-jest",
  testEnvironment: "node",

  roots: ["<rootDir>/src"],

  testMatch: [
    "**/?(*.)+(spec|test).ts?(x)",
  ],

  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],

  collectCoverageFrom: [
    "src/**/*.ts",
    "src/**/*.tsx",
    "!src/**/*.d.ts",
    "!src/main.tsx",
  ],

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          jsx: "react-jsx",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          module: "commonjs",
        },
      },
    ],
  },

  moduleNameMapper: {
    "^firebase/firestore$": "<rootDir>/src/__mocks__/firebase/firestore.ts",
    "^../../services/firebase$": "<rootDir>/src/__mocks__/services/firebase.ts",
    "^../services/firebase$": "<rootDir>/src/__mocks__/services/firebase.ts",
    "^./services/firebase$": "<rootDir>/src/__mocks__/services/firebase.ts",
  },
};
