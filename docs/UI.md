# Campass UI

時間割を中心に、Google Calendarで馴染みのある操作とMaterial Designの視覚表現を組み合わせた学習プランナー。

## 採用技術

- **MUI 9 + Emotion**: ナビゲーション、フォーム、ダイアログ、メニュー、通知、テーマ。基本操作やフォーカス管理はライブラリに委ねる。
- **MUI X Date Pickers + date-fns**: 日本語の日付・時刻選択、サイドバーのミニカレンダー、日付計算。
- **FullCalendar**: 月・週・日の表示、繰り返し授業、重なる予定、現在時刻線、日付移動。
- **React Hook Form + Zod**: 入力状態と検証。課題・授業・試験・予定の編集は共通の入口から開く。
- **TanStack Query + tRPC**: 既存API、型付き通信、保存後の画面間同期。
- **Fontsource + Material Icons**: Roboto、日本語フォント、アイコンをアプリと一緒に配信。

Tailwind、Radix/shadcn、独自サイドバー、独自日付グリッド、未使用のUIテンプレートは削除。

## 画面と操作

- 時間割: 毎週の授業を週・日単位で確認。空き枠で新規登録、授業を選んで編集。週末の授業も表示。
- カレンダー: 授業、課題期限、試験、その他の予定を統合。種別ごとに表示切替。
- 授業一覧: 授業名・教員名・教室の検索と編集。
- 課題: 未完了・完了・全件、期限・優先度の並べ替え、完了チェック。
- 試験: これからの試験、全件、会場・日時・残り日数。
- 共通検索: 登録済みの授業・課題・試験・予定を検索して直接編集。
- 設定: ライト・ダーク・デバイス連動、時間割の週末表示。ブラウザーに保存。

大きな画面は左ナビゲーションと時間割の横の予定欄、小さな画面は下部ナビゲーションと日表示を使用する。入力画面はスマートフォンで全画面表示。

色だけで状態を区別せず、ラベルも表示する。キーボードのフォーカス表示、メインコンテンツへのスキップリンク、入力エラー、削除確認、読み込み・空・エラー状態を用意。ブラウザーの拡大を許可し、端末の動きを減らす設定を尊重する。

ログイン、各画面、編集ダイアログは必要になった時点で読み込む。実機・ブラウザーでの確認は今回の作業範囲に含めない。

## 実装箇所

- `client/src/contexts/ThemeContext.tsx`: 共通テーマ
- `client/src/components/DashboardLayout.tsx`: ナビゲーション・共通検索
- `client/src/components/material/ScheduleCalendar.tsx`: FullCalendarとMUIの接続
- `client/src/components/material/EditorDialog.tsx`: 共通編集フォーム
- `client/src/lib/planner.ts`: 曜日・時限・色・予定の日付変換

## 参考資料

- [Material UI: installation](https://mui.com/material-ui/getting-started/installation/)
- [Material UI 9 migration guide](https://mui.com/material-ui/migration/upgrade-to-v9/)
- [MUI X: date format and localization](https://mui.com/x/react-date-pickers/adapters-locale/)
- [FullCalendar React](https://fullcalendar.io/docs/react)

`pnpm check`、`pnpm test`、`pnpm build` で検証できる。テストではデータベースと認証をモックし、実サービスのデータは使用しない。
