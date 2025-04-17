import js from "@eslint/js";
import functional from "eslint-plugin-functional";
import preferArrowFunctions from "eslint-plugin-prefer-arrow-functions";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
    { ignores: ["dist"] },
    {
        extends: [
            js.configs.recommended,
            functional.configs.off,
            ...tseslint.configs.recommendedTypeChecked,
        ],
        files: ["**/*.{ts,tsx}"],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        plugins: {
            "react-hooks": reactHooks,
            "react-refresh": reactRefresh,
            "prefer-arrow-functions": preferArrowFunctions,
        },
        rules: {
            ...reactHooks.configs.recommended.rules,

            "react-refresh/only-export-components": [
                "warn",
                { allowConstantExport: true },
            ],
            "@typescript-eslint/switch-exhaustiveness-check": "error",
            "@typescript-eslint/no-misused-promises": [
                "error",
                {
                    checksVoidReturn: false,
                },
            ],
            "@typescript-eslint/prefer-readonly": "error",
            // "functional/type-declaration-immutability": "error",
            // Can't do this because it doesn't play nice with immer
            // "@typescript-eslint/prefer-readonly-parameter-types": [
            //     "error",
            //     {
            //         allow: [
            //             {
            //                 from: "package",
            //                 package: "@owlbear-rodeo/sdk",
            //                 name: "Item",
            //             },
            //             {
            //                 from: "package",
            //                 package: "immer",
            //                 name: "WritableDraft",
            //             },
            //         ],
            //     },
            // ],
            curly: "error",
            "class-methods-use-this": [
                "error",
                {
                    exceptMethods: ["continueExecution"],
                },
            ],
            "arrow-body-style": ["error", "as-needed"],
            "prefer-arrow-functions/prefer-arrow-functions": [
                "error",
                {
                    allowNamedFunctions: true,
                    allowObjectProperties: false,
                    classPropertiesAllowed: true,
                    disallowPrototype: true,
                    returnStyle: "implicit",
                    singleReturnOnly: false,
                },
            ],
        },
    },
);
