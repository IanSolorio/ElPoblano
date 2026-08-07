import globals from "globals";
import pluginJs from "@eslint/js";
import pluginReact from "eslint-plugin-react";


/** @type {import('eslint').Linter.Config[]} */
export default [
  { ignores: ["dist/**", "node_modules/**"] },
  {files: ["**/*.{js,mjs,cjs,jsx}"]},
  {languageOptions: { globals: globals.browser }},
  pluginJs.configs.recommended,
  pluginReact.configs.flat.recommended,
  pluginReact.configs.flat["jsx-runtime"],
  {
    settings: { react: { version: "detect" } },
    rules: {
      "no-unused-vars": ["error", { varsIgnorePattern: "^React$" }],
      "react/no-unescaped-entities": "off",
      "react/prop-types": "off",
    },
  },
];
