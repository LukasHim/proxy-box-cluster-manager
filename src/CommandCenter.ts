import { DurableObject } from 'cloudflare:workers';

type Config = {
  base?: Record<string, any>;
  [uuid: string]: any;
};

type Session = {
  ws: WebSocket;
  uuid: string;
  version?: string;
  ip?: string;
  connectedAt: number;
};

export class CommandCenter extends DurableObject {
  private sessions: Map<string, Set<Session>> = new Map();
  private config: Config = {};
  private messageList: {
    uuid?: string;
    data?: any;
    time?: number;
  }[] = [];

  constructor(ctx: DurableObjectState, env: any) {
    super(ctx, env);

    this.ctx.blockConcurrencyWhile(async () => {
      this.config = (await this.ctx.storage.get<Config>('config')) || {};

      // 恢复 messageList
      const rawMessages = (await this.ctx.storage.get<any>('messageList')) || [];
      this.messageList = rawMessages;

      // 恢复 websocket
      for (const ws of this.ctx.getWebSockets()) {
        const session: Session = ws.deserializeAttachment();
        if (!session) continue;

        if (!this.sessions.has(session.uuid)) {
          this.sessions.set(session.uuid, new Set());
        }

        this.sessions.get(session.uuid)!.add({
          ...session,
          ws,
        });
      }
    });

    this.ctx.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }

  async getStatus() {
    const stats: Record<
      string,
      { connections: number; sessions: { version: string; ip: string; connectedAt: number }[] }
    > = {};

    for (const [uuid, set] of this.sessions) {
      stats[uuid] = {
        connections: set.size,
        sessions: Array.from(set).map(s => ({
          version: s.version,
          ip: s.ip,
          connectedAt: s.connectedAt,
        })) as any,
      };
    }

    return stats;
  }
  async push(uuid: string, msg: any) {
    const set = this.sessions.get(uuid);
    if (!set) return 0;

    const payload = JSON.stringify(msg);

    let sent = 0;

    for (const session of set) {
      try {
        session.ws.send(payload);
        sent++;
      } catch {}
    }

    return sent;
  }
  async broadcast(msg: any) {
    const payload = JSON.stringify(msg);

    let sent = 0;

    for (const set of this.sessions.values()) {
      for (const session of set) {
        try {
          session.ws.send(payload);
          sent++;
        } catch {}
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

    return this.ctx.storage.put('config', this.config);
  }
  async getRawConfig() {
    return this.config;
  }
  async setRawConfig(body: Config) {
    this.config = body;

    return this.ctx.storage.put('config', this.config);
  }

  private async persistMessages() {
    await this.ctx.storage.put('messageList', this.messageList);
  }
  private async pushMessage(uuid: string, msg: any) {
    let arr = this.messageList;
    if (!arr) {
      arr = [];
    }
    arr.push({ uuid, data: msg, time: Date.now() });
    if (arr.length > 50) {
      arr.shift();
    }
    await this.persistMessages();
  }
  getAllMessages() {
    return this.messageList;
  }
  deleteAllStorage() {
    this.ctx.storage.deleteAll();
  }

  async kick(uuid: string) {
    const set = this.sessions.get(uuid);
    if (!set) return;

    for (const session of set) {
      try {
        session.ws.close(1000);
      } catch {}
    }

    this.sessions.delete(uuid);
  }

  async fetch(request: Request) {
    if (request.headers.get('upgrade') !== 'websocket') {
      return new Response('Expected websocket', { status: 426 });
    }

    const url = new URL(request.url);
    const uuid = url.searchParams.get('uuid') || 'default';
    const version = url.searchParams.get('version') || 'unknown';
    const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown';
    const connectedAt = Date.now();

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    this.ctx.acceptWebSocket(server);

    server.serializeAttachment({ uuid, version, ip, connectedAt } as Session);
    this.addSession(uuid, server, connectedAt, version, ip);

    return new Response(null, { status: 101, webSocket: client });
  }

  private addSession(uuid: string, ws: WebSocket, connectedAt: number, version?: string, ip?: string) {
    if (!this.sessions.has(uuid)) {
      this.sessions.set(uuid, new Set());
    }

    const set = this.sessions.get(uuid)!;
    const session: Session = {
      ws,
      uuid,
      version,
      ip,
      connectedAt,
    };
    set.add(session);
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    const session: Session = ws.deserializeAttachment();
    const uuid = session.uuid;
    try {
      const msg = JSON.parse(message.toString());
      switch (msg.type) {
        case 'keepalive_url': {
          let keepaliveUrls = await this.env.KV.get('keepaliveUrls');
          if (!keepaliveUrls) keepaliveUrls = '{}';
          let keepaliveMap: Record<string, string> = JSON.parse(keepaliveUrls);
          this.env.KV.put('keepaliveUrls', JSON.stringify({ ...keepaliveMap, [uuid]: msg.data }));
          break;
        }

        default:
          await this.pushMessage(uuid, msg);
          break;
      }
    } catch (error) {}
  }
  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    this.removeSession(ws);
  }
  async webSocketError(ws: WebSocket, error: unknown) {
    this.removeSession(ws);
  }
  private removeSession(ws: WebSocket) {
    for (const [uuid, set] of this.sessions) {
      for (const s of set) {
        if (s.ws === ws) {
          set.delete(s);
        }
      }
      if (set.size === 0) this.sessions.delete(uuid);
    }
  }
}
