import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const LAYER_RULES = `Dependencies point down only: app, features, entities, shared.
Entities: user, exercise, training. Features: auth, account, exercises, templates, workouts.`;

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
