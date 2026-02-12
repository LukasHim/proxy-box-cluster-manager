import { getCloudflareContext } from '@opennextjs/cloudflare';
import { CommandCenter } from '@/src/CommandCenter';

async function handleRequest(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const env: any = getCloudflareContext().env;
  const COMMAND_CENTER = env.COMMAND_CENTER as DurableObjectNamespace;
  const stub: DurableObjectStub & CommandCenter = COMMAND_CENTER.getByName('global') as any;

  const uuid = new URL(request.url).searchParams.get('uuid') || 'default';
  switch (path[0]) {
    case '/connection':
      return stub.fetch(request);

    case '/status':
      return Response.json(await stub.getStatus());

    case '/push': {
      const { uuid, tasks } = (await request.json()) as any;
      return Response.json({ sent: await stub.push(uuid, tasks) });
    }

    case '/broadcast': {
      const tasks = await request.json();
      return Response.json({ sent: await stub.broadcast(tasks) });
    }

    case '/config': {
      return Response.json(await stub.getConfig(uuid));
    }

    case '/config/update': {
      await stub.updateConfig(await request.json());
      return new Response('ok');
    }

    case '/kick': {
      await stub.kick(uuid);
      return new Response('ok');
    }

    default:
      return new Response('Not found', { status: 404 });
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
