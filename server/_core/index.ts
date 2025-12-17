import "dotenv/config";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { trpcServer } from "@hono/trpc-server";
import { auth } from "../auth";
import { appRouter } from "../routers";
import { createContext } from "./context";

const app = new Hono();

// Middleware
app.use("/*", cors());

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
