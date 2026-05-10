import { existsSync, readFileSync } from "node:fs";
import { defineConfig } from "prisma/config";

function getEnvValue(name: string) {
  if (process.env[name]) {
    return process.env[name];
  }

  const envPath = ".env";
  if (!existsSync(envPath)) {
    return undefined;
  }

  const lines = readFileSync(envPath, "utf8").split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const index = trimmed.indexOf("=");
    if (index <= 0) {
      continue;
    }
    const key = trimmed.slice(0, index).trim();
    if (key !== name) {
      continue;
    }
    return trimmed.slice(index + 1).trim();
  }

  return undefined;
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: getEnvValue("DATABASE_URL"),
  },
});
