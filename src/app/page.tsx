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
  Textarea,
  Autocomplete,
  AutocompleteItem,
  Chip,
  addToast,
} from '@heroui/react';
import dayjs from 'dayjs';
import { RefreshCcw } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation();
  const { apiEndpoint, authToken, targetUuid, commandType, commandData, updateConfig } = useConfig();
  const [status, setStatus] = useState<
    Record<string, { connections: number; sessions: { version: string; ip: string; connectedAt: number }[] }>
  >({});

  const refresh = async () => {
    if (!apiEndpoint) return; // Wait for endpoint load
    try {
      const res = await fetch(`${apiEndpoint}/status`, {
        headers: {
          Authorization: 'Bearer ' + authToken,
        },
      });
      if (res.ok) {
        const data: any = await res.json();
        setStatus(data);
      }
    } catch (e) {
      console.error('Refresh failed', e);
    }
  };

  useEffect(() => {
    refresh();
  }, [apiEndpoint, authToken]);

  const sendCommand = async () => {
    if (!targetUuid) return;

    // Construct payload
    let payloadData: any = commandData;
    try {
      // Try parsing data as JSON if it looks like one
      const trimmed = commandData.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        payloadData = JSON.parse(trimmed);
      }
    } catch (e) {
      // If parsing fails, treat as string
    }

    const payload = {
      type: commandType,
      data: payloadData,
    };

    const res = await fetch(`${apiEndpoint}/push?uuid=` + targetUuid, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + authToken,
      },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      addToast({ title: t('Command Failed'), color: 'danger' });
      return;
    }
    const data: any = await res.json();
    addToast({
      title: t('Command Sent'),
      description: `${t('Success')}: ${data.sent}`,
      color: 'success',
    });
  };

  const commandOptions = [
    { label: 'Refresh Config', value: 'refresh_config' },
    { label: 'Get Env', value: 'get_env' },
    { label: 'Process Restart', value: 'process_restart' },
    { label: 'Process Update', value: 'process_update' },
    { label: 'Push Tasks', value: 'push_tasks' },
  ];

  return (
    <div className='max-w-7xl mx-auto space-y-6 pb-12'>
      <header className='flex flex-wrap justify-between items-center px-2 pt-6 gap-4'>
        <h1 className='text-3xl font-bold text-blue-500 font-sans'>{t('Dashboard')}</h1>
      </header>

      <div className='grid grid-cols-1 xl:grid-cols-3 gap-6'>
        {/* 集群状态表格 */}
        <Card className='xl:col-span-2'>
          <CardHeader className='flex justify-between items-center gap-3'>
            <div className='flex flex-col'>
              <p className='text-md font-bold'>{t('Active Clusters')}</p>
            </div>
            <Button isIconOnly size='sm' variant='light' onPress={refresh}>
              <RefreshCcw size={18} />
            </Button>
          </CardHeader>
          <CardBody>
            <Table
              aria-label='Cluster status table'
              selectionMode='single'
              removeWrapper={true}
              onSelectionChange={keys => {
                const selectedUuid: any = Array.from(keys)[0];
                updateConfig({ targetUuid: selectedUuid });
              }}>
              <TableHeader>
                <TableColumn>UUID</TableColumn>
                <TableColumn>{t('Connections')}</TableColumn>
                <TableColumn className='pr-4'>{t('Details')}</TableColumn>
              </TableHeader>
              <TableBody emptyContent={t('Active Clusters Empty')}>
                {Object.entries(status)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([uuid, session]) => (
                    <TableRow key={uuid} className='cursor-pointer'>
                      <TableCell className='font-mono'>{uuid}</TableCell>
                      <TableCell>{session.connections}</TableCell>
                      <TableCell className='pr-4'>
                        <div className='flex flex-col gap-2 min-w-75'>
                          {session.sessions.map((session, index) => {
                            return (
                              <div key={index} className='flex items-center gap-2 text-small'>
                                <Chip size='sm' variant='flat' color='primary'>
                                  {session.version || 'Unknown'}
                                </Chip>
                                <span className='font-bold'>{session.ip}</span>
                                <span className='text-default-400 text-tiny text-nowrap'>
                                  {(() => {
                                    const now = dayjs();
                                    const date = dayjs(session.connectedAt);
                                    return date.year() === now.year()
                                      ? date.format('MM-DD HH:mm:ss')
                                      : date.format('YYYY-MM-DD HH:mm:ss');
                                  })()}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>

        {/* Command & Control Panel */}
        <div className='space-y-6'>
          <Card className='border-1 border-primary/20'>
            <CardHeader className='font-bold'>{t('Command Push')}</CardHeader>
            <Divider />
            <CardBody className='space-y-4'>
              <Input
                label='UUID'
                placeholder=''
                value={targetUuid}
                onValueChange={val => updateConfig({ targetUuid: val })}
              />

              <Autocomplete
                label={t('Type')}
                placeholder={t('Type Description')}
                defaultItems={commandOptions}
                selectedKey={commandOptions.some(opt => opt.value === commandType) ? commandType : null}
                inputValue={commandOptions.some(opt => opt.value === commandType) ? undefined : commandType}
                onSelectionChange={key => {
                  if (key) updateConfig({ commandType: key as string });
                }}
                onInputChange={val => {
                  const match = commandOptions.find(opt => opt.label === val);
                  if (match) {
                    updateConfig({ commandType: match.value });
                  } else {
                    updateConfig({ commandType: val });
                  }
                }}
                allowsCustomValue>
                {item => <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>}
              </Autocomplete>

              <Textarea
                label={t('Data')}
                placeholder={t('Data Description')}
                value={commandData}
                onValueChange={val => updateConfig({ commandData: val })}
                minRows={3}
              />

              <Button color='primary' fullWidth isDisabled={!targetUuid} onPress={sendCommand}>
                {t('Push')}
              </Button>
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
