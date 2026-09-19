import { describe, expect, it } from "vitest";
import { authErrorMessage } from "./auth-error";

describe("authentication errors", () => {
  it("does not blame email input for a server failure", () => {
    expect(authErrorMessage({ status: 504 }, true)).toContain("サーバー");
    expect(authErrorMessage({}, true)).not.toContain("メールアドレスを確認");
  });
  it("explains a known credential error", () => {
    expect(
      authErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" }, false)
    ).toContain("正しくありません");
  });
});
