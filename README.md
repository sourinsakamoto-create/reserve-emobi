# トゥクトゥク予約サイト

トゥクトゥクアクティビティのオンライン予約サイトです。Next.js (App Router) + Prisma + PostgreSQL で構築しています。

## 主な機能

- **お客様向け予約フォーム**: アクティビティ一覧 → 日付・時間枠選択 (在庫リアルタイム表示) → 人数・連絡先入力 → 予約確定 → 確認ページ
- **在庫管理**: アクティビティごとに日付・時間枠(スロット)単位で定員を設定。予約が入るたびに残数が自動計算されます
- **販売設定**: アクティビティ単位・スロット単位で「販売中/停止」を切り替え可能
- **予約の二重取り防止**: 予約確定はDBトランザクション内で残数を再チェックしてから作成するため、同時アクセスでも定員超過しません
- **メール通知**: 予約の確定・変更・キャンセル時にお客様へ通知メールを送信し、管理者通知用アドレスにも控えが届きます(SMTP未設定の場合は自動的にスキップされます)
- **予約の編集**: 管理画面の予約一覧から、日時・人数・お客様情報を編集できます(在庫を再チェックしたうえで保存され、お客様へ変更通知メールが送られます)
- **専用データベース**: このアプリ専用の PostgreSQL データベース (Prisma管理) を使用

管理画面: `/admin`
- ダッシュボード、アクティビティ・販売設定、日程・在庫管理、予約一覧

## セットアップ

```bash
npm install          # 依存関係のインストール(postinstallでPrisma Clientも生成されます)
cp .env.example .env # 環境変数ファイルを作成し、DATABASE_URL に PostgreSQL の接続文字列を設定
npm run db:migrate   # マイグレーション実行
npm run db:seed      # サンプルのアクティビティ・日程データを投入
npm run dev          # 開発サーバー起動 (http://localhost:3000)
```

PostgreSQL データベースが手元にない場合は、[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) や [Neon](https://neon.tech)、[Supabase](https://supabase.com) 等で無料枠のデータベースを作成し、その接続文字列を `DATABASE_URL` に設定してください。

## 環境変数

`.env` に以下を設定します(`.env.example` を参照)。

```
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# メール送信(任意・未設定でも予約自体は動作します)
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
MAIL_FROM=
ADMIN_NOTIFICATION_EMAIL=
```

- `SMTP_HOST`/`SMTP_PORT`/`SMTP_USER`/`SMTP_PASS` を設定すると、予約の確定・変更・キャンセル時にお客様へメールが届きます。
- `ADMIN_NOTIFICATION_EMAIL` を設定すると、新規予約・変更・キャンセルの通知メールがそのアドレスにも届きます(Slackのメール投稿用アドレスを指定すれば、そのままSlackチャンネルに通知することもできます)。
- いずれも未設定の場合はメール送信処理を自動的にスキップし、予約自体は問題なく完了します。
- メール送信が5〜6秒応答しない場合は自動的にタイムアウトし、予約処理自体はブロックしません(メール送信の失敗はログに記録されるのみです)。

### メール送信の設定(Resendを使う場合の例)

1. [Resend](https://resend.com) でアカウントを作成し、API Keyを発行する
2. Resendは [SMTP互換のリレー](https://resend.com/docs/send-with-smtp) を提供しているため、以下の値を環境変数に設定するだけで送信できます

```
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_USER=resend
SMTP_PASS=<ResendのAPI Key>
MAIL_FROM=onboarding@resend.dev   # 独自ドメインを認証済みならそのアドレスに変更可能
ADMIN_NOTIFICATION_EMAIL=<通知を受け取りたいアドレス(Slackのメール投稿用アドレス等)>
```

Vercelにデプロイしている場合は、Project Settings → Environment Variables に上記を設定し、再デプロイしてください(ビルド時ではなく実行時に読み込まれるため、Build Commandの変更とは別に、環境変数追加後の再デプロイが必要です)。

## データベースについて

このアプリ専用の PostgreSQL データベースを Prisma で管理しています(`@prisma/adapter-pg` 経由)。

- スキーマ定義: `prisma/schema.prisma` (Activity / ScheduleSlot / Booking)
- マイグレーション: `npm run db:migrate`
- シード(サンプルデータ投入): `npm run db:seed`
- 中身をGUIで見る: `npm run db:studio`

### Vercelへのデプロイ

サーバーレス環境ではビルド時にマイグレーションを適用する必要があるため、Vercel の Project Settings → Build & Development Settings → **Build Command** を以下に変更してください。

```
npm run vercel-build
```

(内部的に `prisma migrate deploy && next build` を実行します。)

また Project Settings → Environment Variables に `DATABASE_URL`(PostgreSQL接続文字列)を設定してください。Vercel の Storage タブから Postgres を作成した場合は自動で設定されます。初回デプロイ後、`npm run db:seed` をローカルから対象DBに向けて一度実行するとサンプルデータが投入されます。

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
    prisma.ts         # Prisma Client (PostgreSQL driver adapter使用)
    booking.ts         # 予約作成ロジック(在庫チェック + メール通知)
    mailer.ts          # メール送信ユーティリティ
    validation.ts       # zod バリデーションスキーマ
  app/
    page.tsx            # アクティビティ一覧(トップページ)
    activities/[slug]/  # アクティビティ詳細 + 予約フォーム
    booking/[id]/        # 予約確認ページ
    admin/               # 管理画面(ダッシュボード・販売設定・在庫管理・予約一覧)
```
