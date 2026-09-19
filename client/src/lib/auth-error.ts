export function authErrorMessage(
  error: { code?: string; status?: number },
  signup: boolean
) {
  if (error.status === 429) {
    return "操作が多すぎます。しばらく待ってからお試しください。";
  }
  if (error.status && error.status >= 500) {
    return "サーバーでエラーが発生しました。しばらくしてからお試しください。";
  }
  switch (error.code) {
    case "INVALID_ORIGIN":
      return "このURLからの認証が許可されていません。サイトの設定を確認してください。";
    case "INVALID_EMAIL":
      return "有効なメールアドレスを入力してください。";
    case "USER_ALREADY_EXISTS":
    case "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL":
      return "このメールアドレスは登録済みです。ログインしてください。";
    case "PASSWORD_TOO_SHORT":
      return "パスワードは8文字以上で入力してください。";
    case "PASSWORD_TOO_LONG":
      return "パスワードは128文字以下で入力してください。";
    case "INVALID_EMAIL_OR_PASSWORD":
      return "メールアドレスまたはパスワードが正しくありません。";
    default:
      return signup
        ? "アカウントを作成できませんでした。しばらくしてからお試しください。"
        : "ログインできませんでした。しばらくしてからお試しください。";
  }
}
