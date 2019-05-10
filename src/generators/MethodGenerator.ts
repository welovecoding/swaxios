import {Response, Schema, Spec} from 'swagger-schema-official';
import {inspect} from 'util';

import * as StringUtil from '../util/StringUtil';

export enum ObjectType {
  ARRAY = 'array',
  INTEGER = 'integer',
  NUMBER = 'number',
  OBJECT = 'object',
  STRING = 'string',
}

export enum ReturnType {
  ANY = 'any',
  ARRAY = 'Array',
  EMPTY_OBJECT = '{}',
  NUMBER = 'number',
  STRING = 'string',
}

export class MethodGenerator {
  private readonly responses: Record<string, Response>;
  private readonly spec: Spec;
  private readonly url: string;
  readonly formattedUrl: string;
  readonly method: string;
  readonly normalizedUrl: string;
  readonly parameterData?: string;
  readonly parameterMethod: string;
  readonly parameterName?: string;
  readonly returnType: string;

  constructor(url: string, method: string, responses: Record<string, Response>, spec: Spec) {
    this.url = url;
    this.normalizedUrl = StringUtil.normalizeUrl(url);
    this.formattedUrl = `'${url}'`;
    this.spec = spec;
    this.responses = responses;

    const parameterMatch = url.match(/\{([^}]+)\}$/);

    if (parameterMatch) {
      this.parameterName = parameterMatch[1];
      this.formattedUrl = this.formattedUrl.replace(/\{/g, '${').replace(/'/g, '`');
    }

    const postFix = parameterMatch ? `By${StringUtil.camelCase(parameterMatch.splice(1), true)}` : 'All';
    this.parameterMethod = `${method}${postFix}`;

    if (method === 'delete' || method === 'head') {
      this.returnType = 'void';
    } else {
      this.returnType = this.buildResponseSchema();
    }
    this.method = method;
  }

  private buildType(schema: Schema, schemaName: string): string {
    let {required, properties, type: parsedType} = schema;

    if (schema.$ref && schema.$ref.startsWith('#/definitions')) {
      if (!this.spec.definitions) {
        console.info('Spec has no definitions.');
        return ReturnType.EMPTY_OBJECT;
      }
      const definition = schema.$ref.replace('#/definitions', '');
      required = this.spec.definitions[definition].required;
      properties = this.spec.definitions[definition].properties;
      parsedType = this.spec.definitions[definition].type;
    }

    parsedType = parsedType || ObjectType.OBJECT;

    switch (parsedType.toLowerCase()) {
      case ObjectType.STRING: {
        return ReturnType.STRING;
      }
      case ObjectType.NUMBER:
      case ObjectType.INTEGER: {
        return ReturnType.NUMBER;
      }
      case ObjectType.OBJECT: {
        if (!properties) {
          console.info(`Schema type for "${schemaName}" is "object" but has no properties.`);
          return ReturnType.EMPTY_OBJECT;
        }

        const schema: Record<string, string> = {};

        for (const property of Object.keys(properties)) {
          const propertyName = required && !required.includes(property) ? `${property}?` : property;
          schema[propertyName] = this.buildType(properties[property], property);
        }

        return inspect(schema, {breakLength: Infinity})
          .replace(/'/gm, '')
          .replace(',', ';')
          .replace(new RegExp('\\n', 'g'), '');
      }
      case ObjectType.ARRAY: {
        if (!schema.items) {
          console.info(`Schema type for "${schemaName}" is "array" but has no items.`);
          return `${ReturnType.ARRAY}<${ReturnType.ANY}>`;
        }

        if (!(schema.items instanceof Array)) {
          const itemType = this.buildType(schema.items, schemaName);
          return `${ReturnType.ARRAY}<${itemType}>`;
        }

        const schemes = schema.items.map(itemSchema => this.buildType(itemSchema, schemaName)).join('|');
        return `${ReturnType.ARRAY}<${schemes}>`;
      }
      default: {
        return ReturnType.EMPTY_OBJECT;
      }
    }
  }

  private buildResponseSchema(): string {
    const response200 = this.responses['200'];
    const response201 = this.responses['201'];

    const response200Schema =
      response200 && response200.schema ? this.buildType(response200.schema, 'response200') : '';
    const response201Schema =
      response201 && response201.schema ? this.buildType(response201.schema, 'response200') : '';

    const responseSchema =
      response200Schema && response201Schema
        ? `${response200Schema} | ${response201Schema}`
        : response200Schema || response201Schema;

    if (!responseSchema) {
      console.info(`No schema for code 200/201 on URL "${this.url}" or schema has no definitions.`);
      return ReturnType.EMPTY_OBJECT;
    }

    return responseSchema;
  }
}
