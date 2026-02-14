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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Tooltip,
} from '@heroui/react';
import { RefreshCcw, Copy, Check, Eye } from 'lucide-react';
import dayjs from 'dayjs';
import { useConfig } from '@/contexts/ConfigContext';
import { useTranslation } from 'react-i18next';

export default function DebugPage() {
  const { t } = useTranslation();
  const { apiEndpoint, authToken } = useConfig();
  const [keepaliveData, setKeepaliveData] = useState<Record<string, string>>({});
  const [messages, setMessages] = useState<any[]>([]);

  // Modal Control
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  // Copy Status
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const fetchData = async () => {
    if (!apiEndpoint) return;
    try {
      const headers = { Authorization: 'Bearer ' + authToken };

      const keepaliveRes = await fetch(`${apiEndpoint}/debug/keepalive`, { headers });
      if (keepaliveRes.ok) setKeepaliveData(await keepaliveRes.json());

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

  const handleCopy = (data: any, id: number) => {
    const text = JSON.stringify(data, null, 2);
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast({ title: t('Success'), color: 'success' });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleViewDetails = (msg: any) => {
    setSelectedMessage(msg);
    onOpen();
  };

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

      <div className='flex flex-col gap-6'>
        {/* Keepalive Data */}
        <Card>
          <CardHeader className='font-bold'>Keepalive URLs (KV)</CardHeader>
          <Divider />
          <CardBody>
            <pre className='text-sm font-mono whitespace-pre-wrap bg-default-100 p-2 rounded'>
              {JSON.stringify(keepaliveData, null, 2)}
            </pre>
          </CardBody>
        </Card>

        {/* Messages */}
        <Card className='w-full'>
          <CardHeader className='font-bold'>{t('Recent Messages')} (DO)</CardHeader>
          <Divider />
          <CardBody>
            <Table aria-label='Messages table' removeWrapper className='w-full table-fixed'>
              <TableHeader>
                <TableColumn width={160}>{t('Time')}</TableColumn>
                <TableColumn width={160}>UUID</TableColumn>
                <TableColumn>{t('Data')}</TableColumn>
                <TableColumn align='center' width={100}>
                  {t('Actions')}
                </TableColumn>
              </TableHeader>
              <TableBody emptyContent={t('No messages')}>
                {messages.map((msg, idx) => (
                  <TableRow key={idx}>
                    <TableCell className='whitespace-nowrap'>{dayjs(msg.time).format('MM-DD HH:mm:ss')}</TableCell>
                    <TableCell className='font-mono text-xs truncate'>{msg.uuid}</TableCell>
                    <TableCell>
                      <div className='text-sm font-mono text-default-500 line-clamp-2 break-all'>
                        {JSON.stringify(msg.data)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2 justify-center'>
                        <Tooltip content={t('View')}>
                          <Button isIconOnly size='sm' variant='light' onPress={() => handleViewDetails(msg)}>
                            <Eye size={16} />
                          </Button>
                        </Tooltip>
                        <Tooltip content={t('Copy')}>
                          <Button isIconOnly size='sm' variant='light' onPress={() => handleCopy(msg.data, idx)}>
                            {copiedId === idx ? <Check size={16} className='text-success' /> : <Copy size={16} />}
                          </Button>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      </div>

      {/* Message Detail Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size='5xl' scrollBehavior='inside'>
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className='flex flex-col gap-1'>
                {t('Message Details')}
                <span className='text-tiny font-normal text-default-400'>
                  {selectedMessage ? dayjs(selectedMessage.time).format('YYYY-MM-DD HH:mm:ss.SSS') : ''}
                </span>
              </ModalHeader>
              <ModalBody>
                {selectedMessage && (
                  <div className='space-y-4'>
                    <div className='flex flex-col gap-1'>
                      <span className='font-bold uppercase text-default-500'>UUID</span>
                      <code className='bg-default-100 p-4 rounded-lg text-sm'>{selectedMessage.uuid}</code>
                    </div>
                    <div className='flex flex-col gap-1'>
                      <span className='font-bold uppercase text-default-500'>{t('Data')}</span>
                      <pre className='bg-default-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-125'>
                        {JSON.stringify(selectedMessage.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color='primary' variant='flat' onPress={onClose}>
                  {t('Close')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
