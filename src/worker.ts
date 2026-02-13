// @ts-ignore `.open-next/worker.ts` is generated at build time
import { default as handler } from '../.open-next/worker.js';
import { CommandCenter } from './CommandCenter';
import dotenv from 'dotenv';
dotenv.config();

export { CommandCenter };

export default {
  fetch: (request, env, ctx) => {
    if (new URL(request.url).pathname.startsWith('/api/connection')) {
      if (process.env.AUTH_TOKEN && process.env.AUTH_TOKEN !== request.headers.get('Authorization')?.split(' ')[1]) {
        return new Response('Unauthorized', { status: 401 });
      }
      const id = env.COMMAND_CENTER.idFromName('global');
      const stub: CommandCenter & DurableObjectStub = env.COMMAND_CENTER.get(id, { locationHint: 'enam' }) as any;

      return stub.fetch(request);
    }
    return handler.fetch(request, env, ctx);
  },

  async scheduled(event, env, ctx) {
    const id = env.COMMAND_CENTER.idFromName('global');
    const stub: CommandCenter & DurableObjectStub = env.COMMAND_CENTER.get(id, { locationHint: 'enam' }) as any;

    try {
      const keepaliveMap: Record<string, string> = stub.getAllKeepalive();

      for (const [uuid, url] of Object.entries(keepaliveMap)) {
        if (!url) continue;

        ctx.waitUntil(
          fetch(url, {
            method: 'GET',
            cf: {
              cacheTtl: 0,
            },
          }).catch(() => {}),
        );
      }
    } catch (err) {
      console.error('scheduled keepalive error:', err);
    }
  },
} satisfies ExportedHandler<CloudflareEnv>;
