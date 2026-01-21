import { Buffer } from "node:buffer";
import { Hono } from "hono";
import { AppEnv } from "../bindings";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getValkey } from "../valkey";
import { setCookie } from "hono/cookie";
import { fetchWrapper } from "../fetch-wrapper";
import { getDb } from "../db";
import { createOrUpdateUser, createSession, getSessionUser } from "../db/user";
import { sessionCookieName } from "@meepen/poe-accountant-api-schema/api/user.dto";

export const redirect = new Hono<AppEnv>();

const redisRedirectSchema = z.object({
  redirect_to: z.url(),
  code_verifier: z.string(),
});

const authorizationCodeErrorSchema = z.object({
  error: z.string(),
  error_description: z.string().optional(),
  error_uri: z.string().optional(),
});

const authorizationCodeSuccessSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  token_type: z.string(),
  scope: z.string(),
  username: z.string(),
  sub: z.string(),
  refresh_token: z.string().optional(),
});

const redirectQuerySchema = z.object({
  code: z.string(),
  state: z.string(),
});

redirect.get("/", zValidator("query", redirectQuerySchema), async (c) => {
  const { code, state } = c.req.valid("query");
  // Retrieve state information from redis
  const redis = getValkey(c.env);
  const stateData = await redis.get<string>(`oauth2:state:${state}`);
  if (!stateData) {
    return c.json({ error: "Invalid or expired state" }, 400);
  }

  const { redirect_to, code_verifier } = redisRedirectSchema.parse(stateData);

  // await redis.del(`oauth2:state:${state}`);

  // Exchange code with fetch()
  const response = await fetchWrapper(
    c.env,
    "https://www.pathofexile.com/oauth/token",
    {
      method: "POST",
      headers: {
        "User-Agent": "PoEAccountant/1.0",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: c.env.PATHOFEXILE_CLIENT_ID,
        client_secret: c.env.PATHOFEXILE_CLIENT_SECRET,
        grant_type: "authorization_code",
        code,
        redirect_uri: c.env.PATHOFEXILE_REDIRECT_URL,
        code_verifier,
      }),
    },
  );

  const text = await response.text();

  if (!response.ok) {
    try {
      const details = authorizationCodeErrorSchema.parse(JSON.parse(text));
      return c.json({ error: "Failed to exchange code", details }, 400);
    } catch {
      return c.json({ error: "Failed to exchange code" }, 400);
    }
  }

  const tokenData = authorizationCodeSuccessSchema.parse(JSON.parse(text));
  // Store user information
  const db = getDb(c.env);

  const user = await createOrUpdateUser(db, {
    id: tokenData.sub,
    username: tokenData.username,
    scope: tokenData.scope,
    accessToken: tokenData.access_token,
    refreshToken: tokenData.refresh_token ?? null,
    tokenExpiresAt: new Date(Date.now() + tokenData.expires_in * 1000),
  });

  const session = await createSession(redis, {
    expiresAt: user.tokenExpiresAt.toISOString(),
    id: user.id,
    username: user.username,
    authorizationToken: crypto.randomUUID(),
  });

  // Set session cookie for current domain and redirect
  setCookie(c, sessionCookieName, session.authorizationToken, {
    maxAge: tokenData.expires_in,
    httpOnly: true,
    secure: true,
    sameSite: "Lax",
    domain: new URL(c.env.FRONTEND_URL).hostname,
  });

  console.log(c.env.FRONTEND_URL, redirect_to);
  // Ensure redirect is relative to frontend URL
  return c.redirect(new URL(new URL(redirect_to).pathname, c.env.FRONTEND_URL));
});

const loginSchema = z.object({
  redirect_to: z.url(),
});

redirect.get("/login", zValidator("query", loginSchema), async (c) => {
  const { redirect_to } = c.req.valid("query");

  const user = await getSessionUser(getValkey(c.env), c);
  if (user) {
    // User is already logged in, redirect immediately
    return c.redirect(redirect_to);
  }

  const redis = getValkey(c.env);

  const state = crypto.randomUUID();
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const code_verifier = Buffer.from(verifierBytes).toString("base64url");
  const code_challenge = Buffer.from(
    await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(code_verifier),
    ),
  ).toString("base64url");

  await redis.set(
    `oauth2:state:${state}`,
    JSON.stringify({
      redirect_to,
      code_verifier,
    } as z.infer<typeof redisRedirectSchema>),
    { ex: 300 },
  );

  const params = new URLSearchParams({
    client_id: c.env.PATHOFEXILE_CLIENT_ID,
    response_type: "code",
    scope: "account:profile account:leagues account:stashes",
    state,
    redirect_uri: c.env.PATHOFEXILE_REDIRECT_URL,
    code_challenge,
    code_challenge_method: "S256",
  });

  return c.redirect(
    `https://www.pathofexile.com/oauth/authorize?${params.toString()}`,
  );
});
