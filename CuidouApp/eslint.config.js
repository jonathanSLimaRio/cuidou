// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  {
    ignores: ['dist/**'],
  },
  expoConfig,
  {
    rules: {
      // These effects intentionally hydrate local state from remote/session data.
      // Refactor them independently from the SDK migration to avoid changing runtime behavior.
      'react-hooks/set-state-in-effect': 'off',
    },
  },
]);
