import { DurableObject } from 'cloudflare:workers';

type Config = {
  base?: Record<string, any>;
  [uuid: string]: any;
};

export class CommandCenter extends DurableObject {
  private sessions: Map<string, Set<WebSocket>> = new Map();
  private config: Config = { base: {} };

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      this.config = (await this.ctx.storage.get<Config>('config')) || { base: {} };

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

    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async getStatus() {
    const stats: Record<string, number> = {};

    for (const [uuid, set] of this.sessions) {
      stats[uuid] = set.size;
    }

    return stats;
  }

  async push(uuid: string, tasks: any) {
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

  async broadcast(tasks: any) {
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

  async fetch(request: Request) {
    if (request.headers.get('upgrade') === 'websocket') {
      const uuid = new URL(request.url).searchParams.get('uuid') || 'default';

      const pair = new WebSocketPair();
      const client = pair[0];
      const server = pair[1];

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
  }

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
