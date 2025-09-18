import { useState, useCallback } from 'react';
import { z } from 'zod';
import { formatZodErrors } from '@/lib/validations/forms';

interface UseFormOptions<T> {
  initialValues: T;
  onSubmit?: (values: T) => Promise<void> | void;
  schema?: z.ZodType<T>;
}

interface UseFormReturn<T> {
  values: T;
  errors: Record<string, string>;
  isSubmitting: boolean;
  isEditing: boolean;
  isDirty: boolean;
  handleChange: (name: keyof T, value: unknown) => void;
  handleSubmit: () => Promise<void>;
  handleEdit: () => void;
  handleCancel: () => void;
  setValues: (values: T) => void;
  setFieldError: (field: keyof T, error: string) => void;
  clearErrors: () => void;
  validateField: (fieldName: keyof T, value: unknown) => void;
}

export function useForm<T extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  schema,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [originalValues] = useState<T>(initialValues);

  const isDirty = JSON.stringify(values) !== JSON.stringify(originalValues);

  const handleChange = useCallback(
    (name: keyof T, value: unknown) => {
      setValues(prev => ({
        ...prev,
        [name]: value,
      }));

      // Clear error for this field when user starts typing
      if (errors[name as string]) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name as string];
          return newErrors;
        });
      }
    },
    [errors]
  );

  const handleSubmit = useCallback(async () => {
    if (!onSubmit) return;

    // Validate form using Zod schema
    let validationErrors: Record<string, string> = {};

    if (schema) {
      const result = schema.safeParse(values);
      if (!result.success) {
        validationErrors = formatZodErrors(result.error);
      }
    }

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      await onSubmit(values);
      setIsEditing(false);
    } catch (error) {
      // Handle submission error
      if (error instanceof Error) {
        setErrors({ submit: error.message });
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [values, onSubmit, schema]);

  const handleEdit = useCallback(() => {
    setIsEditing(true);
    setErrors({});
  }, []);

  const handleCancel = useCallback(() => {
    setValues(initialValues);
    setIsEditing(false);
    setErrors({});
  }, [initialValues]);

  const setFieldError = useCallback((field: keyof T, error: string) => {
    setErrors(prev => ({
      ...prev,
      [field as string]: error,
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  const validateField = useCallback(
    (fieldName: keyof T, value: unknown) => {
      if (!schema) return;

      // Validate the whole form with the new field value
      const testValues = { ...values, [fieldName]: value };
      const result = schema.safeParse(testValues);
      if (!result.success) {
        const fieldErrors = formatZodErrors(result.error);
        if (fieldErrors[fieldName as string]) {
          setErrors(prev => ({
            ...prev,
            [fieldName as string]: fieldErrors[fieldName as string],
          }));
        }
      } else {
        // Clear error if validation passes
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[fieldName as string];
          return newErrors;
        });
      }
    },
    [schema, values]
  );

  return {
    values,
    errors,
    isSubmitting,
    isEditing,
    isDirty,
    handleChange,
    handleSubmit,
    handleEdit,
    handleCancel,
    setValues,
    setFieldError,
    clearErrors,
    validateField,
  };
}
