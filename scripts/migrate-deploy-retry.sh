#!/bin/sh
# Wraps `prisma migrate deploy` with retries.
#
# Serverless Postgres providers (e.g. Neon) suspend their compute after a
# period of inactivity and can take longer than Prisma's fixed 10-second
# advisory-lock timeout to wake back up, which makes migrate deploy fail
# with a P1002 error on the very first connection attempt even though
# nothing is actually wrong. The first attempt itself is usually what
# triggers the database to start waking up, so a short retry loop lets a
# later attempt succeed once it's up, without weakening the migration step
# itself (every attempt still runs the real migration).
set -e

max_attempts=5
delay_seconds=8

attempt=1
while [ "$attempt" -le "$max_attempts" ]; do
  echo "prisma migrate deploy: attempt $attempt/$max_attempts"
  if npx prisma migrate deploy; then
    exit 0
  fi

  if [ "$attempt" -lt "$max_attempts" ]; then
    echo "Attempt $attempt failed (often a cold database waking up) — retrying in ${delay_seconds}s..."
    sleep "$delay_seconds"
  fi
  attempt=$((attempt + 1))
done

echo "prisma migrate deploy failed after $max_attempts attempts."
exit 1
