'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Divider,
  addToast,
} from '@heroui/react';
import { RefreshCcw } from 'lucide-react';
import dayjs from 'dayjs';
import { useConfig } from '@/contexts/ConfigContext';
import { useTranslation } from 'react-i18next';

export default function DebugPage() {
  const { t } = useTranslation();
  const { apiEndpoint, authToken } = useConfig();
  const [keepaliveData, setKeepaliveData] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<any[]>([]);

  const fetchData = async () => {
    if (!apiEndpoint) return;
    try {
      const headers = { Authorization: 'Bearer ' + authToken };

      const keepaliveRes = await fetch(`${apiEndpoint}/debug/keepalive`, { headers });
      if (keepaliveRes.ok) setKeepaliveData((await keepaliveRes.ok) ? await keepaliveRes.json() : {});

      const messagesRes = await fetch(`${apiEndpoint}/debug/messages`, { headers });
      if (messagesRes.ok) setMessages(await messagesRes.json());
    } catch (e) {
      console.error('Fetch debug data failed', e);
      addToast({ title: t('Failure'), color: 'danger' });
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiEndpoint, authToken]);

  return (
    <div className='max-w-7xl mx-auto space-y-6 pb-12'>
      <header className='flex items-center gap-4 pt-6'>
        <h1 className='text-3xl font-bold text-blue-500 font-sans'>{t('Debug')}</h1>
        <div className='ml-auto'>
          <Button isIconOnly variant='light' onPress={fetchData}>
            <RefreshCcw size={20} />
          </Button>
        </div>
      </header>

      <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
        {/* Keepalive Data */}
        <Card>
          <CardHeader className='font-bold'>Keepalive URLs (KV)</CardHeader>
          <Divider />
          <CardBody>
            <pre className='text-xs font-mono whitespace-pre-wrap bg-default-100 p-2 rounded'>
              {JSON.stringify(keepaliveData, null, 2)}
            </pre>
          </CardBody>
        </Card>

        {/* Messages */}
        <Card>
          <CardHeader className='font-bold'>{t('Recent Messages')} (DO)</CardHeader>
          <Divider />
          <CardBody className='overflow-x-auto'>
            <Table aria-label='Messages table' removeWrapper className='min-w-full'>
              <TableHeader>
                <TableColumn>{t('Time')}</TableColumn>
                <TableColumn>UUID</TableColumn>
                <TableColumn className='pr-4'>{t('Data')}</TableColumn>
              </TableHeader>
              <TableBody emptyContent={t('No messages')}>
                {messages.map((msg, idx) => (
                  <TableRow key={idx}>
                    <TableCell className='whitespace-nowrap'>{dayjs(msg.time).format('MM-DD HH:mm:ss')}</TableCell>
                    <TableCell>{msg.uuid}</TableCell>
                    <TableCell className='pr-4'>
                      <div className='max-w-50 truncate text-xs font-mono' title={JSON.stringify(msg.data)}>
                        {JSON.stringify(msg.data)}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
