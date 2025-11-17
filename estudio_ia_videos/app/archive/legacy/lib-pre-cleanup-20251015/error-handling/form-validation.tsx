
/**
 * 📋 SISTEMA DE VALIDAÇÃO DE FORMULÁRIOS
 * Validação robusta com mensagens amigáveis e recuperação de erros
 */

'use client';

import React from 'react';
import { errorLogger } from './error-logger';

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean | string;
  email?: boolean;
  url?: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

class FormValidator {
  private static instance: FormValidator;
  private validationMessages: Record<string, Record<string, string>> = {
    pt: {
      required: 'Este campo é obrigatório',
      minLength: 'Deve ter pelo menos {min} caracteres',
      maxLength: 'Deve ter no máximo {max} caracteres',
      min: 'Valor deve ser maior ou igual a {min}',
      max: 'Valor deve ser menor ou igual a {max}',
      pattern: 'Formato inválido',
      email: 'Email inválido',
      url: 'URL inválida',
      custom: 'Valor inválido',
    }
  };

  static getInstance(): FormValidator {
    if (!FormValidator.instance) {
      FormValidator.instance = new FormValidator();
    }
    return FormValidator.instance;
  }

  private getMessage(code: string, params?: Record<string, unknown>): string {
    let message = this.validationMessages.pt[code] || code;
    
    if (params) {
      Object.keys(params).forEach(key => {
        message = message.replace(`{${key}}`, params[key]);
      });
    }
    
    return message;
  }

  validateField(
    fieldName: string,
    value: any,
    rules: ValidationRule,
    context?: Record<string, unknown>
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    try {
      // Required
      if (rules.required && (value === null || value === undefined || value === '')) {
        errors.push({
          field: fieldName,
          message: this.getMessage('required'),
          code: 'required'
        });
        return errors; // Se obrigatório e vazio, não precisa validar outras regras
      }

      // Se valor está vazio e não é obrigatório, pular validações
      if (value === null || value === undefined || value === '') {
        return errors;
      }

      // String validations
      if (typeof value === 'string') {
        if (rules.minLength && value.length < rules.minLength) {
          errors.push({
            field: fieldName,
            message: this.getMessage('minLength', { min: rules.minLength }),
            code: 'minLength'
          });
        }

        if (rules.maxLength && value.length > rules.maxLength) {
          errors.push({
            field: fieldName,
            message: this.getMessage('maxLength', { max: rules.maxLength }),
            code: 'maxLength'
          });
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          errors.push({
            field: fieldName,
            message: this.getMessage('pattern'),
            code: 'pattern'
          });
        }

        if (rules.email && !this.isValidEmail(value)) {
          errors.push({
            field: fieldName,
            message: this.getMessage('email'),
            code: 'email'
          });
        }

        if (rules.url && !this.isValidUrl(value)) {
          errors.push({
            field: fieldName,
            message: this.getMessage('url'),
            code: 'url'
          });
        }
      }

      // Number validations
      if (typeof value === 'number' || !isNaN(Number(value))) {
        const numValue = Number(value);

        if (rules.min !== undefined && numValue < rules.min) {
          errors.push({
            field: fieldName,
            message: this.getMessage('min', { min: rules.min }),
            code: 'min'
          });
        }

        if (rules.max !== undefined && numValue > rules.max) {
          errors.push({
            field: fieldName,
            message: this.getMessage('max', { max: rules.max }),
            code: 'max'
          });
        }
      }

      // Custom validation
      if (rules.custom) {
        const customResult = rules.custom(value);
        if (customResult !== true) {
          errors.push({
            field: fieldName,
            message: typeof customResult === 'string' ? customResult : this.getMessage('custom'),
            code: 'custom'
          });
        }
      }

    } catch (error) {
      errorLogger.logError({
        message: `Validation error for field: ${fieldName}`,
        error: error as Error,
        context: {
          component: 'FormValidator',
          fieldName,
          rules,
          value: typeof value === 'object' ? JSON.stringify(value) : value
        }
      });

      errors.push({
        field: fieldName,
        message: 'Erro interno de validação',
        code: 'validation_error'
      });
    }

    return errors;
  }

