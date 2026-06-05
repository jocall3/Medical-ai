import { CRFSchema } from './crf-definition-service';

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  autoQueries: AutoQueryTrigger[];
}

export interface ValidationError {
  fieldKey: string;
  message: string;
}

export interface ValidationWarning {
  fieldKey: string;
  message: string;
}

export interface AutoQueryTrigger {
  fieldKey: string;
  reason: string;
  suggestedText: string;
}

export interface CrossFieldRule {
  id: string;
  description: string;
  condition: (data: Record<string, any>) => boolean;
  assertion: (data: Record<string, any>) => boolean;
  severity: 'ERROR' | 'WARNING' | 'AUTO_QUERY';
  fieldKey: string;
  message: string;
}

export class DataEntryValidator {
  private crossFieldRules: CrossFieldRule[] = [];

  constructor() {
    this.registerDefaultRules();
  }

  public registerRule(rule: CrossFieldRule): void {
    this.crossFieldRules.push(rule);
  }

  private registerDefaultRules(): void {
    this.registerRule({
      id: 'SYS_DIA_BP',
      description: 'Systolic Blood Pressure must be greater than Diastolic Blood Pressure',
      condition: (data) => data.systolic_bp !== undefined && data.diastolic_bp !== undefined,
      assertion: (data) => Number(data.systolic_bp) > Number(data.diastolic_bp),
      severity: 'ERROR',
      fieldKey: 'systolic_bp',
      message: 'Systolic Blood Pressure must be strictly greater than Diastolic Blood Pressure.',
    });

    this.registerRule({
      id: 'PREG_GENDER',
      description: 'If subject is pregnant, gender must be Female',
      condition: (data) => data.is_pregnant === true,
      assertion: (data) => data.gender === 'Female' || data.gender === 'F',
      severity: 'ERROR',
      fieldKey: 'is_pregnant',
      message: 'Pregnancy status can only be positive for female subjects.',
    });

    this.registerRule({
      id: 'HR_EXTREME',
      description: 'Heart rate outside normal physiological limits triggers warning/query',
      condition: (data) => data.heart_rate !== undefined && data.heart_rate !== null,
      assertion: (data) => {
        const hr = Number(data.heart_rate);
        return hr >= 40 && hr <= 120;
      },
      severity: 'AUTO_QUERY',
      fieldKey: 'heart_rate',
      message: 'Heart rate is outside the normal range (40-120 bpm). Please verify.',
    });
  }

  public validate(data: Record<string, any>, schema: CRFSchema): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const autoQueries: AutoQueryTrigger[] = [];

    for (const field of schema.fields) {
      const value = data[field.key];

      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push({
          fieldKey: field.key,
          message: `Field '${field.label}' is required.`,
        });
        continue;
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (field.type === 'number') {
        const numVal = Number(value);
        if (isNaN(numVal)) {
          errors.push({
            fieldKey: field.key,
            message: `Field '${field.label}' must be a valid number.`,
          });
        } else if (field.validationRules) {
          const { min, max } = field.validationRules;
          if (min !== undefined && numVal < min) {
            errors.push({
              fieldKey: field.key,
              message: `Field '${field.label}' value ${numVal} is below the protocol minimum of ${min}.`,
            });
          }
          if (max !== undefined && numVal > max) {
            errors.push({
              fieldKey: field.key,
              message: `Field '${field.label}' value ${numVal} is above the protocol maximum of ${max}.`,
            });
          }
        }
      }
    }

    for (const rule of this.crossFieldRules) {
      try {
        if (rule.condition(data)) {
          const passed = rule.assertion(data);
          if (!passed) {
            if (rule.severity === 'ERROR') {
              errors.push({
                fieldKey: rule.fieldKey,
                message: rule.message,
              });
            } else if (rule.severity === 'WARNING') {
              warnings.push({
                fieldKey: rule.fieldKey,
                message: rule.message,
              });
            } else if (rule.severity === 'AUTO_QUERY') {
              autoQueries.push({
                fieldKey: rule.fieldKey,
                reason: rule.description,
                suggestedText: `System-generated query: ${rule.message}`,
              });
            }
          }
        }
      } catch (err) {
        errors.push({
          fieldKey: rule.fieldKey,
          message: `Error executing validation rule ${rule.id}: ${(err as Error).message}`,
        });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      autoQueries,
    };
  }
}