import fs from 'fs-extra';
import {OpenAPIV2} from 'openapi-types';
import path from 'path';
import {inspect} from 'util';

import {TemplateGenerator} from './TemplateGenerator';

export enum SwaggerType {
  ARRAY = 'array',
  INTEGER = 'integer',
  NUMBER = 'number',
  OBJECT = 'object',
  STRING = 'string',
}

export enum TypeScriptType {
  ANY = 'any',
  ARRAY = 'Array',
  EMPTY_OBJECT = '{}',
  NUMBER = 'number',
  STRING = 'string',
  INTERFACE = 'interface',
  TYPE = 'type',
}

export class InterfaceGenerator extends TemplateGenerator {
  protected readonly name: string;
  protected readonly templateFile: string;
  private readonly spec: OpenAPIV2.Document;
  private readonly definition: OpenAPIV2.Schema;
  private readonly outputDirectory: string;
  private type?: TypeScriptType;

  constructor(definitionName: string, definition: OpenAPIV2.Schema, spec: OpenAPIV2.Document, outputDirectory: string) {
    super();
    this.name = definitionName;
    this.templateFile = 'Interface.hbs';
    this.spec = spec;
    this.definition = definition;
    this.outputDirectory = outputDirectory;

    fs.ensureDirSync(this.outputDirectory);
  }

  private buildType(schema: OpenAPIV2.SchemaObject, schemaName: string): string {
    let {required: requiredProperties, properties, type: schemaType} = schema;

    if (schema.$ref && schema.$ref.startsWith('#/definitions')) {
      if (!this.spec.definitions) {
        console.info('Spec has no definitions.');
        return TypeScriptType.EMPTY_OBJECT;
      }
      const definition = schema.$ref.replace('#/definitions/', '');
      requiredProperties = this.spec.definitions[definition].required;
      properties = this.spec.definitions[definition].properties;
      schemaType = this.spec.definitions[definition].type;
    }

    schemaType = schemaType || SwaggerType.OBJECT;

    if (Array.isArray(schemaType)) {
      schemaType = schemaType[0];
    }

    switch (schemaType.toLowerCase()) {
      case SwaggerType.STRING: {
        this.setBasicType(TypeScriptType.TYPE);
        return TypeScriptType.STRING;
      }
      case SwaggerType.NUMBER:
      case SwaggerType.INTEGER: {
        this.setBasicType(TypeScriptType.TYPE);
        return TypeScriptType.NUMBER;
      }
      case SwaggerType.OBJECT: {
        this.setBasicType(TypeScriptType.INTERFACE);
        if (!properties) {
          console.info(`Schema type for "${schemaName}" is "object" but has no properties.`);
          return TypeScriptType.EMPTY_OBJECT;
        }

        const schema: Record<string, string> = {};

        for (const property of Object.keys(properties)) {
          const propertyName = requiredProperties && !requiredProperties.includes(property) ? `${property}?` : property;
          schema[propertyName] = this.buildType(properties[property], property);
        }

        return inspect(schema, {breakLength: Infinity})
          .replace(/'/gm, '')
          .replace(',', ';')
          .replace(new RegExp('\\n', 'g'), '');
      }
      case SwaggerType.ARRAY: {
        this.setBasicType(TypeScriptType.TYPE);
        if (!schema.items) {
          console.info(`Schema type for "${schemaName}" is "array" but has no items.`);
          return `${TypeScriptType.ARRAY}<${TypeScriptType.ANY}>`;
        }

        if (!(schema.items instanceof Array)) {
          const itemType = this.buildType(schema.items, schemaName);
          return `${TypeScriptType.ARRAY}<${itemType}>`;
        }

        const schemes = schema.items.map(itemSchema => this.buildType(itemSchema, schemaName)).join('|');
        return `${TypeScriptType.ARRAY}<${schemes}>`;
      }
      default: {
        this.setBasicType(TypeScriptType.TYPE);
        return TypeScriptType.EMPTY_OBJECT;
      }
    }
  }

  generateInterface(): string {
    return this.buildType(this.definition, this.name);
  }

  private setBasicType(type: TypeScriptType): void {
    if (!this.type) {
      this.type = type;
    }
  }

  async write(): Promise<void> {
    const renderedIndex = await this.toString();
    const outputFile = path.join(this.outputDirectory, this.filePath);
    return fs.outputFile(outputFile, renderedIndex, 'utf-8');
  }

  protected async getContext(): Promise<{data: string; name: string; type?: TypeScriptType}> {
    const data = this.generateInterface();

    return {
      data,
      name: this.name,
      type: this.type,
    };
  }
}
