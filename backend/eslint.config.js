import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

// Flat config (ESLint v10). Recomendado NÃO type-checked: rápido e suficiente
// para o --fix por arquivo do hook. A tipagem profunda fica com o tsc.
export default tseslint.config(
  {
    ignores: [
      "dist/**",
      "drizzle/**",
      "node_modules/**",
      "coverage/**",
      "mock-meta-server/**",
      "mock-openai-server/**",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  prettier, // desliga regras que conflitam com o Prettier (deve vir por último)
  {
    rules: {
      // O tsc já cuida de variáveis indefinidas; evita falso-positivo com globais Node.
      "no-undef": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
