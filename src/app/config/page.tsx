'use client';
import { useEffect, useState } from 'react';
import { Card, CardHeader, CardBody, Button, Input, Divider, Textarea, addToast } from '@heroui/react';
import { Save, Plus, Trash2 } from 'lucide-react';
import { useConfig } from '@/contexts/ConfigContext';
import { useTranslation } from 'react-i18next';

export default function ConfigPage() {
  const { t } = useTranslation();
  const { apiEndpoint, authToken } = useConfig();
  const [baseConfig, setBaseConfig] = useState('{}');
  const [uuidConfigs, setUuidConfigs] = useState<{ uuid: string; config: string }[]>([]);

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

  useEffect(() => {
    fetchConfig();
  }, [apiEndpoint, authToken]);

  const saveConfig = async () => {
    try {
      let parsedBase = {};
      try {
        parsedBase = JSON.parse(baseConfig);
      } catch (e) {
        addToast({ title: t('Failure'), color: 'danger' });
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
        addToast({ title: t('Failure'), color: 'danger' });
        return;
      }
      addToast({ title: t('Success'), color: 'success' });
      fetchConfig(); // Refresh to ensure sync
    } catch (e) {
      console.error('Save config failed', e);
      addToast({ title: t('Failure'), color: 'danger' });
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

  return (
    <div className='max-w-6xl mx-auto space-y-6 pb-12'>
      <header className='flex justify-between items-center pt-6'>
        <h1 className='text-3xl font-bold text-blue-500 font-sans'>{t('Config')}</h1>
        <Button color='primary' startContent={<Save size={18} />} onPress={saveConfig}>
          {t('Save Changes')}
        </Button>
      </header>

      <Card>
        <CardHeader className='font-bold'>{t('Configuration Editor')}</CardHeader>
        <Divider />
        <CardBody className='space-y-6'>
          {/* Base Config */}
          <div className='space-y-2'>
            <p className='text-small font-bold'>{t('Global Config')}</p>
            <Textarea minRows={6} className='font-mono text-small' value={baseConfig} onValueChange={setBaseConfig} />
          </div>

          <Divider />

          {/* UUID Configs */}
          <div className='space-y-4'>
            <div className='flex justify-between items-center'>
              <p className='text-small font-bold'>{t('UUID Config')}</p>
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
                        color='danger'
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
                <div className='p-4 text-center text-default-500 text-small'>{t('No UUID config')}</div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
