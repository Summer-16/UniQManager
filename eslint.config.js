const js = require("@eslint/js");
const globals = require("globals");

module.exports = {
  ...js.configs.recommended,
  "languageOptions": {
    "ecmaVersion": 12,
    "sourceType": "module",
    "globals": {
      ...globals.es2021,
      ...globals.node
    }
  },
  "rules": {
    "no-console": [1, { "allow": ["warn", "error", "info"] }],
    "no-var": "error",
    "prefer-const": "error",
    "no-unreachable": "error"
  }
};
