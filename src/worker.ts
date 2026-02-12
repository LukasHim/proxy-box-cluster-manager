// @ts-ignore `.open-next/worker.ts` is generated at build time
import { default as handler } from '../.open-next/worker.js';
import { CommandCenter } from './CommandCenter';

export { CommandCenter };

export default {
  fetch: handler.fetch,

  async scheduled(event) {
    // ...
  },
} satisfies ExportedHandler<CloudflareEnv>;
