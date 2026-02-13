import { getCloudflareContext } from '@opennextjs/cloudflare';
import { CommandCenter } from '@/CommandCenter';
import dotenv from 'dotenv';
dotenv.config();

async function handleRequest(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (process.env.AUTH_TOKEN && process.env.AUTH_TOKEN !== request.headers.get('Authorization')?.split(' ')[1]) {
    return new Response('Unauthorized', { status: 401 });
  }
  let path = (await params).path.join('/');
  const env: any = getCloudflareContext().env;
  const COMMAND_CENTER = env.COMMAND_CENTER as DurableObjectNamespace;
  const id = COMMAND_CENTER.idFromName('global');
  const stub: CommandCenter & DurableObjectStub = COMMAND_CENTER.get(id, { locationHint: 'enam' }) as any;
  const uuid = new URL(request.url).searchParams.get('uuid') || 'default';
  try {
    switch (path) {
      case 'status': {
        if (request.method === 'GET') {
          return Response.json(await stub.getStatus());
        }
        break;
      }

      case 'push': {
        if (request.method === 'POST') {
          const tasks = await request.json();
          return Response.json({ sent: await stub.push(uuid, tasks) });
        }
        break;
      }

      case 'broadcast': {
        if (request.method === 'POST') {
          const tasks = await request.json();
          return Response.json({ sent: await stub.broadcast(tasks) });
        }
        break;
      }

      case 'config': {
        if (request.method === 'GET') {
          return Response.json(await stub.getConfig(uuid));
        } else if (request.method === 'POST') {
          await stub.updateConfig(await request.json());
          return new Response('ok');
        }
        break;
      }

      case 'config/raw': {
        if (request.method === 'GET') {
          return Response.json(await stub.getRawConfig());
        } else if (request.method === 'POST') {
          await stub.setRawConfig(await request.json());
          return new Response('ok');
        }
        break;
      }

      case 'messages': {
        if (uuid) {
          return Response.json(stub.getMessages(uuid));
        }
        return Response.json(stub.getAllMessages());
      }

      case 'keepalive': {
        return Response.json(stub.getAllKeepalive());
      }

      case 'kick': {
        if (request.method === 'GET') {
          await stub.kick(uuid);
          return new Response('ok');
        }
        break;
      }
    }
  } catch (error: any) {
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
  return new Response('Not found', { status: 404 });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
