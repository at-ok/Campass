import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { getAuthConfig } from "./auth-config.js";

const authConfig = getAuthConfig(process.env);
export const AUTH_TRUSTED_ORIGINS = authConfig.trustedOrigins;

export const auth = betterAuth({
  ...authConfig,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      ...schema,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  advanced: {
    defaultCookieAttributes: {
      sameSite: "lax",
    },
  },
});
