import { getCloudflareContext } from '@opennextjs/cloudflare';
import { CommandCenter } from '@/worker';
import { use } from 'react';

/**
 * 核心路由处理器：将所有 /api/* 请求转发至单一 Durable Object 实例
 */
async function handleRequest(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params;
  const env: any = getCloudflareContext().env;
  const COMMAND_CENTER = env.COMMAND_CENTER as DurableObjectNamespace;
  const stub: DurableObjectStub & CommandCenter = COMMAND_CENTER.getByName('global') as any;

  const uuid = new URL(request.url).searchParams.get('uuid');
  switch (path[0]) {
    case 'status':
      return new Response(JSON.stringify(await stub.getStatus()));
      break;

    default:
      return stub.fetch(request);
  }
}

export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const DELETE = handleRequest;
