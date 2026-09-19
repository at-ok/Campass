# Vercel + Neonへの公開

個人・非商用向けにVercel HobbyとNeon Freeを使用する。独自ドメインは不要。
画面は静的配信、`/api/*`はNode.js Functionとして実行する。
無料枠のAPI・DBには起動遅延や利用量制限がある。表示速度は公開後に実測する。

## 1. アカウントとDB

- 個人GitHubアカウントのCampassリポジトリをVercelに連携する。
- Neon Freeで本番用の空のDBを作成する。
- NeonのConnectでConnection poolingを有効にした接続文字列を控える。
- マイグレーション用にはpoolingを無効にした接続文字列も控える。
- Vercel FunctionのリージョンはNeonと同じ、または最寄りに設定する。

## 2. DBの初期化

ローカルでNode.js 22、pnpm 10.4.1を使用する。
ルートに`.env.production.local`を作り、次の値を設定する。このファイルはGit管理対象外。

```dotenv
DATABASE_URL="Neonのpooled接続文字列"
DATABASE_URL_UNPOOLED="Neonのdirect接続文字列"
```

接続文字列のSSL関連パラメータはNeonが表示したものをそのまま使う。
次のコマンドで、コミット済みのSQLを適用する。ビルド時にはDBを書き換えない。

```sh
pnpm install --frozen-lockfile
DOTENV_CONFIG_PATH=.env.production.local pnpm run db:migrate
```

シェルに既存の`DATABASE_URL`や`DATABASE_URL_UNPOOLED`がexportされている場合は、
そちらがファイルより優先されるため、実行前に接続先を確認する。
既存テーブルがありマイグレーション履歴がないDBには、この初期化を実行しない。
開発DBからのデータ移行は別作業であり、この手順ではデータをコピーしない。

スキーマ変更時は開発環境で`pnpm run db:generate`を実行し、SQLと`drizzle/meta`を
確認して両方コミットする。本番では`db:migrate`のみを実行する。

## 3. GitHubへ反映してVercelにインポート

コード変更と`drizzle/0000_flowery_bulldozer.sql`をGitHubへ反映する。
VercelのAdd New → Projectからリポジトリを選び、Hobbyで作成する。

| 設定             | 値                                   |
| ---------------- | ------------------------------------ |
| Root Directory   | リポジトリルート（`client`にしない） |
| Framework Preset | Vite                                 |
| Node.js          | 22.x                                 |
| Install Command  | `pnpm install --frozen-lockfile`     |
| Build Command    | `pnpm run check:api && pnpm run build:client`              |
| Output Directory | `dist/public`                        |

これらのビルド・配信設定は`vercel.json`に記載済み。
APIの配置は`api/index.ts`。`/api/*`をこのFunctionへ転送し、
静的ファイル以外の画面URLには`index.html`を返す。

## 4. 本番環境変数

VercelのEnvironment VariablesでProductionに次を登録する。

| 名前                   | 値                                                      |
| ---------------------- | ------------------------------------------------------- |
| `DATABASE_URL`         | Neonのpooled接続文字列                                  |
| `BETTER_AUTH_SECRET`   | `openssl rand -hex 32`で生成した本番専用の値            |
| `BETTER_AUTH_URL`      | 実際の固定本番URL。例：`https://campass-xxx.vercel.app` |
| `GOOGLE_CLIENT_ID`     | Googleログインを使う場合に設定                          |
| `GOOGLE_CLIENT_SECRET` | Googleログインを使う場合に設定                          |

秘密値に`VITE_`を付けない。入力値を引用符で囲まない。
本番URLには各デプロイ固有の一時URLを使わず、Settings → Domainsで確認した固定URLを使う。
初回公開後にURLが確定・変更した場合は`BETTER_AUTH_URL`を更新し、再デプロイする。
ローカルの`.env`はVercelには送られない。

Previewは本番とは別のDB・認証URLを設定するまでは認証動作の確認に使わない。
Google OAuthが未設定でもメール・パスワード認証は利用可能。
現状のアプリは一般の新規登録を許可しているため、自分以外の利用を禁止したい場合は
別途登録制限を追加する必要がある。

## 5. Googleログイン（利用する場合）

Google Cloud ConsoleでOAuth同意画面とウェブアプリケーション用クライアントを設定する。
外部向け・テスト中の場合は、自分のGoogleアカウントをテストユーザーに追加する。
承認済みリダイレクトURIを次の完全一致する値にする。

```text
https://実際の固定本番ドメイン/api/auth/callback/google
```

クライアントIDとシークレットをVercelのProduction環境変数に登録して再デプロイする。

## 6. 公開後の確認

1. `/api/health`が`Server is running`を返す。
2. `/login`を直接開き、再読み込みしても画面が出る。
3. ログイン後に時間割・課題を登録し、再読み込み後も保存されている。
4. ログアウト後に保護されたデータにアクセスできない。
5. Googleログインを使う場合は成功・キャンセルの両方を確認する。
6. スマートフォンで操作し、しばらく放置した後の起動時間を測定する。

時間割データの端末への永続保存は今回の公開設定には含まない。

## 参考

- [Vercel Hobby](https://vercel.com/docs/plans/hobby)
- [Vercelの環境変数](https://vercel.com/docs/environment-variables)
- [VercelのDB接続管理](https://vercel.com/kb/guide/connection-pooling-with-functions)
- [Neonの接続プール](https://neon.com/docs/connect/connection-pooling)
