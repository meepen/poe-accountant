import { AwsClient } from "aws4fetch";
import { AppBindings } from "./bindings";

export function getS3(env: AppBindings) {
  const client = new AwsClient({
    accessKeyId: env.S3_ACCESS_KEY_ID,
    secretAccessKey: env.S3_SECRET_ACCESS_KEY,
    service: "s3",
    region: "auto",
  });

  return {
    async get(key: string) {
      const url = new URL(env.S3_ENDPOINT);

      const normalizedKey = key.startsWith("/") ? key.substring(1) : key;
      const encodedKey = encodeURIComponent(normalizedKey);

      url.pathname = `/${env.S3_BUCKET_NAME}/${encodedKey}`;

      return client.fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/xml",
        },
      });
    },

    async list(limit: number = 10, cursor?: string) {
      const url = new URL(env.S3_ENDPOINT);

      url.pathname = `/${env.S3_BUCKET_NAME}`;

      url.searchParams.set("list-type", "2");
      url.searchParams.set("max-keys", limit.toString());
      if (cursor) {
        url.searchParams.set("continuation-token", cursor);
      }

      return client.fetch(url.toString(), {
        method: "GET",
        headers: {
          "Content-Type": "application/xml",
        },
      });
    },
  };
}
