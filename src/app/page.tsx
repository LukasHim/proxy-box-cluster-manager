'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Divider,
} from '@heroui/react';
import dayjs from 'dayjs';

export default function AdminPanel() {
  const [status, setStatus] = useState<
    Record<string, { connections: number; sessions: { version: string; ip: string; connectedAt: number }[] }>
  >({});
  const [targetUuid, setTargetUuid] = useState('');
  const [command, setCommand] = useState(
    '{"type":"refresh_config/get_env/process_restart/process_update/push_tasks","data":""}',
  );

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
    await fetch(`/api/push?uuid=${targetUuid}`, {
      method: 'POST',
      body: JSON.stringify(command),
    });
  };

  const generateUuid = () => setTargetUuid(crypto.randomUUID());

  useEffect(() => {
    refresh();
    const timer = setInterval(refresh, 10000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className='max-w-6xl mx-auto space-y-6'>
      <header className='flex flex-wrap justify-between items-center px-2'>
        <h1 className='text-3xl font-bold text-blue-500'>Cluster Commander</h1>
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
              onSelectionChange={keys => {
                const selectedUuid: any = Array.from(keys)[0];
                setTargetUuid(selectedUuid);
              }}>
              <TableHeader>
                <TableColumn>UUID</TableColumn>
                <TableColumn>在线节点数</TableColumn>
                <TableColumn>连接信息</TableColumn>
              </TableHeader>
              <TableBody emptyContent={'暂无在线机器'}>
                {Object.entries(status).map(([uuid, session]) => (
                  <TableRow key={uuid} className='cursor-pointer'>
                    <TableCell className='font-mono'>{uuid}</TableCell>
                    <TableCell>{session.connections}</TableCell>
                    <TableCell className='flex flex-col'>
                      {session.sessions.map((session, index) => {
                        return (
                          <span key={index}>
                            {`${session.version ?? ''} ${session.ip} ${dayjs(session.connectedAt).format('YYYY/MM/DD HH:mm:ss')}`}
                          </span>
                        );
                      })}
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
              <Button color='primary' variant='flat' fullWidth onPress={generateUuid}>
                生成随机 UUID
              </Button>
            </CardBody>
          </Card>

          <Card className='border-1 border-primary/20'>
            <CardHeader>指令下发</CardHeader>
            <Divider />
            <CardBody className='space-y-4'>
              <Input label='JSON 指令内容' value={command} onValueChange={setCommand} variant='underlined' />
              <Button color='primary' fullWidth isDisabled={!targetUuid} onPress={sendCommand}>
                推送
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
