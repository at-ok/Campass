import { beforeEach, describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import { auth } from "./auth";
import type { TrpcContext } from "./_core/context";
vi.mock("./db", () => ({}));
vi.mock("./auth", () => ({ auth: { api: { signOut: vi.fn() } } }));
function context(): TrpcContext {
  return {
    req: new Request("https://example.com/api/trpc", {
      headers: { cookie: "better-auth.session_token=test-session" },
    }),
    resHeaders: new Headers(),
    user: null,
    session: null,
  };
}
describe("Better Auth logout", () => {
  beforeEach(() => vi.resetAllMocks());
  it("passes the session to Better Auth and forwards every cleared cookie", async () => {
    const response = new Response(null);
    response.headers.append(
      "set-cookie",
      "better-auth.session_token=; Max-Age=0; HttpOnly; Path=/"
    );
    response.headers.append(
      "set-cookie",
      "better-auth.session_data=; Max-Age=0; HttpOnly; Path=/"
    );
    vi.mocked(auth.api.signOut).mockResolvedValue(response as never);
    const ctx = context();
    expect(await appRouter.createCaller(ctx).auth.logout()).toEqual({
      success: true,
    });
    expect(auth.api.signOut).toHaveBeenCalledWith({
      headers: ctx.req.headers,
      asResponse: true,
    });
    expect(ctx.resHeaders.getSetCookie()).toEqual(
      response.headers.getSetCookie()
    );
  });
  it("does not report success when session invalidation fails", async () => {
    vi.mocked(auth.api.signOut).mockRejectedValue(
      new Error("Session store unavailable")
    );
    const ctx = context();
    await expect(appRouter.createCaller(ctx).auth.logout()).rejects.toThrow(
      "Session store unavailable"
    );
    expect(ctx.resHeaders.getSetCookie()).toHaveLength(0);
  });
});
