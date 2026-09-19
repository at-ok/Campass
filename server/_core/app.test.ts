import { describe, expect, it, vi } from "vitest";

vi.mock("../auth", () => ({
  AUTH_TRUSTED_ORIGINS: ["https://campass.example.com"],
  auth: { handler: vi.fn(() => new Response("auth")) },
}));
vi.mock("../db", () => ({}));

import app from "./app";

describe("deployed API", () => {
  it("serves a health check without connecting to the database", async () => {
    const response = await app.request(
      "https://campass.example.com/api/health"
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
  });
  it("routes authentication requests", async () => {
    const response = await app.request(
      "https://campass.example.com/api/auth/get-session"
    );
    expect(await response.text()).toBe("auth");
  });
  it("keeps unknown API paths as 404s", async () => {
    expect(
      (await app.request("https://campass.example.com/api/missing")).status
    ).toBe(404);
  });
  it("redirects canceled OAuth attempts to the production login page", async () => {
    const response = await app.request(
      "https://campass.example.com/api/auth/error?error=access_denied",
      {
        headers: { cookie: "auth_return_to=https%3A%2F%2Fevil.example%2F" },
      }
    );
    expect(response.headers.get("location")).toBe(
      "https://campass.example.com/login"
    );
  });
  it("does not grant credentialed CORS access to arbitrary origins", async () => {
    const response = await app.request(
      "https://campass.example.com/api/health",
      {
        headers: { origin: "https://evil.example" },
      }
    );
    expect(response.headers.get("access-control-allow-origin")).toBeNull();
  });
});
