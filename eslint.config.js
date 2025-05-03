"use strict";
import customConfig from "eslint-config";
import tseslint from "typescript-eslint";

export default tseslint.config({
    extends: [...customConfig],
});
