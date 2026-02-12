// @ts-ignore `.open-next/worker.ts` is generated at build time
import { default as handler } from '../.open-next/worker.js';
import { CommandCenter } from './CommandCenter';

export { CommandCenter };

export default {
  fetch: (request, env, ctx) => {
    if (new URL(request.url).pathname === '/api/connection') {
      const id = env.COMMAND_CENTER.idFromName('global');
      const stub: CommandCenter & DurableObjectStub = env.COMMAND_CENTER.get(id, { locationHint: 'enam' }) as any;

      return stub.fetch(request);
    }
    return handler.fetch(request, env, ctx);
  },

  async scheduled(event) {
    // ...
  },
} satisfies ExportedHandler<CloudflareEnv>;
