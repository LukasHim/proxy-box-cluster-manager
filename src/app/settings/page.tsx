'use client';
import { useState } from 'react';
import {
  Card,
  CardHeader,
  CardBody,
  Button,
  Input,
  Divider,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useDisclosure,
  addToast,
  Select,
  SelectItem,
} from '@heroui/react';
import { useConfig } from '@/contexts/ConfigContext';
import { useTranslation } from 'react-i18next';
import { useTheme } from 'next-themes';
import { useEffect } from 'react';

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { theme: currentTheme, setTheme } = useTheme();
  const { apiEndpoint, authToken, theme, language, updateConfig } = useConfig();
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  const handleDeleteStorage = async () => {
    try {
      const res = await fetch(`${apiEndpoint}/debug/storage?confirm=${deleteConfirmation}`, {
        method: 'DELETE',
        headers: { Authorization: 'Bearer ' + authToken },
      });
      if (res.ok) {
        addToast({ title: t('Success'), color: 'success' });
        setDeleteConfirmation('');
        onOpenChange(); // Close modal
      } else {
        addToast({ title: t('Failure'), description: await res.text(), color: 'danger' });
      }
    } catch (e) {
      console.error('Delete storage failed', e);
      addToast({ title: t('Failure'), color: 'danger' });
    }
  };

  const handleLanguageChange = (val: string) => {
    updateConfig({ language: val as any });
    if (val === 'system') {
      i18n.changeLanguage(navigator.language.split('-')[0]);
    } else {
      i18n.changeLanguage(val);
    }
  };

  const handleThemeChange = (val: string) => {
    updateConfig({ theme: val as any });
    setTheme(val);
  };

  // Sync state on load
  useEffect(() => {
    if (language && language !== 'system') {
      i18n.changeLanguage(language);
    }
    if (theme) {
      setTheme(theme);
    }
  }, []);

  return (
    <div className='max-w-6xl mx-auto space-y-6 pb-12'>
      <header className='pt-6'>
        <h1 className='text-3xl font-bold text-blue-500 font-sans'>{t('Settings')}</h1>
      </header>

      <Card>
        <CardHeader className='font-bold'>{t('API Configuration')}</CardHeader>
        <Divider />
        <CardBody className='space-y-4'>
          <Input
            label={t('API Endpoint')}
            value={apiEndpoint}
            onValueChange={val => updateConfig({ apiEndpoint: val })}
            description={t('API Endpoint Description')}
          />
          <Input
            label={t('Auth Token')}
            value={authToken}
            onValueChange={val => updateConfig({ authToken: val })}
            type='password'
            description={t('Auth Token Description')}
          />
        </CardBody>
      </Card>

      <Card>
        <CardHeader className='font-bold'>{t('Display & Language')}</CardHeader>
        <Divider />
        <CardBody className='grid grid-cols-1 md:grid-cols-2 gap-6'>
          <Select
            label={t('Theme')}
            selectedKeys={[theme || 'system']}
            onSelectionChange={keys => handleThemeChange(Array.from(keys)[0] as string)}>
            <SelectItem key='system'>{t('System')}</SelectItem>
            <SelectItem key='dark'>{t('Dark')}</SelectItem>
            <SelectItem key='light'>{t('Light')}</SelectItem>
          </Select>

          <Select
            label={t('Language')}
            selectedKeys={[language || 'system']}
            onSelectionChange={keys => handleLanguageChange(Array.from(keys)[0] as string)}>
            <SelectItem key='system'>{t('System')}</SelectItem>
            <SelectItem key='zh'>中文 (Chinese)</SelectItem>
            <SelectItem key='en'>English</SelectItem>
          </Select>
        </CardBody>
      </Card>

      <Card className='border-danger border'>
        <CardHeader className='text-danger font-bold'>{t('Danger Zone')}</CardHeader>
        <Divider />
        <CardBody>
          <div className='flex flex-wrap justify-between items-center gap-4'>
            <p className='text-small text-default-500 max-w-lg'>{t('Confirm Message')}</p>
            <Button color='danger' variant='flat' onPress={onOpen}>
              {t('Delete All Storage')}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isOpen} onOpenChange={onOpenChange}>
        <ModalContent>
          {onClose => (
            <>
              <ModalHeader>{t('Confirm Deletion')}</ModalHeader>
              <ModalBody>
                <p className='text-danger'>{t('Confirm Message')}</p>
                <p>{t('Type Confirm')}</p>
                <Input
                  value={deleteConfirmation}
                  onValueChange={setDeleteConfirmation}
                  color={deleteConfirmation === 'confirm' ? 'danger' : 'default'}
                />
              </ModalBody>
              <ModalFooter>
                <Button variant='light' onPress={onClose}>
                  {t('Cancel')}
                </Button>
                <Button color='danger' isDisabled={deleteConfirmation !== 'confirm'} onPress={handleDeleteStorage}>
                  {t('Delete Everything')}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  );
}
