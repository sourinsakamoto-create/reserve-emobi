# トゥクトゥク予約サイト

トゥクトゥクアクティビティのオンライン予約サイトです。Next.js (App Router) + Prisma + PostgreSQL で構築しています。

## 主な機能

- **お客様向け予約フォーム**: アクティビティ一覧 → カレンダーで日付選択(予約可能日を緑の点で表示)→ 時間枠選択 (在庫リアルタイム表示) → 人数・連絡先入力 → 予約確定 → 確認ページ
- **在庫管理**: アクティビティごとに日付・時間枠(スロット)単位で定員を設定。予約が入るたびに残数が自動計算されます
- **販売設定**: アクティビティ単位・スロット単位で「販売中/停止」を切り替え可能
- **予約の二重取り防止**: 予約確定はDBトランザクション内で残数を再チェックしてから作成するため、同時アクセスでも定員超過しません
- **メール通知**: 予約の確定・変更・キャンセル時にお客様へ通知メールを送信し、管理者通知用アドレスにも控えが届きます(SMTP未設定の場合は自動的にスキップされます)
- **メールテンプレート編集**: `/admin/email-templates` から、お客様に送る確定・変更・キャンセルメールの件名・本文を自由に編集できます(お名前・日付・金額などを差し込む変数に対応)
- **予約の編集**: 管理画面の予約一覧から、日時・人数・お客様情報を編集できます(在庫を再チェックしたうえで保存され、お客様へ変更通知メールが送られます)
- **専用データベース**: このアプリ専用の PostgreSQL データベース (Prisma管理) を使用
- **スタッフ認証**: `/admin`(管理者)と `/guide`(ガイド)はログイン必須。役割(admin/guide)ごとにアクセスできる範囲が分かれています
- **画像アップロード**: アクティビティごとに、管理画面から直接画像ファイルをアップロードできます(Vercel Blobを使用。未設定の場合は画像URLを直接指定する方法にフォールバックします)
- **ガイドの出勤可能日管理**: ガイド役割のスタッフが `/guide` のカレンダーから自分の出勤可能日を設定でき、管理者は `/admin/guides` で全ガイドの出勤可能日を確認しつつ、予約一覧から担当ガイドを割り当てられます

管理画面: `/admin`(要ログイン)
- ダッシュボード、アクティビティ・販売設定、日程・在庫管理、予約一覧(担当ガイド割り当て含む)、ガイド出勤可能日、メールテンプレート、スタッフ管理

ガイド専用画面: `/guide`(要ログイン・GUIDE/ADMIN共通)
- 自分の出勤可能日をカレンダーで設定

## セットアップ

```bash
npm install          # 依存関係のインストール(postinstallでPrisma Clientも生成されます)
cp .env.example .env # 環境変数ファイルを作成し、DATABASE_URL・AUTH_SECRET等を設定(下記参照)
npm run db:migrate   # マイグレーション実行
npm run db:seed      # サンプルのアクティビティ・日程データ + 初期管理者アカウントを投入
npm run dev          # 開発サーバー起動 (http://localhost:3000)
```

`npm run db:seed` 実行時に `.env` の `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` が設定されていれば、そのメールアドレス・パスワードで `/login` からログインできる最初の管理者アカウントが作成されます。それ以降のスタッフアカウント(追加の管理者・ガイド)は、ログイン後の「スタッフ管理」画面から追加できます。

