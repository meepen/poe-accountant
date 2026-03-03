import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.S3_ENDPOINT;
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

const envForcePathStyle = parseBooleanEnv(process.env.S3_FORCE_PATH_STYLE);
const forcePathStyle =
  envForcePathStyle ?? shouldForcePathStyleForLocalEndpoint(endpoint);

export const s3 = new S3Client({
  endpoint,
  region,
  forcePathStyle,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || "minioadmin",
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || "minioadmin",
  },
});

export const bucketName = process.env.S3_BUCKET_NAME || "poe-accountant-assets";
