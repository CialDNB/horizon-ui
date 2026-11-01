import js from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['dist', 'storybook-static', 'coverage'] },
    { ignores: ['.tmp-hz-lint-*'] },
    js.configs.recommended,
    ...tseslint.configs.strict,
    jsxA11y.flatConfigs.strict,
    {
        files: ['src/**/*.{ts,tsx}'],
        plugins: { boundaries },
        settings: {
            'import/resolver': { typescript: { project: './tsconfig.json' } },
            'boundaries/elements': [
                { type: 'tokens', pattern: 'src/tokens/**' },
                { type: 'lib', pattern: 'src/lib/**' },
                { type: 'provider', pattern: 'src/provider/**' },
                { type: 'primitives', pattern: 'src/primitives/**' },
                {
                    type: 'component',
                    pattern: 'src/components/*',
                    capture: ['name'],
                },
                { type: 'types', pattern: 'src/types/**' },
                { type: 'root', pattern: 'src/*.{ts,tsx}', mode: 'file' },
            ],
        },
        rules: {
            'no-console': ['error', { allow: ['warn', 'error'] }],
            '@typescript-eslint/no-explicit-any': 'error',
            '@typescript-eslint/no-non-null-assertion': 'error',
            '@typescript-eslint/ban-ts-comment': [
                'error',
                { 'ts-ignore': true, 'ts-expect-error': true },
            ],
            'no-restricted-exports': [
                'error',
                {
                    restrictDefaultExports: {
                        direct: true,
                        named: true,
                        defaultFrom: true,
                        namedFrom: true,
                        namespaceFrom: true,
                    },
                },
            ],
            'boundaries/element-types': [
                'error',
                {
                    default: 'disallow',
                    rules: [
                        { from: 'tokens', allow: ['tokens', 'types'] },
                        { from: 'lib', allow: ['lib', 'tokens', 'types'] },
                        {
                            from: 'provider',
                            allow: ['provider', 'tokens', 'lib', 'types'],
                        },
                        {
                            from: 'primitives',
                            allow: [
                                'primitives',
                                'tokens',
                                'lib',
                                'provider',
                                'types',
                            ],
                        },
                        {
                            from: 'component',
                            allow: [
                                'tokens',
                                'lib',
                                'provider',
                                'primitives',
                                'types',
                                ['component', { name: '!${from.name}' }],
                            ],
                        },
                        { from: 'types', allow: ['types'] },
                        {
                            from: 'root',
                            allow: [
                                'component',
                                'tokens',
                                'lib',
                                'provider',
                                'primitives',
                                'types',
                            ],
                        },
                    ],
                },
            ],
            'boundaries/entry-point': [
                'error',
                {
                    default: 'disallow',
                    rules: [
                        { target: ['component'], allow: ['**/index.ts'] },
                        {
                            target: [
                                'tokens',
                                'lib',
                                'provider',
                                'primitives',
                                'types',
                                'root',
                            ],
                            allow: ['**'],
                        },
                    ],
                },
            ],
        },
    },
    {
        files: [
            'src/**/*.stories.{ts,tsx}',
            'src/**/__tests__/**',
            'src/**/*.test.{ts,tsx}',
        ],
        rules: {
            'no-restricted-exports': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
        },
    },
    {
        // Type tests: `src/**/*.test-d.ts` may use @ts-expect-error with a description.
        files: ['src/**/*.test-d.ts'],
        rules: {
            '@typescript-eslint/ban-ts-comment': [
                'error',
                {
                    'ts-ignore': true,
                    'ts-expect-error': 'allow-with-description',
                    minimumDescriptionLength: 10,
                },
            ],
        },
    }
);
