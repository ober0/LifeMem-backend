import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylisticTs from '@stylistic/eslint-plugin-ts';
import eslintConfigPrettier from 'eslint-config-prettier';

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ['**/*.{js,mjs,cjs,ts}'] },
    { files: ['**/*.js'], languageOptions: { sourceType: 'script' } },
    { languageOptions: { globals: globals.node } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        plugins: {
            '@stylistic/ts': stylisticTs
        },
        rules: {
            '@stylistic/ts/semi': 'error',
            '@stylistic/ts/quotes': 'off',
            quotes: 'off',
            '@typescript-eslint/no-unused-vars': [
                'error',
                {
                    argsIgnorePattern: '^_',
                    varsIgnorePattern: '^_',
                    caughtErrorsIgnorePattern: '^_'
                }
            ],
            '@typescript-eslint/no-explicit-any': 'off',
            'max-len': ['warn', { code: 120, tabWidth: 4 }],
            'keyword-spacing': ['error', { after: true }],
            'eol-last': 'error',
            'space-before-function-paren': [
                'error',
                {
                    anonymous: 'never',
                    named: 'never',
                    asyncArrow: 'always'
                }
            ],
            'prefer-promise-reject-errors': 2,
            curly: ['error', 'all'],
            'brace-style': ['error', '1tbs'],
            'comma-dangle': ['error', 'never'],
            'comma-spacing': 'error',
            'comma-style': 'error',
            'quote-props': ['error', 'consistent'],
            'space-before-blocks': ['error', 'always'],
            'spaced-comment': ['error', 'always'],
            'prefer-const': ['error', { destructuring: 'all' }],
            'object-curly-spacing': ['error', 'always'],
            'array-bracket-spacing': ['error', 'never'],
            'switch-colon-spacing': 'error',
            'no-useless-call': 'error',
            'no-trailing-spaces': 'error',
            'no-mixed-spaces-and-tabs': 'error',
            'no-multiple-empty-lines': ['error', { max: 2 }],
            'no-return-await': 'error'
        }
    },
    {
        files: ['**/*.tools.ts'],
        rules: {
            indent: 'off'
        }
    },
    {
        files: ['**/**.seed.ts', 'seed.ts'],
        rules: {
            'max-len': 'off'
        }
    }
];
