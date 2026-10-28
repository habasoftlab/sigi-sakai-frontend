const sonarqubeScanner = require('sonarqube-scanner').default;

sonarqubeScanner(
    {
        serverUrl: process.env.SONAR_HOST_URL || 'http://localhost:9000',
        options: {
            'sonar.projectName': 'Frontend - React/Next.js/Electron',
            'sonar.projectKey': 'frontend-app',
            'sonar.host.url': 'http://localhost:9000',
            'sonar.login': 'sqp_8d4f344f09233a8ff619f26dcecb9272a9c8e022',
            'sonar.sources': 'app,layout',
            'sonar.typescript.tsconfigPath': 'tsconfig.sonar.json',
            'sonar.tests': 'app',
            'sonar.test.inclusions': 'app/**/*.test.tsx,app/**/*.spec.tsx,app/**/*.test.ts,app/**/*.spec.ts',
            'sonar.javascript.lcov.reportPaths': 'coverage/lcov.info',
            'sonar.exclusions': [
                '**/node_modules/**',
                '**/.next/**',
                '**/out/**',
                '**/dist/**',
                '**/build/**',
                '**/coverage/**',
                '**/*.test.ts',
                '**/*.test.tsx',
                '**/*.spec.ts',
                '**/*.spec.tsx',
                '**/types/**',
                'app/types/**'
            ].join(','),
        },
    },
    () => process.exit()
);