'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Badge,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  Chip,
} from '@heroui/react';

export default function AdminPanel() {
  const [status, setStatus] = useState<Record<string, number>>({});
  const [targetUuid, setTargetUuid] = useState('');
  const [command, setCommand] = useState('[{"type":"MSG","details":"Hello"}]');

  const refresh = async () => {
    try {
      const res = await fetch('/api/status');
      const data: any = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Refresh failed', e);
    }
  };

  const sendCommand = async () => {
    if (!targetUuid) return;
    await fetch(`/api/broadcast?uuid=${targetUuid}`, {
      method: 'POST',
      body: command,
    });
    alert('指令已送达');
  };

  const generateUuid = () => setTargetUuid(`node-${Math.random().toString(36).slice(-6)}`);

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      <header className='flex flex-wrap justify-between items-center px-2'>
        <h1 className='text-3xl font-bold text-blue-500'>Cluster Commander</h1>
        <Chip color='success' variant='dot'>
          Cloudflare Durable Object Online
        </Chip>
      </header>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* 集群状态表格 */}
        <Card className='md:col-span-2'>
          <CardHeader className='flex gap-3'>
            <div className='flex flex-col'>
              <p className='text-md'>活跃集群列表</p>
              <p className='text-small text-default-500'>点击行以选择目标机器</p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody>
            <Table
              aria-label='Cluster status table'
              selectionMode='single'
              onSelectionChange={keys => setTargetUuid(Array.from(keys)[0] as string)}>
              <TableHeader>
                <TableColumn>UUID</TableColumn>
                <TableColumn>在线节点数</TableColumn>
                <TableColumn>状态</TableColumn>
              </TableHeader>
              <TableBody emptyContent={'暂无在线机器'}>
                {Object.entries(status).map(([uuid, count]) => (
                  <TableRow key={uuid} className='cursor-pointer'>
                    <TableCell className='font-mono'>{uuid}</TableCell>
                    <TableCell>{count}</TableCell>
                    <TableCell>
                      <Badge content='' color={count > 0 ? 'success' : 'danger'} shape='circle'>
                        {count > 0 ? '在线' : '离线'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* 控制面板 */}
        <div className='space-y-6'>
          <Card>
            <CardHeader>机器管理</CardHeader>
            <Divider />
            <CardBody className='space-y-4'>
              <Input
                label='目标 UUID'
                placeholder='手动输入或自动生成'
                value={targetUuid}
                onValueChange={setTargetUuid}
                variant='bordered'
              />
              <Button color='primary' variant='flat' fullWidth onClick={generateUuid}>
                生成随机 UUID
              </Button>
            </CardBody>
          </Card>

          <Card className='border-1 border-primary/20'>
            <CardHeader>指令下发</CardHeader>
            <Divider />
            <CardBody className='space-y-4'>
              <Input label='JSON 指令内容' value={command} onValueChange={setCommand} variant='underlined' />
              <Button color='primary' fullWidth isDisabled={!targetUuid} onClick={sendCommand}>
                立即推送任务
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
