export function getAuthConfig(env: NodeJS.ProcessEnv) {
  const isProduction = env.NODE_ENV === "production";
  if (isProduction && !env.BETTER_AUTH_URL) {
    throw new Error("BETTER_AUTH_URL is required in production");
  }
  if (
    isProduction &&
    (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32)
  ) {
    throw new Error(
      "BETTER_AUTH_SECRET must contain at least 32 characters in production"
    );
  }

  const url = new URL(env.BETTER_AUTH_URL || "http://localhost:3000");
  if (isProduction && url.protocol !== "https:") {
    throw new Error("BETTER_AUTH_URL must use HTTPS in production");
  }

  return {
    baseURL: url.origin,
    trustedOrigins: isProduction
      ? [url.origin]
      : Array.from(
          new Set([
            "http://localhost:5173",
            url.origin,
            "http://localhost:3000",
          ])
        ),
    socialProviders:
      env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
        ? {
            google: {
              clientId: env.GOOGLE_CLIENT_ID,
              clientSecret: env.GOOGLE_CLIENT_SECRET,
            },
          }
        : {},
  };
}
