import { describe, expect, it } from "vitest";
import { getAuthConfig } from "./auth-config";

const production = {
  NODE_ENV: "production",
  BETTER_AUTH_URL: "https://campass.example.com/",
  BETTER_AUTH_SECRET: "x".repeat(32),
};

describe("production authentication configuration", () => {
  it("trusts only the configured production origin", () => {
    expect(getAuthConfig(production).trustedOrigins).toEqual([
      "https://campass.example.com",
    ]);
  });
  it("rejects missing production settings and insecure URLs", () => {
    expect(() => getAuthConfig({ ...production, BETTER_AUTH_URL: "" })).toThrow(
      "BETTER_AUTH_URL"
    );
    expect(() =>
      getAuthConfig({ ...production, BETTER_AUTH_SECRET: "short" })
    ).toThrow("BETTER_AUTH_SECRET");
    expect(() =>
      getAuthConfig({ ...production, BETTER_AUTH_URL: "http://example.com" })
    ).toThrow("HTTPS");
  });
  it("keeps local Vite development working", () => {
    expect(getAuthConfig({}).trustedOrigins).toContain("http://localhost:5173");
  });
  it("omits Google OAuth when credentials are absent or incomplete", () => {
    expect(getAuthConfig(production).socialProviders).toEqual({});
    expect(
      getAuthConfig({ ...production, GOOGLE_CLIENT_ID: "id" }).socialProviders
    ).toEqual({});
  });
});
