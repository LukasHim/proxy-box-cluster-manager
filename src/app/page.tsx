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
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  Chip,
  addToast,
} from '@heroui/react';
import dayjs from 'dayjs';
import { RefreshCcw, Save, Plus, Trash2, Settings } from 'lucide-react';

export default function AdminPanel() {
  const [status, setStatus] = useState<
    Record<string, { connections: number; sessions: { version: string; ip: string; connectedAt: number }[] }>
  >({});
  const [targetUuid, setTargetUuid] = useState('');

  // Command state
  const [commandType, setCommandType] = useState<string>('');
  const [commandData, setCommandData] = useState('');

  // Config state
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [baseConfig, setBaseConfig] = useState('{}');
  const [uuidConfigs, setUuidConfigs] = useState<{ uuid: string; config: string }[]>([]);

  // Settings Modal
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  // LocalStorage Persistence
  const STORAGE_KEY = 'proxy-box-cluster-manager/config';

  useEffect(() => {
    const savedConfig = localStorage.getItem(STORAGE_KEY);
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        if (parsed.apiEndpoint) {
          setApiEndpoint(parsed.apiEndpoint);
        } else {
          setApiEndpoint('/api');
        }
        if (parsed.authToken) setAuthToken(parsed.authToken);
        if (parsed.targetUuid) setTargetUuid(parsed.targetUuid);
        if (parsed.commandType) setCommandType(parsed.commandType);
        if (parsed.commandData) setCommandData(parsed.commandData);
      } catch (e) {
        console.error('Failed to parse local storage config', e);
      }
    }
  }, []);

  useEffect(() => {
    const configToSave = {
      apiEndpoint,
      authToken,
      targetUuid,
      commandType,
      commandData,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(configToSave));
  }, [apiEndpoint, authToken, targetUuid, commandType, commandData]);

  const refresh = async () => {
    if (!apiEndpoint) return; // Wait for endpoint load
    try {
      const res = await fetch(`${apiEndpoint}/status`, {
        headers: {
          Authorization: 'Bearer ' + authToken,
        },
      });
      const data: any = await res.json();
      setStatus(data);
    } catch (e) {
      console.error('Refresh failed', e);
    }
  };

  const fetchConfig = async () => {
    if (!apiEndpoint) return;
    try {
      const res = await fetch(`${apiEndpoint}/config/raw`, {
        headers: {
          Authorization: 'Bearer ' + authToken,
        },
      });
      const data: any = await res.json();
      const { base, ...rest } = data;
      setBaseConfig(JSON.stringify(base || {}, null, 2));
      setUuidConfigs(
        Object.entries(rest).map(([uuid, config]) => ({
          uuid,
          config: JSON.stringify(config, null, 2),
        })),
      );
    } catch (e) {
      console.error('Fetch config failed', e);
    }
  };

  const saveConfig = async () => {
    try {
      let parsedBase = {};
      try {
        parsedBase = JSON.parse(baseConfig);
      } catch (e) {
        addToast({ title: 'Base 配置 JSON 错误', color: 'danger' });
        return;
      }

      const newConfig: any = { base: parsedBase };
      for (const item of uuidConfigs) {
        if (!item.uuid.trim()) {
          addToast({ title: 'UUID 不能为空', color: 'danger' });
          return;
        }
        try {
          newConfig[item.uuid] = JSON.parse(item.config);
        } catch (e) {
          addToast({ title: `UUID: ${item.uuid} 配置 JSON 错误`, color: 'danger' });
          return;
        }
      }

      const res = await fetch(`${apiEndpoint}/config/raw`, {
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + authToken,
        },
        body: JSON.stringify(newConfig),
      });
      if (!res.ok) {
        addToast({ title: '保存失败', color: 'danger' });
        return;
      }
      addToast({ title: '保存成功', color: 'success' });
      fetchConfig(); // Refresh to ensure sync
    } catch (e) {
      console.error('Save config failed', e);
      addToast({ title: '保存失败', color: 'danger' });
    }
  };

  const addUuidConfig = () => {
    setUuidConfigs([{ uuid: 'new-uuid', config: '{}' }, ...uuidConfigs]);
  };

  const removeUuidConfig = (index: number) => {
    const newConfigs = [...uuidConfigs];
    newConfigs.splice(index, 1);
    setUuidConfigs(newConfigs);
  };

  const updateUuidConfig = (index: number, newConfigStr: string) => {
    const newConfigs = [...uuidConfigs];
    newConfigs[index].config = newConfigStr;
    setUuidConfigs(newConfigs);
  };

  const updateUuidName = (index: number, newName: string) => {
    const newConfigs = [...uuidConfigs];
    newConfigs[index].uuid = newName;
    setUuidConfigs(newConfigs);
  };

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
      addToast({ title: '命令发送失败', color: 'danger' });
      return;
    }
    const data: any = await res.json();
    addToast({
      title: '命令已发送',
      description: `已发送：${data.sent}`,
      color: 'success',
    });
  };

  useEffect(() => {
    refresh();
    fetchConfig();
    // Auto-refresh removed
    // const timer = setInterval(refresh, 10000);
    // return () => clearInterval(timer);
  }, [apiEndpoint]);

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
        <h1 className='text-3xl font-bold text-blue-500'>Cluster Commander</h1>
        <Button isIconOnly variant='ghost' onPress={onOpen}>
          <Settings />
        </Button>
      </header>

      {/* Settings Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader className='flex flex-col gap-1'>全局设置</ModalHeader>
              <ModalBody>
                <Input
                  label='API Endpoint'
                  size='sm'
                  value={apiEndpoint}
                  onValueChange={setApiEndpoint}
                  description='后端 API 的基础 URL'
                />
                <Input
                  label='Auth Token'
                  size='sm'
                  value={authToken}
                  onValueChange={setAuthToken}
                  type='password'
                  description='API 请求的 Bearer Token'
                />
              </ModalBody>
              <ModalFooter>
                <Button color='primary' onPress={onClose}>
                  完成
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
        {/* 集群状态表格 */}
        <Card className='md:col-span-2'>
          <CardHeader className='flex justify-between items-center gap-3'>
            <div className='flex flex-col'>
              <p className='text-md'>活跃集群</p>
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
                setTargetUuid(selectedUuid);
              }}>
              <TableHeader>
                <TableColumn>UUID</TableColumn>
                <TableColumn>连接数</TableColumn>
                <TableColumn>详细信息</TableColumn>
              </TableHeader>
              <TableBody emptyContent={'暂无在线机器'}>
                {Object.entries(status)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([uuid, session]) => (
                    <TableRow key={uuid} className='cursor-pointer'>
                      <TableCell className='font-mono'>{uuid}</TableCell>
                      <TableCell>{session.connections}</TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-2'>
                          {session.sessions.map((session, index) => {
                            return (
                              <div key={index} className='flex items-center gap-2 text-small'>
                                <Chip size='sm' variant='flat' color='primary'>
                                  {session.version || 'Unknown'}
                                </Chip>
                                <span className='font-bold'>{session.ip}</span>
                                <span className='text-default-400 text-tiny'>
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
            <CardHeader>指令推送</CardHeader>
            <Divider />
            <CardBody className='space-y-4'>
              <Input label='UUID' placeholder='' value={targetUuid} onValueChange={setTargetUuid} />

              <Autocomplete
                label='类型'
                placeholder='选择或输入指令类型'
                defaultItems={commandOptions}
                selectedKey={commandOptions.some(opt => opt.value === commandType) ? commandType : null}
                inputValue={commandOptions.some(opt => opt.value === commandType) ? undefined : commandType}
                onSelectionChange={key => {
                  if (key) setCommandType(key as string);
                }}
                onInputChange={val => {
                  const match = commandOptions.find(opt => opt.label === val);
                  if (match) {
                    setCommandType(match.value);
                  } else {
                    setCommandType(val);
                  }
                }}
                allowsCustomValue>
                {item => <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>}
              </Autocomplete>

              <Textarea
                label='数据 (Data)'
                placeholder='输入数据 (JSON 或 字符串)'
                value={commandData}
                onValueChange={setCommandData}
                minRows={3}
              />

              <Button color='primary' fullWidth isDisabled={!targetUuid} onPress={sendCommand}>
                推送
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* 配置编辑器 */}
        <Card className='md:col-span-3'>
          <CardHeader className='flex justify-between items-center'>
            <span>配置编辑器</span>
            <Button isIconOnly size='sm' color='primary' onPress={saveConfig}>
              <Save size={18} />
            </Button>
          </CardHeader>
          <Divider />
          <CardBody className='space-y-6'>
            {/* Base Config */}
            <div className='space-y-2'>
              <p className='text-small font-bold'>基础配置</p>
              <Textarea minRows={6} className='font-mono text-small' value={baseConfig} onValueChange={setBaseConfig} />
            </div>

            <Divider />

            {/* UUID Configs */}
            <div className='space-y-4'>
              <div className='flex justify-between items-center'>
                <p className='text-small font-bold'>UUID 配置</p>
                <div className='flex gap-2'>
                  <Button isIconOnly size='sm' color='primary' onPress={addUuidConfig}>
                    <Plus size={18} />
                  </Button>
                </div>
              </div>

              <div className='border border-divider rounded-lg overflow-hidden'>
                {uuidConfigs.map((item, index) => (
                  <div key={index}>
                    {index > 0 && <Divider />}
                    <div className='flex flex-col gap-2 p-4'>
                      <div className='flex justify-between items-center gap-4'>
                        <Input
                          label='UUID'
                          size='sm'
                          value={item.uuid}
                          onValueChange={val => updateUuidName(index, val)}
                          className='max-w-xs font-mono font-bold'
                        />
                        <Button
                          isIconOnly
                          size='sm'
                          color='primary'
                          variant='light'
                          onPress={() => removeUuidConfig(index)}>
                          <Trash2 size={18} />
                        </Button>
                      </div>
                      <Textarea
                        minRows={4}
                        className='font-mono text-small'
                        value={item.config}
                        onValueChange={val => updateUuidConfig(index, val)}
                      />
                    </div>
                  </div>
                ))}
                {uuidConfigs.length === 0 && (
                  <div className='p-4 text-center text-default-500 text-small'>
                    No UUID configurations. Click + to add one.
                  </div>
                )}
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
