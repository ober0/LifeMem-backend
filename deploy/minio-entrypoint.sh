#!/bin/sh
set -e


export MINIO_ROOT_USER="${MINIO_ROOT_USER:-${S3_ACCESS_KEY_ID}}"
export MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-${S3_SECRET_ACCESS_KEY}}"
BUCKET="${S3_BUCKET:-lifemem}"

if [ -z "$MINIO_ROOT_USER" ] || [ -z "$MINIO_ROOT_PASSWORD" ]; then
  echo "MINIO_ROOT_USER/S3_ACCESS_KEY_ID and MINIO_ROOT_PASSWORD/S3_SECRET_ACCESS_KEY are required" >&2
  exit 1
fi

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

mc alias set local http://127.0.0.1:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" || echo "mc alias failed" >&2
mc mb -p "local/${BUCKET}" || true

wait "$MINIO_PID" || true