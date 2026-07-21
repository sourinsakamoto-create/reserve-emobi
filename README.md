# トゥクトゥク予約サイト

トゥクトゥクアクティビティのオンライン予約サイトです。Next.js (App Router) + Prisma + SQLite で構築しています。

## 主な機能

- **お客様向け予約フォーム**: アクティビティ一覧 → 日付・時間枠選択 (在庫リアルタイム表示) → 人数・連絡先入力 → 予約確定 → 確認ページ
- **在庫管理**: アクティビティごとに日付・時間枠(スロット)単位で定員を設定。予約が入るたびに残数が自動計算されます
- **販売設定**: アクティビティ単位・スロット単位で「販売中/停止」を切り替え可能
- **予約の二重取り防止**: 予約確定はDBトランザクション内で残数を再チェックしてから作成するため、同時アクセスでも定員超過しません
- **メール通知**: 予約確定時にお客様への確認メールと、管理者への新規予約通知メールを送信(SMTP未設定の場合は自動的にスキップされます)
- **専用データベース**: このアプリ専用の SQLite データベース (Prisma管理) を使用

管理画面: `/admin`
- ダッシュボード、アクティビティ・販売設定、日程・在庫管理、予約一覧

## セットアップ

```bash
npm install          # 依存関係のインストール(postinstallでPrisma Clientも生成されます)
cp .env.example .env # 環境変数ファイルを作成(下記参照)
npm run db:migrate   # マイグレーション実行 (初回は dev.db が作成されます)
npm run db:seed      # サンプルのアクティビティ・日程データを投入
npm run dev          # 開発サーバー起動 (http://localhost:3000)
```

## 環境変数

`.env` に以下を設定します(`.env.example` を参照)。

```
DATABASE_URL="file:./dev.db"

# メール送信(任意・未設定でも予約自体は動作します)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
ADMIN_NOTIFICATION_EMAIL=
```

- `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` を設定すると、予約確定時にお客様へ確認メールが届きます。
- `ADMIN_NOTIFICATION_EMAIL` を設定すると、新規予約の通知メールがそのアドレスにも届きます。
- いずれも未設定の場合はメール送信処理を自動的にスキップし、予約自体は問題なく完了します。

## データベースについて

このアプリ専用の SQLite データベースを Prisma で管理しています。

- スキーマ定義: `prisma/schema.prisma` (Activity / ScheduleSlot / Booking)
- マイグレーション: `npm run db:migrate`
- シード(サンプルデータ投入): `npm run db:seed`
- 中身をGUIで見る: `npm run db:studio`

本番運用でアクセスが増える場合や、サーバーレス環境(Vercelなど)にデプロイする場合は、SQLiteファイルの永続化が難しいため、`DATABASE_URL` を Postgres 等に差し替え、`prisma/schema.prisma` の `provider` を変更し、`@prisma/adapter-pg` 等の対応するドライバアダプタに切り替えることを推奨します。

## 管理画面の認証について

⚠️ **現時点では管理画面 (`/admin` 以下) にログイン認証がありません。** 本番公開前に、必ずBasic認証やパスワード保護などを追加してください(誰でもアクセスできる状態で公開しないようご注意ください)。

## 決済について

現時点では予約はオンライン決済を行わず、「予約のみ」で確定し、当日現地でのお支払いとしています。オンライン決済(クレジットカード等)を追加したい場合は、Stripe等の決済代行サービスの導入をご検討ください。

## ディレクトリ構成(抜粋)

```
prisma/
  schema.prisma       # Activity / ScheduleSlot / Booking モデル
  seed.ts             # サンプルデータ投入スクリプト
src/
  lib/
    prisma.ts         # Prisma Client (SQLite driver adapter使用)
    booking.ts         # 予約作成ロジック(在庫チェック + メール通知)
    mailer.ts          # メール送信ユーティリティ
    validation.ts       # zod バリデーションスキーマ
  app/
    page.tsx            # アクティビティ一覧(トップページ)
    activities/[slug]/  # アクティビティ詳細 + 予約フォーム
    booking/[id]/        # 予約確認ページ
    admin/               # 管理画面(ダッシュボード・販売設定・在庫管理・予約一覧)
```
