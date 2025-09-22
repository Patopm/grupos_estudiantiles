'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mfaApi, type MFAEnforcementPolicy, mfaUtils } from '@/lib/api/mfa';
import { type ApiError } from '@/lib/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faShield,
  faUsers,
  faClock,
  faExclamationTriangle,
  faCheck,
  faTimes,
  faSpinner,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

interface MFAEnforcementDisplayProps {
  className?: string;
}

export default function MFAEnforcementDisplay({
  className = '',
}: MFAEnforcementDisplayProps) {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<MFAEnforcementPolicy[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadEnforcementPolicies();
  }, []);

  const loadEnforcementPolicies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const policiesData = await mfaApi.getEnforcementPolicies();
      setPolicies(policiesData);
    } catch (error) {
      const apiError = error as ApiError;
      setError(apiError.message || 'Error al cargar políticas de MFA');
      console.error('Error loading MFA policies:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getUserPolicy = (): MFAEnforcementPolicy | null => {
    if (!user) return null;
    return policies.find(policy => policy.role === user.role) || null;
  };

  const getStatusIcon = (policy: MFAEnforcementPolicy) => {
    const status = mfaUtils.formatEnforcementStatus(policy);

    if (!policy.mfa_required) {
      return <FontAwesomeIcon icon={faTimes} className='text-gray-500' />;
    }

    if (status.color.includes('red')) {
      return (
        <FontAwesomeIcon
          icon={faExclamationTriangle}
          className='text-red-500'
        />
      );
    } else if (status.color.includes('yellow')) {
      return <FontAwesomeIcon icon={faClock} className='text-yellow-500' />;
    } else {
      return <FontAwesomeIcon icon={faCheck} className='text-green-500' />;
    }
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'No establecida';
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const userPolicy = getUserPolicy();

  if (isLoading) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className='flex items-center justify-center py-8'>
          <FontAwesomeIcon
            icon={faSpinner}
            className='text-2xl animate-spin text-gray-400'
          />
          <span className='ml-3 text-gray-600 dark:text-gray-400'>
            Cargando políticas de MFA...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`p-6 ${className}`}>
        <div className='text-center py-8'>
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className='text-3xl text-red-500 mb-3'
          />
          <p className='text-red-600 dark:text-red-400 mb-2'>
            Error al cargar políticas
          </p>
          <p className='text-sm text-gray-600 dark:text-gray-400'>{error}</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className={`p-6 ${className}`}>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-start justify-between'>
          <div className='flex items-start'>
            <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4'>
              <FontAwesomeIcon
                icon={faShield}
                className='text-xl text-blue-600'
              />
            </div>
            <div>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1'>
                Políticas de MFA
              </h3>
              <p className='text-gray-600 dark:text-gray-400'>
                Requisitos de autenticación multifactor por rol
              </p>
            </div>
          </div>
        </div>

        {/* User's Current Policy Highlight */}
        {userPolicy && (
          <div className='bg-blue-50 border border-blue-200 dark:border-blue-800 dark:bg-blue-900/20 rounded-lg p-4'>
            <div className='flex items-start'>
              <FontAwesomeIcon
                icon={faInfoCircle}
                className='text-blue-600 mt-1 mr-3'
              />
              <div className='flex-1'>
                <h4 className='font-medium text-blue-900 dark:text-blue-100 mb-2'>
                  Tu Política Actual ({userPolicy.role_display})
                </h4>
                <div className='space-y-2'>
                  <div className='flex items-center justify-between'>
                    <span className='text-sm text-blue-800 dark:text-blue-400'>
                      Estado:
                    </span>
                    <Badge
                      variant={
                        userPolicy.mfa_required ? 'destructive' : 'secondary'
                      }
                      className='ml-2'
                    >
                      {getStatusIcon(userPolicy)}
                      <span className='ml-2'>
                        {mfaUtils.formatEnforcementStatus(userPolicy).text}
                      </span>
                    </Badge>
                  </div>
                  <p className='text-sm text-blue-800 dark:text-blue-400'>
                    {mfaUtils.formatEnforcementStatus(userPolicy).description}
                  </p>
                  {userPolicy.mfa_required && userPolicy.enforcement_date && (
                    <div className='text-sm text-blue-800 dark:text-blue-400'>
                      <strong>Fecha de aplicación:</strong>{' '}
                      {formatDate(userPolicy.enforcement_date)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Policies Table */}
        <div className='space-y-4'>
          <h4 className='font-medium text-gray-900 dark:text-gray-100 flex items-center'>
            <FontAwesomeIcon icon={faUsers} className='mr-2' />
            Políticas por Rol
          </h4>

          <div className='overflow-hidden border border-gray-200 dark:border-gray-700 rounded-lg'>
            <table className='min-w-full divide-y divide-gray-200 dark:divide-gray-700'>
              <thead className='bg-gray-50 dark:bg-gray-800'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Rol
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Estado MFA
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Período de Gracia
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider'>
                    Fecha de Aplicación
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700'>
                {policies.map(policy => {
                  const status = mfaUtils.formatEnforcementStatus(policy);
                  const isCurrentUser = user?.role === policy.role;

                  return (
                    <tr
                      key={policy.role}
                      className={
                        isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                      }
                    >
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <span className='text-sm font-medium text-gray-900 dark:text-gray-100'>
                            {policy.role_display}
                          </span>
                          {isCurrentUser && (
                            <Badge variant='outline' className='ml-2 text-xs'>
                              Tu rol
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          {getStatusIcon(policy)}
                          <span className={`ml-2 text-sm ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100'>
                        {policy.mfa_required
                          ? `${policy.grace_period_days} días`
                          : 'N/A'}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100'>
                        {formatDate(policy.enforcement_date)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Information Footer */}
        <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-4'>
          <h5 className='font-medium text-gray-900 dark:text-gray-100 mb-2'>
            <FontAwesomeIcon icon={faInfoCircle} className='mr-2' />
            Información Importante
          </h5>
          <ul className='text-sm text-gray-600 dark:text-gray-400 space-y-1'>
            <li>
              • Las políticas de MFA son establecidas por los administradores
              del sistema
            </li>
            <li>
              • El período de gracia permite configurar MFA antes de que sea
              obligatorio
            </li>
            <li>
              • Una vez que MFA es obligatorio, no podrás acceder sin
              configurarlo
            </li>
            <li>
              • Los códigos de respaldo son esenciales para recuperar el acceso
            </li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
