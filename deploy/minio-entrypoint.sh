#!/bin/sh
set -eu

BUCKET="${S3_BUCKET:-lifemem}"

minio server /data --console-address ":9001" &
MINIO_PID=$!

i=0
until curl -sf http://127.0.0.1:9000/minio/health/live >/dev/null 2>&1; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "MinIO did not become ready in time" >&2
    kill "$MINIO_PID" >/dev/null 2>&1 || true
    exit 1
  fi
  sleep 1
done

if ! mc alias set local http://127.0.0.1:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD"; then
  echo "Failed to configure mc alias (bucket will not be created)" >&2
else
  mc mb -p "local/${BUCKET}" || true
fi

wait "$MINIO_PID"