import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { deleteCookie, getCookie } from "hono/cookie";
import { trpcServer } from "@hono/trpc-server";
import { AUTH_TRUSTED_ORIGINS, auth } from "../auth";
import { appRouter } from "../routers";
import { createContext } from "./context";

const app = new Hono();

// Middleware
app.use("/*", cors());

// Redirect canceled OAuth attempts back to the original page
app.get("/api/auth/error", c => {
  const error = c.req.query("error");

  if (error !== "access_denied") {
    return auth.handler(c.req.raw);
  }

  const returnToCookie = getCookie(c, "auth_return_to");

  const fallbackOrigin = AUTH_TRUSTED_ORIGINS[0];
  const fallbackUrl = fallbackOrigin ? `${fallbackOrigin}/login` : "/login";

  if (!returnToCookie) {
    return c.redirect(fallbackUrl);
  }

  try {
    const returnTo = decodeURIComponent(returnToCookie);
    const baseUrl = new URL(c.req.url);
    const targetUrl = new URL(returnTo, baseUrl);

    const allowedOrigins = new Set([baseUrl.origin, ...AUTH_TRUSTED_ORIGINS]);

    if (allowedOrigins.has(targetUrl.origin)) {
      deleteCookie(c, "auth_return_to");
      return c.redirect(targetUrl.toString());
    }
  } catch {
    // Ignore malformed return URL and use fallback.
  }

  deleteCookie(c, "auth_return_to");
  return c.redirect(fallbackUrl);
});

// Authentication Routes
app.on(["POST", "GET"], "/api/auth/*", c => {
  return auth.handler(c.req.raw);
});

// tRPC API
app.use(
  "/api/trpc/*",
  trpcServer({
    router: appRouter,
    createContext,
  })
);

// Health check
app.get("/", c => {
  return c.text("Server is running");
});

const port = parseInt(process.env.PORT || "3000");
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port,
});
