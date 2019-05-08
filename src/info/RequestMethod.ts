import {Response, Schema, Spec} from 'swagger-schema-official';
import {inspect} from 'util';
import {StringUtil} from '../util/StringUtil';

class RequestMethod {
  public parameterMethod: string;
  public parameterName?: string;
  public parameterData?: string;
  public method: string;
  public returnType: string;
  public url: string;
  public normalizedUrl: string;
  private readonly spec: Spec;
  private readonly responses: Record<string, Response>;

  constructor(url: string, method: string, responses: Record<string, Response>, spec: Spec) {
    this.url = url;
    this.normalizedUrl = StringUtil.normalizeUrl(url);
    this.spec = spec;
    this.responses = responses;

    const parameterMatch = url.match(/\{([^}]+)\}$/);

    if (parameterMatch) {
      this.parameterName = parameterMatch[1];
      this.parameterData = `{data: ${this.parameterName}}`;
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

  private buildType(schema: Schema): string {
    const emptyObject = '{}';

    let {required, properties, type} = schema;

    if (schema.$ref && schema.$ref.startsWith('#/definitions')) {
      if (!this.spec.definitions) {
        console.info('Spec has no definitions.');
        return emptyObject;
      }
      const definition = schema.$ref.replace('#/definitions', '');
      required = this.spec.definitions[definition].required;
      properties = this.spec.definitions[definition].properties;
      type = this.spec.definitions[definition].type;
    }

    type = type || 'object';

    switch (type) {
      case 'string':
      case 'number': {
        return type;
      }
      case 'integer': {
        return 'number';
      }
      case 'object': {
        if (!properties) {
          console.info('Schema definition is "object" but has no properties.');
          return emptyObject;
        }

        const schema: Record<string, string> = {};

        for (const property of Object.keys(properties)) {
          const propertyName = required && !required.includes(property) ? `${property}?` : property;
          schema[propertyName] = this.buildType(properties[property]);
        }

        return inspect(schema, {breakLength: Infinity})
          .replace(/'/gm, '')
          .replace(',', ';')
          .replace(new RegExp('\\n', 'g'), '');
      }
      case 'array': {
        if (!schema.items) {
          console.info('Schema definition is "array" but has no items.');
          return 'any[]';
        }

        if (!(schema.items instanceof Array)) {
          return this.buildType(schema.items);
        }

        const schemes = schema.items.map(itemSchema => this.buildType(itemSchema)).join('|');
        return `Array<${schemes}>`;
      }
      default: {
        return emptyObject;
      }
    }
  }

  private buildResponseSchema(): string {
    const emptyObject = '{}';
    const response200 = this.responses['200'];
    const response201 = this.responses['201'];

    const response200Schema = response200 && response200.schema ? this.buildType(response200.schema) : '';
    const response201Schema = response201 && response201.schema ? this.buildType(response201.schema) : '';

    const responseSchema =
      response200Schema && response201Schema
        ? `${response200Schema} | ${response201Schema}`
        : response200Schema || response201Schema;

    if (!responseSchema) {
      console.info(`No schema for code 200/201 on URL "${this.url}" or schema has no definitions.`);
      return emptyObject;
    }

    return responseSchema;
  }
}

export {RequestMethod};
