import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { z } from 'zod';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

const {
  DASH_BIND_HOST = '127.0.0.1',
  DASH_BIND_PORT = '3040',
  OPENCLAW_BASE_URL = 'http://100.78.98.110:18789',
  OPENCLAW_TOKEN = '',
  DASH_API_KEY = '',
  DASH_ALLOWED_ORIGIN = 'https://dashboard.studio-khan.com',
} = process.env;

if (!DASH_API_KEY) {
  console.error('Missing DASH_API_KEY');
  process.exit(1);
}

const fastify = Fastify({ logger: true });

await fastify.register(rateLimit, { max: 120, timeWindow: '1 minute' });
await fastify.register(cors, {
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // curl/server-to-server
    if (origin === DASH_ALLOWED_ORIGIN) return cb(null, true);
    return cb(new Error('CORS blocked'), false);
  },
  credentials: true,
});

fastify.addHook('onRequest', async (req, reply) => {
  if (req.url === '/health') return;
  const key = req.headers['x-api-key'];
  if (!key || key !== DASH_API_KEY) {
    return reply.code(401).send({ error: 'unauthorized' });
  }
});

fastify.get('/health', async () => ({ ok: true }));

fastify.get('/openclaw/status', async () => {
  // Use CLI for now; later we can call the gateway HTTP endpoints directly.
  const { stdout } = await execFileAsync('openclaw', ['status']);
  return { text: stdout };
});

fastify.get('/openclaw/cron/jobs', async () => {
  const { stdout } = await execFileAsync('openclaw', ['cron', 'list']);
  return { text: stdout };
});

fastify.listen({ host: DASH_BIND_HOST, port: Number(DASH_BIND_PORT) });
