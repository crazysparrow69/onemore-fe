import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const LAYER_RULES = `Dependencies point down only: app, features, entities, shared.
Entities: user, exercise, training. Features: auth, account, exercises, templates, workouts.`;

const RAW_ELEMENTS = {
  button:
    'Use Button, IconButton or Switch from shared/ui; add a variant or size instead of a raw <button>.',
  input: 'Use Input, TextField or SearchField from shared/ui.',
  textarea: 'Use Textarea from shared/ui.',
  select: 'Use Select or SelectField from shared/ui.',
  h1: 'Use Text with as="h1" from shared/ui.',
  h2: 'Use Text with as="h2" from shared/ui.',
  h3: 'Use Text with as="h3" from shared/ui.',
  p: 'Use Text from shared/ui.',
};

const ENTITY_FORBIDS = {
  user: ['entities/exercise', 'entities/training', 'features', 'app'],
  exercise: ['entities/training', 'features', 'app'],
  training: ['features', 'app'],
};

const FEATURE_FORBIDS = {
  auth: [
    'features/account',
    'features/exercises',
    'features/templates',
    'features/workouts',
    'app',
  ],
  account: [
    'features/auth',
    'features/exercises',
    'features/templates',
    'features/workouts',
    'app',
  ],
  exercises: [
    'features/auth',
    'features/account',
    'features/templates',
    'features/workouts',
    'app',
  ],
  templates: ['features/auth', 'features/account', 'features/workouts', 'app'],
  workouts: ['features/auth', 'features/account', 'app'],
};

function restrictImports(forbidden = []) {
  return {
    paths: [
      {
        name: 'axios',
        message: 'Use the shared API client in src/shared/api.',
      },
    ],
    patterns: forbidden.map((layer) => ({
      group: [`@/${layer}`, `@/${layer}/**`],
      message: LAYER_RULES,
    })),
  };
}

export default defineConfig([
  globalIgnores(['dist', 'dev-dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/only-throw-error': [
        'error',
        {
          allow: [
            {
              from: 'package',
              name: 'Redirect',
              package: '@tanstack/router-core',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['src/shared/api/**'],
    rules: {
      'no-restricted-imports': ['error', restrictImports()],
      'no-restricted-globals': [
        'error',
        {
          name: 'fetch',
          message: 'Use the shared API client in src/shared/api.',
        },
      ],
    },
  },
  {
    files: ['src/shared/**/*.{ts,tsx}'],
    ignores: ['src/shared/api/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        restrictImports(['entities', 'features', 'app']),
      ],
    },
  },
  {
    files: ['src/**/*.tsx'],
    ignores: ['src/shared/ui/**', '**/*.test.tsx'],
    rules: {
      'no-restricted-syntax': [
        'error',
        ...Object.entries(RAW_ELEMENTS).map(([tag, message]) => ({
          selector: `JSXOpeningElement[name.name='${tag}']`,
          message,
        })),
      ],
    },
  },
  ...Object.entries(ENTITY_FORBIDS).map(([entity, forbidden]) => ({
    files: [`src/entities/${entity}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': ['error', restrictImports(forbidden)],
    },
  })),
  ...Object.entries(FEATURE_FORBIDS).map(([feature, forbidden]) => ({
    files: [`src/features/${feature}/**/*.{ts,tsx}`],
    rules: {
      'no-restricted-imports': ['error', restrictImports(forbidden)],
    },
  })),
  eslintConfigPrettier,
]);
