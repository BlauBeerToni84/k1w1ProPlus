const globals = require("globals");
const pluginJs = require("@eslint/js");
const pluginReact = require("eslint-plugin-react");
const pluginReactNative = require("eslint-plugin-react-native");
const babelParser = require("@babel/eslint-parser");

module.exports = [
  { 
    files: ["**/*.{js,jsx}"], 
    languageOptions: { globals: globals.browser },
    ignores: ["node_modules/**"], // Ignore node_modules
  },
  pluginJs.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false, // Set to false if babel.config.js is not directly used by ESLint
        babelOptions: {
          presets: ["babel-preset-expo"],
          // Temporarily remove 'react-native-reanimated/plugin' to allow ESLint to parse
          // plugins: ["react-native-reanimated/plugin"],
        },
        ecmaFeatures: {
          jsx: true,
        },
        ecmaVersion: 2020,
        sourceType: "module",
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        __DEV__: "readonly",
      },
    },
    plugins: {
      react: pluginReact,
      "react-native": pluginReactNative,
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      ...pluginReact.configs.recommended.rules,
      ...pluginReactNative.configs.all.rules,
      // Custom rules
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "no-unused-vars": ["warn", { "argsIgnorePattern": "^_", "varsIgnorePattern": "^_", "caughtErrorsIgnorePattern": "^_", "destructuredArrayIgnorePattern": "^_", "ignoreRestSiblings": true }],
      "react-native/no-inline-styles": "off", // Allow inline styles for now
      "react-native/no-color-literals": "off", // Allow color literals for now
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];