  validateForm<T extends Record<string, unknown>>(
    data: T,
    schema: Record<keyof T, ValidationRule>,
    context?: Record<string, unknown>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    try {
      Object.keys(schema).forEach(fieldName => {
        const fieldErrors = this.validateField(
          fieldName,
          data[fieldName],
          schema[fieldName],
          context
        );
        errors.push(...fieldErrors);
      });

      // Log de validação se houver erros
      if (errors.length > 0) {
        errorLogger.logWarning(`Form validation failed`, {
          component: 'FormValidator',
          errors: errors.map(e => ({ field: e.field, code: e.code })),
          context
        });
      }

    } catch (error) {
      errorLogger.logError({
        message: 'Form validation critical error',
        error: error as Error,
        context: {
          component: 'FormValidator',
          schema: Object.keys(schema),
          context
        }
      });

      errors.push({
        field: 'form',
        message: 'Erro crítico na validação do formulário',
        code: 'validation_critical_error'
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  // Validações específicas para o domínio
  static NRValidation = {
    projectTitle: {
      required: true,
      minLength: 3,
      maxLength: 100,
      pattern: /^[a-zA-Z0-9\s\-_áéíóúâêîôûàèìòùãõç]+$/,
    },
    
    projectDescription: {
      required: true,
      minLength: 10,
      maxLength: 1000,
    },
    
    nrType: {
      required: true,
      custom: (value: string) => {
        const validTypes = ['NR6', 'NR10', 'NR11', 'NR12', 'NR17', 'NR23', 'NR33', 'NR35'];
        return validTypes.includes(value) || `Tipo de NR deve ser um dos: ${validTypes.join(', ')}`;
      }
    },

    duration: {
      required: true,
      min: 1,
      max: 3600, // 1 hora máxima
    },

    email: {
      required: true,
      email: true,
    },

    password: {
      required: true,
      minLength: 8,
      custom: (value: string) => {
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
          return 'Senha deve conter pelo menos uma letra maiúscula, uma minúscula e um número';
        }
        return true;
      }
    },

    videoResolution: {
      required: true,
      custom: (value: string) => {
        const validResolutions = ['720p', '1080p', '1440p', '4K'];
        return validResolutions.includes(value) || `Resolução deve ser uma das: ${validResolutions.join(', ')}`;
      }
    }
  };
}

// Hook React para validação de formulários
export function useFormValidation<T extends Record<string, unknown>>(
  initialData: T,
  schema: Record<keyof T, ValidationRule>
) {
  const [data, setData] = React.useState<T>(initialData);
  const [errors, setErrors] = React.useState<ValidationError[]>([]);
  const [warnings, setWarnings] = React.useState<ValidationError[]>([]);
  const [isValid, setIsValid] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(false);
  const validator = FormValidator.getInstance();

  const validateForm = React.useCallback(
    async (formData: T = data): Promise<ValidationResult> => {
      setIsValidating(true);
      
      try {
        // Pequeno delay para não bloquear a UI
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const result = validator.validateForm(formData, schema);
        
        setErrors(result.errors);
        setWarnings(result.warnings);
        setIsValid(result.isValid);
        
        return result;
      } finally {
        setIsValidating(false);
      }
    },
    [data, schema, validator]
  );

  const validateField = React.useCallback(
    (fieldName: keyof T, value: any): ValidationError[] => {
      const fieldErrors = validator.validateField(
        String(fieldName),
        value,
        schema[fieldName]
      );
      
      // Atualizar apenas os erros deste campo
      setErrors(prevErrors => [
        ...prevErrors.filter(error => error.field !== fieldName),
        ...fieldErrors
      ]);
      
      return fieldErrors;
    },
    [schema, validator]
  );

  const updateField = React.useCallback(
    (fieldName: keyof T, value: any, validate = true) => {
      setData(prevData => ({
        ...prevData,
        [fieldName]: value
      }));

      if (validate) {
        // Validar campo após pequeno delay para evitar validação excessiva
        setTimeout(() => {
          validateField(fieldName, value);
        }, 300);
      }
    },
    [validateField]
  );

  const getFieldError = React.useCallback(
    (fieldName: keyof T): string | undefined => {
      const fieldError = errors.find(error => error.field === fieldName);
      return fieldError?.message;
    },
    [errors]
  );

  const hasFieldError = React.useCallback(
    (fieldName: keyof T): boolean => {
      return errors.some(error => error.field === fieldName);
    },
    [errors]
  );

  const clearErrors = React.useCallback(() => {
    setErrors([]);
    setWarnings([]);
  }, []);

  const reset = React.useCallback(() => {
    setData(initialData);
    setErrors([]);
    setWarnings([]);
    setIsValid(false);
  }, [initialData]);

  return {
    data,
    setData,
    errors,
    warnings,
    isValid,
    isValidating,
    validateForm,
    validateField,
    updateField,
    getFieldError,
    hasFieldError,
    clearErrors,
    reset,
  };
}

// Singleton export
export const formValidator = FormValidator.getInstance();

// Componente para exibir erros de validação
export function ValidationErrorDisplay({ 
  errors, 
  className = '' 
}: { 
  errors: ValidationError[]; 
  className?: string;
}) {
  if (errors.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {errors.map((error, index) => (
        <div 
          key={`${error.field}-${index}`}
          className="flex items-start space-x-2 text-sm text-red-600 dark:text-red-400"
        >
          <span className="text-red-500 mt-0.5">•</span>
          <span>{error.message}</span>
        </div>
      ))}
    </div>
  );
}

// Helper para campos específicos
export function FieldError({ 
  fieldName, 
  errors, 
  className = '' 
}: { 
  fieldName: string; 
  errors: ValidationError[]; 
  className?: string;
}) {
  const fieldErrors = errors.filter(error => error.field === fieldName);
  
  return <ValidationErrorDisplay errors={fieldErrors} className={className} />;
}
