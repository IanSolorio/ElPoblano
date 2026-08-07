import { createApp } from "./app.js";
import { env } from "./config/env.js";

const server = createApp().listen(env.port, () => {
  console.log(`API de El Poblano disponible en http://localhost:${env.port}/api`);
});

const shutdown = async () => {
  server.close();
  const { prisma } = await import("./shared/database/prisma.js");
  await prisma.$disconnect();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
