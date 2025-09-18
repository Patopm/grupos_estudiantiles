'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faEdit,
  faSave,
  faSpinner,
  faTimes,
  IconDefinition,
} from '@fortawesome/free-solid-svg-icons';

interface FormSectionProps {
  title: string;
  icon: IconDefinition;
  children: React.ReactNode;
  isEditing?: boolean;
  isSaving?: boolean;
  onEdit?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
  showActions?: boolean;
  className?: string;
}

export default function FormSection({
  title,
  icon,
  children,
  isEditing = false,
  isSaving = false,
  onEdit,
  onSave,
  onCancel,
  showActions = false,
  className = '',
}: FormSectionProps) {
  return (
    <Card className={`p-6 ${className}`}>
      {/* Section Header */}
      <div className='flex items-center justify-between mb-6'>
        <h2 className='text-xl font-semibold flex items-center gap-2 text-gray-900 dark:text-gray-100'>
          <FontAwesomeIcon icon={icon} className='text-primary' />
          {title}
        </h2>

        {showActions && !isEditing && onEdit && (
          <Button
            variant='outline'
            onClick={onEdit}
            className='flex items-center gap-2'
          >
            <FontAwesomeIcon icon={faEdit} className='w-4 h-4' />
            Editar
          </Button>
        )}
      </div>

      {/* Section Content */}
      <div className='space-y-4'>{children}</div>

      {/* Action Buttons */}
      {showActions && isEditing && (onSave || onCancel) && (
        <div className='flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700'>
          {onCancel && (
            <Button variant='outline' onClick={onCancel} disabled={isSaving}>
              <FontAwesomeIcon icon={faTimes} className='mr-2 w-4 h-4' />
              Cancelar
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave} disabled={isSaving}>
              {isSaving ? (
                <>
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className='mr-2 animate-spin w-4 h-4'
                  />
                  Guardando...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} className='mr-2 w-4 h-4' />
                  Guardar Cambios
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </Card>
  );
}
