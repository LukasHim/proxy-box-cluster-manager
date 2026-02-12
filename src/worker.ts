// @ts-ignore `.open-next/worker.ts` is generated at build time
import { default as handler } from '../.open-next/worker.js';
import { DurableObject } from 'cloudflare:workers';

export default {
  fetch: handler.fetch,

  async scheduled(event) {
    // ...
  },
} satisfies ExportedHandler<CloudflareEnv>;

/* ------------------------------------------------------------------ */
/* 类型                                                                */
/* ------------------------------------------------------------------ */

type Task = any;

type Config = {
  base?: Record<string, any>;
  [uuid: string]: any;
};

/* ------------------------------------------------------------------ */
/* Durable Object                                                      */
/* ------------------------------------------------------------------ */

export class CommandCenter extends DurableObject {
  /**
   * ⭐ 仅作为「索引缓存」
   * 真正状态来源：ctx.getWebSockets()
   */
  private sessions: Map<string, Set<WebSocket>> = new Map();

  private config: Config = { base: {} };

  /* ------------------------------------------------------------------ */
  /* constructor：恢复 hibernated sockets                                */
  /* ------------------------------------------------------------------ */

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      /* ---------- 恢复 config ---------- */
      this.config = (await this.ctx.storage.get<Config>('config')) || { base: {} };

      /* ---------- ⭐ 恢复所有 socket ---------- */
      for (const ws of this.ctx.getWebSockets()) {
        const uuid = ws.deserializeAttachment() as string;
        if (!uuid) continue;

        if (!this.sessions.has(uuid)) {
          this.sessions.set(uuid, new Set());
        }

        this.sessions.get(uuid)!.add(ws);

        this.bindCleanup(ws, uuid);
      }
    });

    /* ---------- ⭐ ping/pong 不唤醒 DO（省钱神器） ---------- */
    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  /* ================================================================== */
  /* ======================== 业务 API ================================= */
  /* ================================================================== */

  /**
   * 在线统计
   */
  async getStatus() {
    const stats: Record<string, number> = {};

    for (const [uuid, set] of this.sessions) {
      stats[uuid] = set.size;
    }

    return stats;
  }

  /**
   * 推送到某个 uuid 集群
   */
  async push(uuid: string, tasks: Task) {
    const set = this.sessions.get(uuid);
    if (!set) return 0;

    const payload = JSON.stringify(tasks);

    let sent = 0;

    for (const ws of set) {
      try {
        ws.send(payload);
        sent++;
      } catch {
        set.delete(ws);
      }
    }

    return sent;
  }

  /**
   * 广播
   */
  async broadcast(tasks: Task) {
    const payload = JSON.stringify(tasks);

    let sent = 0;

    for (const set of this.sessions.values()) {
      for (const ws of set) {
        try {
          ws.send(payload);
          sent++;
        } catch {
          set.delete(ws);
        }
      }
    }

    return sent;
  }

  /**
   * config
   */
  async getConfig(uuid: string) {
    return {
      ...(this.config.base || {}),
      ...(this.config[uuid] || {}),
    };
  }

  async updateConfig(body: Config) {
    this.config = {
      ...this.config,
      ...body,
    };

    await this.ctx.storage.put('config', this.config);
  }

  /**
   * 踢人
   */
  async kick(uuid: string) {
    const set = this.sessions.get(uuid);
    if (!set) return;

    for (const ws of set) {
      try {
        ws.close(1000, 'kicked');
      } catch {}
    }

    this.sessions.delete(uuid);
  }

  /* ================================================================== */
  /* ======================= WebSocket 入口 ============================= */
  /* ================================================================== */

  async fetch(req: Request) {
    const url = new URL(req.url);

    console.log(url);
    

    if (url.pathname === '/connection') {
      if (req.headers.get('upgrade') === 'websocket') {
        const uuid = url.searchParams.get('uuid') || 'default';

        const pair = new WebSocketPair();
        const client = pair[0];
        const server = pair[1];

        /* ⭐⭐⭐ 关键三步：hibernation */
        this.ctx.acceptWebSocket(server);
        server.serializeAttachment(uuid);

        this.addToSession(uuid, server);

        return new Response(null, {
          status: 101,
          webSocket: client,
        });
      } else {
        return new Response(null, { status: 400 });
      }
    } else {
      return this.handleHttp(req, url);
    }
  }

  /* ================================================================== */
  /* ======================= HTTP Router =============================== */
  /* ================================================================== */

  private async handleHttp(req: Request, url: URL) {
    switch (url.pathname) {
      case '/status':
        return Response.json(await this.getStatus());

      case '/push': {
        const { uuid, tasks } = (await req.json()) as any;
        return Response.json({ sent: await this.push(uuid, tasks) });
      }

      case '/broadcast': {
        const tasks = await req.json();
        return Response.json({ sent: await this.broadcast(tasks) });
      }

      case '/config': {
        const uuid = url.searchParams.get('uuid')!;
        return Response.json(await this.getConfig(uuid));
      }

      case '/config/update': {
        await this.updateConfig(await req.json());
        return new Response('ok');
      }

      case '/kick': {
        const uuid = url.searchParams.get('uuid')!;
        await this.kick(uuid);
        return new Response('ok');
      }

      default:
        return new Response('Not found', { status: 404 });
    }
  }

  /* ================================================================== */
  /* ======================= 内部工具 ================================== */
  /* ================================================================== */

  private addToSession(uuid: string, ws: WebSocket) {
    if (!this.sessions.has(uuid)) {
      this.sessions.set(uuid, new Set());
    }

    this.sessions.get(uuid)!.add(ws);

    this.bindCleanup(ws, uuid);
  }

  private bindCleanup(ws: WebSocket, uuid: string) {
    const cleanup = () => {
      const set = this.sessions.get(uuid);
      set?.delete(ws);

      if (set?.size === 0) {
        this.sessions.delete(uuid);
      }
    };

    ws.addEventListener('close', cleanup);
    ws.addEventListener('error', cleanup);
  }
}
