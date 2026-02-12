import { getCloudflareContext } from '@opennextjs/cloudflare';
import { CommandCenter } from '@/CommandCenter';

async function handleRequest(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  let path = (await params).path.join('/');
  const env: any = getCloudflareContext().env;
  const COMMAND_CENTER = env.COMMAND_CENTER as DurableObjectNamespace;
  const stub: CommandCenter & DurableObjectStub = COMMAND_CENTER.getByName('global') as any;
  const uuid = new URL(request.url).searchParams.get('uuid') || 'default';

  switch (path) {
    case 'status':
      return Response.json(await stub.getStatus());

    case 'push': {
      if (request.body) {
        const tasks = await request.json();
        return Response.json({ sent: await stub.push(uuid, tasks) });
      }
    }

    case 'broadcast': {
      if (request.body) {
        const tasks = await request.json();
        return Response.json({ sent: await stub.broadcast(tasks) });
      }
    }

    case 'config': {
      return Response.json(await stub.getConfig(uuid));
    }

    case 'config/set': {
      if (request.body) {
        await stub.setConfig(await request.json());
        return new Response('ok');
      }
    }

    case 'config/update': {
      if (request.body) {
        await stub.updateConfig(await request.json());
        return new Response('ok');
      }
    }

    case 'kick': {
      await stub.kick(uuid);
      return new Response('ok');
    }
  }
  return new Response('Not found', { status: 404 });
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
