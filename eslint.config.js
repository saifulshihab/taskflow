import tseslint from "typescript-eslint";

export default tseslint.config(
  // web/ is the Next.js app; it has its own eslint config.
  { ignores: ["dist", "node_modules", "src/generated", "web"] },
  ...tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
