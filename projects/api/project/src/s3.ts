import { S3Client } from "@aws-sdk/client-s3";
import { AppBindings } from "./bindings";

export function getS3(env: AppBindings) {
  return new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: "auto",
    forcePathStyle: env.S3_FORCE_PATH_STYLE === "true",
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    },
  });
}
