import * as crypto from 'crypto';

export interface CRFFieldDefinition {
  key: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'choice';
  required: boolean;
  options?: string[];
  validationRules?: {
    min?: number;
    max?: number;
    regex?: string;
    customRuleName?: string;
  };
}

export interface CRFSchema {
  title: string;
  fields: CRFFieldDefinition[];
}

export interface CRFDefinition {
  id: string;
  protocolId: string;
  visitId: string;
  name: string;
  version: string;
  schema: CRFSchema;
  isActive: boolean;
}

export class CRFDefinitionService {
  private definitions: Map<string, CRFDefinition> = new Map();

  public createDefinition(
    protocolId: string,
    visitId: string,
    name: string,
    version: string,
    schema: CRFSchema
  ): CRFDefinition {
    const id = crypto.randomUUID();
    const definition: CRFDefinition = {
      id,
      protocolId,
      visitId,
      name,
      version,
      schema,
      isActive: true,
    };

    for (const [key, def] of this.definitions.entries()) {
      if (
        def.protocolId === protocolId &&
        def.visitId === visitId &&
        def.name === name &&
        def.isActive
      ) {
        def.isActive = false;
        this.definitions.set(key, def);
      }
    }

    this.definitions.set(id, definition);
    return definition;
  }

  public getDefinition(id: string): CRFDefinition | undefined {
    return this.definitions.get(id);
  }

  public getActiveDefinitionForVisit(protocolId: string, visitId: string, name: string): CRFDefinition | undefined {
    return Array.from(this.definitions.values()).find(
      (def) => def.protocolId === protocolId && def.visitId === visitId && def.name === name && def.isActive
    );
  }

  public validateDataAgainstSchema(data: Record<string, any>, schema: CRFSchema): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const field of schema.fields) {
      const value = data[field.key];

      if (field.required && (value === undefined || value === null || value === '')) {
        errors.push(`Field '${field.label}' (${field.key}) is required.`);
        continue;
      }

      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (field.type === 'number' && typeof value !== 'number') {
        errors.push(`Field '${field.label}' must be a number.`);
      } else if (field.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`Field '${field.label}' must be a boolean.`);
      } else if (field.type === 'choice' && field.options && !field.options.includes(value)) {
        errors.push(`Field '${field.label}' has an invalid option: '${value}'.`);
      }

      if (field.validationRules) {
        const rules = field.validationRules;
        if (field.type === 'number' && typeof value === 'number') {
          if (rules.min !== undefined && value < rules.min) {
            errors.push(`Field '${field.label}' must be at least ${rules.min}.`);
          }
          if (rules.max !== undefined && value > rules.max) {
            errors.push(`Field '${field.label}' must be at most ${rules.max}.`);
          }
        }
        if (rules.regex && typeof value === 'string') {
          const regex = new RegExp(rules.regex);
          if (!regex.test(value)) {
            errors.push(`Field '${field.label}' does not match the required format.`);
          }
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public renderUIFormSchema(definition: CRFDefinition): string {
    return JSON.stringify({
      formId: definition.id,
      title: definition.schema.title,
      version: definition.version,
      elements: definition.schema.fields.map((field) => ({
        id: field.key,
        type: field.type === 'choice' ? 'select' : field.type,
        label: field.label,
        required: field.required,
        options: field.options || [],
        validation: field.validationRules || {},
      })),
    }, null, 2);
  }
}