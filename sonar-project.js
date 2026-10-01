const sonarqubeScanner = require('sonarqube-scanner').default;

sonarqubeScanner(
    {
        serverUrl: process.env.SONAR_HOST_URL || 'http://localhost:9000',
        options: {
            'sonar.projectName': 'Frontend - React/Next.js/Electron',
            'sonar.projectKey': 'frontend-app',
            'sonar.login': 'squ_816aa3d1266bd5698052220e9efaa38c2a80196e',

            'sonar.sources': 'app,layout',

            'sonar.typescript.tsconfigPath': 'tsconfig.sonar.json',
            'sonar.coverage.exclusions': '**/*',

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