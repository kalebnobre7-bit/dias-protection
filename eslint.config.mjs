import { FlatCompat } from "@eslint/eslintrc";
import prettier from "eslint-config-prettier";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

// next/core-web-vitals + next/typescript, com as regras de formatação desligadas (Prettier cuida disso)
const config = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  prettier,
  {
    ignores: [".next/**", "out/**", "node_modules/**", "next-env.d.ts", "public/**", "coverage/**"],
  },
];

export default config;
