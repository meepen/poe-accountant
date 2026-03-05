import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.ASSETS_S3_ENDPOINT;
const region = "us-east-1"; // MinIO default

function parseBooleanEnv(value: string | undefined): boolean | undefined {
  if (value == null) {
    return undefined;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function shouldForcePathStyleForLocalEndpoint(
  endpointValue: string | undefined,
): boolean {
  if (!endpointValue) {
    return false;
  }

  try {
    const host = new URL(endpointValue).hostname.toLowerCase();
    return host === "localhost" || host === "minio" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

const envForcePathStyle = parseBooleanEnv(
  process.env.ASSETS_S3_FORCE_PATH_STYLE,
);

function createS3Client(options: {
  endpoint: string | undefined;
  accessKeyId: string | undefined;
  secretAccessKey: string | undefined;
}): S3Client {
  return new S3Client({
    endpoint: options.endpoint,
    region,
    forcePathStyle:
      envForcePathStyle ??
      shouldForcePathStyleForLocalEndpoint(options.endpoint),
    credentials: {
      accessKeyId: options.accessKeyId || "minioadmin",
      secretAccessKey: options.secretAccessKey || "minioadmin",
    },
  });
}

export const s3 = createS3Client({
  endpoint,
  accessKeyId: process.env.ASSETS_S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.ASSETS_S3_SECRET_ACCESS_KEY,
});

export const bucketName =
  process.env.ASSETS_S3_BUCKET_NAME || "poe-accountant-assets";

export const cdnS3 =
  process.env.CDN_S3_ENDPOINT ||
  process.env.CDN_S3_ACCESS_KEY_ID ||
  process.env.CDN_S3_SECRET_ACCESS_KEY
    ? createS3Client({
        endpoint: process.env.CDN_S3_ENDPOINT,
        accessKeyId: process.env.CDN_S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.CDN_S3_SECRET_ACCESS_KEY,
      })
    : s3;

export const cdnBucketName = process.env.CDN_S3_BUCKET_NAME || bucketName;
