import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import eslintConfigPrettier from 'eslint-config-prettier';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
    {
        files: ['**/*.{js,mjs,cjs,ts}'],
        languageOptions: {
            globals: globals.node
        }
    },

    {
        files: ['**/*.js'],
        languageOptions: {
            sourceType: 'script'
        }
    },

    js.configs.recommended,
    tseslint.configs.recommended,
    eslintConfigPrettier,

    {
        plugins: {
            'simple-import-sort': simpleImportSort
        },
        rules: {
            'simple-import-sort/imports': 'error',
            'simple-import-sort/exports': 'error',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ],

            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            'no-case-declarations': 'off',
            '@typescript-eslint/no-unused-expressions': 'warn',
            'no-useless-escape': 'warn',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-duplicate-enum-values': 'off',
            '@typescript-eslint/no-unsafe-function-type': 'warn',

            'prefer-promise-reject-errors': 'error',
            'prefer-const': ['error', { destructuring: 'all' }],
            curly: ['error', 'all'],
            'no-useless-call': 'error'
        }
    },

    {
        files: ['**/**.seed.ts', 'seed.ts'],
        rules: {
            'max-len': 'off'
        }
    },

    {
        files: ['src/scripts/**/*.{ts,js}'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'off',
            '@typescript-eslint/ban-ts-comment': 'off'
        }
    },

    {
        files: ['**/*.spec.ts', '**/*.e2e.ts', '**/tests/**/*.{ts,js}'],
        rules: {
            '@typescript-eslint/no-unused-vars': 'off'
        }
    },

    {
        files: ['src/**/*.{ts,js}'],
        ignores: ['src/common/config/env/**'],
        rules: {
            'no-restricted-syntax': [
                'error',
                {
                    selector: 'MemberExpression[object.name="process"][property.name="env"]',
                    message: 'no use process.env'
                }
            ]
        }
    }
]);
