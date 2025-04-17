/// <reference types="vitest" />

import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        cors: true,
    },
    build: {
        assetsInlineLimit: 0, // disable inlining assets since that doesn't work for OBR
        rollupOptions: {
            input: {
                // must have a 'main' entry point
                action: resolve(__dirname, "/src/action/action.html"),
                modalEditScript: resolve(
                    __dirname,
                    "/src/modalEditScript/modalEditScript.html",
                ),
                popoverAddButton: resolve(
                    __dirname,
                    "src/popoverAddButton/popoverAddButton.html",
                ),
            },
        },
    },
    test: {
        includeSource: ["src/**/*.{js,ts}"],
        setupFiles: ["./test/vitest.setup.ts"],
    },
    define: {
        "import.meta.vitest": "undefined",
    },
});
