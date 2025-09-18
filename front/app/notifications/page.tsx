'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  emailNotificationsApi,
  eventRemindersApi,
  notificationUtils,
  type EmailNotification,
  type EventReminder,
} from '@/lib/api/notifications';
import { type ApiError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';
import {
  DashboardLayout,
  DashboardHeaders,
} from '@/components/dashboard/DashboardHeader';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEnvelope,
  faSearch,
  faFilter,
  faSpinner,
  faExclamationCircle,
  faCheckCircle,
  faClock,
  faRedo,
  faBell,
  faCalendarAlt,
} from '@fortawesome/free-solid-svg-icons';

export default function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<EmailNotification[]>([]);
  const [reminders, setReminders] = useState<EventReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'emails' | 'reminders'>('emails');
  // Remove unused pagination state - can be added back when pagination is implemented

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, activeTab, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'emails') {
        const params: {
          status?: string;
          search?: string;
        } = {};
        if (statusFilter !== 'all') {
          params.status = statusFilter;
        }
        if (searchTerm) {
          params.search = searchTerm;
        }

        const response = await emailNotificationsApi.getNotifications(params);
        setNotifications(response.results);
      } else {
        const response = await eventRemindersApi.getReminders();
        setReminders(response.results);
      }
    } catch (error) {
      const apiError = error as ApiError;
      console.error('Error loading data:', error);
      toast.error(apiError.message || 'Error al cargar las notificaciones');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = () => {
    loadData();
  };

  const handleResendNotification = async (notificationId: string) => {
    try {
      await emailNotificationsApi.resendNotification(notificationId);
      toast.success('Notificación reenviada');
      loadData(); // Reload to update status
    } catch (error) {
      const apiError = error as ApiError;
      toast.error(apiError.message || 'Error al reenviar notificación');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return (
          <FontAwesomeIcon icon={faCheckCircle} className='text-green-600' />
        );
      case 'failed':
        return (
          <FontAwesomeIcon
            icon={faExclamationCircle}
            className='text-red-600'
          />
        );
      case 'pending':
        return <FontAwesomeIcon icon={faClock} className='text-yellow-600' />;
      case 'sending':
        return (
          <FontAwesomeIcon
            icon={faSpinner}
            className='text-blue-600 animate-spin'
          />
        );
      default:
        return <FontAwesomeIcon icon={faClock} className='text-gray-600' />;
    }
  };

  if (!user) {
    return (
      <div className='container mx-auto px-4 py-8'>
        <div className='text-center'>
          <p className='text-gray-600'>
            Debes iniciar sesión para ver tus notificaciones
          </p>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout header={DashboardHeaders.notifications()}>
      <div className='space-y-6'>
        {/* Tabs */}
        <div className='border-b border-gray-200 mb-6'>
          <nav className='-mb-px flex space-x-8'>
            <button
              onClick={() => setActiveTab('emails')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'emails'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faEnvelope} className='mr-2' />
              Emails ({notifications.length})
            </button>
            <button
              onClick={() => setActiveTab('reminders')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reminders'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FontAwesomeIcon icon={faBell} className='mr-2' />
              Recordatorios ({reminders.length})
            </button>
          </nav>
        </div>

        {/* Filters */}
        {activeTab === 'emails' && (
          <Card className='p-4 mb-6'>
            <div className='flex flex-col sm:flex-row gap-4'>
              <div className='flex-1'>
                <div className='relative'>
                  <FontAwesomeIcon
                    icon={faSearch}
                    className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                  />
                  <Input
                    placeholder='Buscar por asunto o destinatario...'
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && handleSearch()}
                    className='pl-10'
                  />
                </div>
              </div>

              <div className='flex gap-2'>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className='px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500'
                >
                  <option value='all'>Todos los estados</option>
                  <option value='sent'>Enviados</option>
                  <option value='failed'>Fallidos</option>
                  <option value='pending'>Pendientes</option>
                  <option value='sending'>Enviando</option>
                </select>

                <Button onClick={handleSearch} disabled={isLoading}>
                  <FontAwesomeIcon icon={faFilter} className='mr-2' />
                  Filtrar
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Content */}
        {isLoading ? (
          <Card className='p-8'>
            <div className='flex items-center justify-center'>
              <FontAwesomeIcon
                icon={faSpinner}
                className='text-2xl animate-spin text-gray-400 mr-3'
              />
              <span className='text-gray-600'>Cargando notificaciones...</span>
            </div>
          </Card>
        ) : (
          <div className='space-y-4'>
            {activeTab === 'emails' ? (
              <>
                {notifications.length === 0 ? (
                  <Card className='p-8 text-center'>
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className='text-4xl text-gray-300 mb-4'
                    />
                    <h3 className='text-lg font-medium text-gray-900 dark:text-gray-100 mb-2'>
                      No hay notificaciones
                    </h3>
                    <p className='text-gray-600 dark:text-gray-400'>
                      {statusFilter !== 'all'
                        ? `No se encontraron notificaciones con estado "${statusFilter}"`
                        : 'Aún no has recibido notificaciones por email'}
                    </p>
                  </Card>
                ) : (
                  notifications.map(notification => (
                    <Card key={notification.id} className='p-4'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center mb-2'>
                            {getStatusIcon(notification.status)}
                            <span className='ml-2 font-medium text-gray-900'>
                              {notification.subject}
                            </span>
                            {notification.template_name && (
                              <span className='ml-2 px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded'>
                                {notification.template_name}
                              </span>
                            )}
                          </div>

                          <div className='text-sm text-gray-600 space-y-1'>
                            <div className='flex items-center'>
                              <span className='font-medium'>Estado:</span>
                              <span
                                className={`ml-2 ${notificationUtils.formatStatus(notification.status).color}`}
                              >
                                {
                                  notificationUtils.formatStatus(
                                    notification.status
                                  ).text
                                }
                              </span>
                            </div>

                            <div className='flex items-center'>
                              <span className='font-medium'>Prioridad:</span>
                              <span
                                className={`ml-2 ${notificationUtils.formatPriority(notification.priority).color}`}
                              >
                                {
                                  notificationUtils.formatPriority(
                                    notification.priority
                                  ).text
                                }
                              </span>
                            </div>

                            <div>
                              <span className='font-medium'>Creado:</span>
                              <span className='ml-2'>
                                {formatDate(notification.created_at)}
                              </span>
                            </div>

                            {notification.sent_at && (
                              <div>
                                <span className='font-medium'>Enviado:</span>
                                <span className='ml-2'>
                                  {formatDate(notification.sent_at)}
                                </span>
                              </div>
                            )}

                            {notification.error_message && (
                              <div className='text-red-600'>
                                <span className='font-medium'>Error:</span>
                                <span className='ml-2'>
                                  {notification.error_message}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {notification.status === 'failed' && (
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() =>
                              handleResendNotification(notification.id)
                            }
                          >
                            <FontAwesomeIcon icon={faRedo} className='mr-2' />
                            Reenviar
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                )}
              </>
            ) : (
              <>
                {reminders.length === 0 ? (
                  <Card className='p-8 text-center'>
                    <FontAwesomeIcon
                      icon={faBell}
                      className='text-4xl text-gray-300 mb-4'
                    />
                    <h3 className='text-lg font-medium text-gray-900 mb-2'>
                      No hay recordatorios
                    </h3>
                    <p className='text-gray-600'>
                      No tienes recordatorios de eventos programados
                    </p>
                  </Card>
                ) : (
                  reminders.map(reminder => (
                    <Card key={reminder.id} className='p-4'>
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center mb-2'>
                            <FontAwesomeIcon
                              icon={faCalendarAlt}
                              className='text-blue-600 mr-2'
                            />
                            <span className='font-medium text-gray-900'>
                              {reminder.event_title}
                            </span>
                            {reminder.sent && (
                              <span className='ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded'>
                                Enviado
                              </span>
                            )}
                          </div>

                          <div className='text-sm text-gray-600 space-y-1'>
                            <div>
                              <span className='font-medium'>Tipo:</span>
                              <span className='ml-2'>
                                {notificationUtils.formatReminderType(
                                  reminder.reminder_type
                                )}
                              </span>
                            </div>

                            <div>
                              <span className='font-medium'>Evento:</span>
                              <span className='ml-2'>
                                {formatDate(reminder.event_start_datetime)}
                              </span>
                            </div>

                            <div>
                              <span className='font-medium'>Programado:</span>
                              <span className='ml-2'>
                                {formatDate(reminder.scheduled_at)}
                              </span>
                            </div>

                            {reminder.sent_at && (
                              <div>
                                <span className='font-medium'>Enviado:</span>
                                <span className='ml-2'>
                                  {formatDate(reminder.sent_at)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
