import js from '@eslint/js';
import { includeIgnoreFile } from '@eslint/compat';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import path from 'path';

export default [
  js.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 2022,
      globals: {
        ...globals.mocha,
        ...globals.node
      },
    },
  },
  includeIgnoreFile(path.resolve(
    new URL('.', import.meta.url).pathname,
    '.gitignore'
  )),
];
