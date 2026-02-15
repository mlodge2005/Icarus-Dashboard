import 'dotenv/config';
import Fastify from 'fastify';
import formbody from '@fastify/formbody';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { google } from 'googleapis';

const {
  INTEG_BIND_HOST = '127.0.0.1',
  INTEG_BIND_PORT = '8789',
  INTEG_PUBLIC_BASE_URL = 'https://api.dashboard.studio-khan.com',
  INTEG_API_KEY = '',
  GOOGLE_CLIENT_ID = '',
  GOOGLE_CLIENT_SECRET = '',
  GMAIL_ACCOUNT = 'icarusclawdbot@gmail.com',
  GMAIL_ALLOW_SEND_NO_APPROVAL_TO = 'mlodge2005@gmail.com'
} = process.env;

if (!INTEG_API_KEY) {
  console.error('Missing INTEG_API_KEY');
  process.exit(1);
}
if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.error('Missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');
  process.exit(1);
}

const TOKEN_DIR = path.join(os.homedir(), '.openclaw', 'secrets');
const TOKEN_PATH = path.join(TOKEN_DIR, 'gmail-oauth.json');

async function readTokens() {
  const raw = await fs.readFile(TOKEN_PATH, 'utf8');
  return JSON.parse(raw);
}
async function writeTokens(tokens) {
  await fs.mkdir(TOKEN_DIR, { recursive: true, mode: 0o700 });
  await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens, null, 2), { mode: 0o600 });
}

function oauthClient() {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    `${INTEG_PUBLIC_BASE_URL}/oauth/google/callback`
  );
}

async function authedClient() {
  const client = oauthClient();
  const tokens = await readTokens();
  client.setCredentials(tokens);
  return client;
}

const fastify = Fastify({ logger: true });
await fastify.register(formbody);

// Auth guard (API key) for integration calls. OAuth endpoints are public.
fastify.addHook('onRequest', async (req, reply) => {
  if (req.url.startsWith('/oauth/')) return;
  if (req.url === '/health') return;
  const key = req.headers['x-api-key'];
  if (!key || key !== INTEG_API_KEY) return reply.code(401).send({ error: 'unauthorized' });
});

fastify.get('/health', async () => ({ ok: true }));

fastify.get('/oauth/google/start', async (_req, reply) => {
  const client = oauthClient();
  const state = crypto.randomBytes(16).toString('hex');
  const url = client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.send'
    ],
    state
  });
  // For now we don’t persist state; this is single-user and low risk.
  return reply.redirect(url);
});

fastify.get('/oauth/google/callback', async (req, reply) => {
  const schema = { querystring: { type: 'object', properties: { code: { type: 'string' } }, required: ['code'] } };
  // @ts-ignore
  const code = req.query?.code;
  const client = oauthClient();
  const { tokens } = await client.getToken(code);
  await writeTokens(tokens);
  return reply.type('text/html').send('<h1>OAuth connected.</h1><p>You can close this tab.</p>');
});

fastify.post('/gmail/send', async (req, reply) => {
  const body = req.body || {};
  const to = String(body.to || '').trim();
  const subject = String(body.subject || '').trim();
  const text = String(body.text || '').trim();
  const requireApproval = to.toLowerCase() !== String(GMAIL_ALLOW_SEND_NO_APPROVAL_TO).toLowerCase();

  if (!to || !subject || !text) return reply.code(400).send({ error: 'missing to/subject/text' });

  if (requireApproval) {
    // This endpoint is intended to be called by OpenClaw which will enforce approval.
    return reply.code(409).send({
      error: 'approval_required',
      message: `Send requires approval unless to=${GMAIL_ALLOW_SEND_NO_APPROVAL_TO}`
    });
  }

  const client = await authedClient();
  const gmail = google.gmail({ version: 'v1', auth: client });

  // Build raw RFC 2822 message.
  const lines = [
    `From: ${GMAIL_ACCOUNT}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset="UTF-8"',
    '',
    text
  ];
  const raw = Buffer.from(lines.join('\r\n'))
    .toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');

  const res = await gmail.users.messages.send({
    userId: 'me',
    requestBody: { raw }
  });

  return { ok: true, id: res.data.id };
});

fastify.listen({ host: INTEG_BIND_HOST, port: Number(INTEG_BIND_PORT) });