PostgreSQL データベースが手元にない場合は、[Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) や [Neon](https://neon.tech)、[Supabase](https://supabase.com) 等で無料枠のデータベースを作成し、その接続文字列を `DATABASE_URL` に設定してください。

## 環境変数

`.env` に以下を設定します(`.env.example` を参照)。

```
DATABASE_URL="postgresql://user:password@host:5432/dbname"

# スタッフログインのセッション署名に使う秘密鍵。以下で生成してください:
#   openssl rand -base64 32
AUTH_SECRET=

# 初回の `npm run db:seed` でのみ使う、最初の管理者アカウントの作成用
INITIAL_ADMIN_EMAIL=
INITIAL_ADMIN_PASSWORD=

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

## 画像アップロードについて

アクティビティの画像は、管理画面(`/admin/activities`)からファイルを直接アップロードできます([Vercel Blob](https://vercel.com/docs/storage/vercel-blob)を使用)。

**設定方法:**

1. Vercelダッシュボード → 対象プロジェクト → **Storage** タブ
2. **Create Database** → **Blob** を選択して作成
3. プロジェクトに接続する(接続すると `BLOB_STORE_ID` 等が自動的に環境変数へ追加されます)
4. 再デプロイ

最近のVercel Blobは `BLOB_STORE_ID` があれば自動的に認証されるため、`BLOB_READ_WRITE_TOKEN` を別途設定する必要はありません(ローカルの `npm run dev` からアップロードを試したい場合のみ、Blobストアの画面から `BLOB_READ_WRITE_TOKEN` をコピーして `.env` に設定してください)。

この設定をしなくても、管理画面の「画像URLを直接指定」欄に外部の画像URLを入力する方法は引き続き使えます(その場合はアップロード機能は使わずスキップされます)。

対応形式: JPEG・PNG・WebP・GIF、4MBまで(Vercelのサーバーレス関数のリクエストサイズ上限が4.5MBのため)。

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

`/admin`(管理者専用)・`/guide`(ガイド専用)はログインが必須です。認証はメールアドレス+パスワードで、`StaffUser` テーブルで管理しています。

- **役割**: `ADMIN`(全機能にアクセス可)・`GUIDE`(`/guide` で自分の出勤可能日を設定。`/admin` にはアクセスできません)
- **最初のアカウント**: `.env` に `INITIAL_ADMIN_EMAIL` / `INITIAL_ADMIN_PASSWORD` を設定した状態で `npm run db:seed` を実行すると作成されます(Vercelにデプロイ済みの場合は、対象DBの `DATABASE_URL` をローカルの `.env` に設定した状態で一度実行してください)
- **以降のアカウント追加**: `/admin/staff` から追加・パスワード再設定・無効化ができます(ガイドを追加する場合は役割を「ガイド」に設定)
- Vercelに新規で `AUTH_SECRET` を設定していない場合、ログインセッションが機能しません。必ず設定してください(値を変更すると既存のログインセッションは全て無効になります)

### ガイドの出勤可能日について

ガイドが `/guide` で設定した出勤可能日は、現時点では**参考情報**です。お客様向けの予約カレンダー(在庫)には連動しておらず、ガイドが1人も出勤可能日を設定していない日でも、通常通り予約を受け付けます。これは、ガイドの出勤情報がまだ登録されていない状態でいきなり予約を受け付けなくなる事故を避けるためです。

「ガイドが出勤可能な日しか予約を受け付けない」という連動が必要になった場合は、実際の出勤データがある程度そろった段階で追加対応しますので、その際はお知らせください。

## 決済について

現時点では予約はオンライン決済を行わず、「予約のみ」で確定し、当日現地でのお支払いとしています。オンライン決済(クレジットカード等)を追加したい場合は、Stripe等の決済代行サービスの導入をご検討ください。

## ディレクトリ構成(抜粋)

```
prisma/
  schema.prisma       # Activity / ScheduleSlot / Booking モデル
  seed.ts             # サンプルデータ投入スクリプト
src/
  proxy.ts             # /admin・/guide のログイン保護 (Next.js Proxy)
  lib/
    prisma.ts         # Prisma Client (PostgreSQL driver adapter使用)
    booking.ts         # 予約作成ロジック(在庫チェック + メール通知)
    emailTemplates.ts   # メールテンプレートのデフォルト値・変数差し込み
    mailer.ts          # メール送信ユーティリティ
    validation.ts       # zod バリデーションスキーマ
    auth.ts             # セッショントークン(JWT)の発行・検証
    password.ts         # パスワードのハッシュ化・検証
    session.ts           # サーバーコンポーネント用セッション取得ヘルパー
    upload.ts             # 画像アップロード(Vercel Blob)
  app/
    page.tsx            # アクティビティ一覧(トップページ)
    activities/[slug]/  # アクティビティ詳細 + 予約フォーム
    booking/[id]/        # 予約確認ページ
    login/                # スタッフログイン
    guide/                # ガイド専用ページ(出勤可能日カレンダー)
    admin/               # 管理画面(ダッシュボード・販売設定・在庫管理・予約一覧・ガイド出勤可能日・メールテンプレート・スタッフ管理)
```
