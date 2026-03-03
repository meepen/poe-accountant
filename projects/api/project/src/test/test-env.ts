export const testEnv = {
  CORS_ORIGIN: "*",
  FRONTEND_URL: "https://app.example.com",
  PATHOFEXILE_CLIENT_ID: "test-client-id",
  PATHOFEXILE_CLIENT_SECRET: "test-client-secret",
  PATHOFEXILE_REDIRECT_URL: "https://app.example.com/redirect",
  VALKEY_PROXY_URL: "https://example.com/redis",
  VALKEY_TOKEN: "test-token",
  HYPERDRIVE: {
    connectionString: "postgres://postgres:postgres@localhost:5432/postgres",
  },
  S3_ENDPOINT: "https://example.com/s3",
  S3_BUCKET_NAME: "test-bucket",
  S3_ACCESS_KEY_ID: "test-access-key",
  S3_SECRET_ACCESS_KEY: "test-secret-key",
} as never;
