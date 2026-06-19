import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
  {
    rules: {
      // React Compiler rules — no usamos el compilador experimental
      "react-compiler/react-compiler": "off",
      // Warnings → no errores bloqueantes
      "@typescript-eslint/no-unused-vars": "warn",
    },
  },
]);

export default eslintConfig;
