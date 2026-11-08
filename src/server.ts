import "dotenv/config";
import { createApp } from "./app.js";
import { env } from "./env.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();
const server = app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}`);
});

const shutdown = (signal: string) => {
  logger.info({ signal }, "Shutting down");
  server.close(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

import { purgeExpired } from "./lib/recovery.js";
let purging = false;
const recoveryTimer = setInterval(() => {
  if (purging) return;
  purging = true;
  void purgeExpired()
    .catch((error) => logger.error({ error }, "Recovery cleanup failed"))
    .finally(() => {
      purging = false;
    });
}, 1000);
recoveryTimer.unref();
