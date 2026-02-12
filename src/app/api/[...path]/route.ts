import { getCloudflareContext } from '@opennextjs/cloudflare';
import { CommandCenter } from '@/CommandCenter';

async function handleRequest(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  let path = (await params).path.join('/');
  const env: any = getCloudflareContext().env;
  const COMMAND_CENTER = env.COMMAND_CENTER as DurableObjectNamespace;
  const id = COMMAND_CENTER.idFromName('global');
  const stub: CommandCenter & DurableObjectStub = COMMAND_CENTER.get(id, { locationHint: 'enam' }) as any;
  const uuid = new URL(request.url).searchParams.get('uuid') || 'default';
  try {
    switch (path) {
      case 'status':
        if (request.method === 'GET') {
          return Response.json(await stub.getStatus());
        }

      case 'push':
        if (request.method === 'POST') {
          const tasks = await request.json();
          return Response.json({ sent: await stub.push(uuid, tasks) });
        }

      case 'broadcast':
        if (request.method === 'POST') {
          const tasks = await request.json();
          return Response.json({ sent: await stub.broadcast(tasks) });
        }

      case 'config':
        if (request.method === 'GET') {
          return Response.json(await stub.getConfig(uuid));
        } else if (request.method === 'POST') {
          await stub.updateConfig(await request.json());
          return new Response('ok');
        }

      case 'config/raw':
        if (request.method === 'GET') {
          return Response.json(await stub.getRawConfig());
        } else if (request.method === 'POST') {
          await stub.setRawConfig(await request.json());
          return new Response('ok');
        }

      case 'kick':
        if (request.method === 'GET') {
          await stub.kick(uuid);
          return new Response('ok');
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
