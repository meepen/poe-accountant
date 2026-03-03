process.env.NODE_ENV ??= "test";
process.env.DATABASE_URL ??=
  "postgres://postgres:postgres@localhost:5432/poe_accountant_test";
process.env.VALKEY_URL ??= "redis://localhost:6379";
