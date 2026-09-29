export default {
    preset: 'ts-jest',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                useESM: true,
                // explicit so tests pass even if tsconfig.json is missing/out of sync
                tsconfig: {
                    esModuleInterop: true,
                    module: 'NodeNext',
                    moduleResolution: 'NodeNext',
                    target: 'ES2022',
                    strict: true,
                    skipLibCheck: true,
                },
            },
        ],
    },
    testMatch: ['<rootDir>/tests/**/*.test.ts'],
};
