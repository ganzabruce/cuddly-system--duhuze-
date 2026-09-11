import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import path from "path";

config({ path: path.resolve(process.cwd(), ".env") });

export default defineConfig({
    out: "./drizzle/migrations",
    schema: "./lib/db/schema/index.ts",
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL!,
    },
});
