import { existsSync } from "node:fs";
import type { PrismaConfig } from "prisma/config";

// Type-only import and native env loading keep this file free of runtime
// dependencies, so the Prisma CLI also runs on the host, where node_modules
// does not exist (dependencies live in the dev container).
if (existsSync(".env")) {
  process.loadEnvFile(".env");
}

export default {
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx src/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
    shadowDatabaseUrl: process.env["SHADOW_DATABASE_URL"],
  },
} satisfies PrismaConfig;
