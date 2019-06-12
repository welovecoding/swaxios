import {Operation, Parameter, Reference, Response, Schema, Spec} from 'swagger-schema-official';
import {inspect} from 'util';

import * as StringUtil from '../util/StringUtil';

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
}

interface BodyParameter {
  name: string;
  type: string;
}

interface Description {
  name: string;
  text: string;
}

export enum HttpMethod {
  DELETE = 'delete',
  GET = 'get',
  HEAD = 'head',
  PATCH = 'patch',
  POST = 'post',
  PUT = 'put',
  REQUEST = 'request',
}

export class MethodGenerator {
  private readonly responses: Record<string, Response | Reference>;
  private readonly spec: Spec;
  private readonly url: string;
  private readonly operation: Operation;
  readonly formattedUrl: string;
  readonly method: HttpMethod;
  readonly normalizedUrl: string;
  readonly bodyParameters?: BodyParameter[];
  readonly parameterMethod: string;
  readonly parameterName?: string;
  readonly returnType: string;
  readonly descriptions?: Description[];
  readonly needsDataObj: boolean;

  constructor(url: string, method: HttpMethod, operation: Operation, spec: Spec) {
    this.url = url;
    this.operation = operation;
    this.normalizedUrl = StringUtil.normalizeUrl(url);
    this.formattedUrl = `'${url}'`;
    this.spec = spec;
    this.responses = operation.responses;

    const parameterMatch = url.match(/\{([^}]+)\}/);

    if (parameterMatch) {
      this.parameterName = parameterMatch[1];
      this.formattedUrl = this.formattedUrl.replace(/\{/g, '${').replace(/'/g, '`');
    }

    const postFix = parameterMatch ? `By${StringUtil.camelCase(parameterMatch.splice(1), true)}` : 'All';
    this.parameterMethod = `${method}${postFix}`;

    this.method = method;

    if (this.method === 'delete' || this.method === 'head') {
      this.returnType = 'void';
    } else {
      this.returnType = this.buildResponseSchema();
    }

    this.needsDataObj = !(
      this.method === HttpMethod.PATCH ||
      this.method === HttpMethod.POST ||
      this.method === HttpMethod.PUT
    );

    this.bodyParameters = this.buildBodyParameters(this.operation.parameters);
    this.descriptions = this.buildDescriptions();
  }

  private buildDescriptions(): Description[] | undefined {
    if (this.operation.parameters) {
      const parameters = this.operation.parameters.filter(
        parameter => !this.parameterIsReference(parameter)
      ) as Parameter[];

      const extractDescription = (parameter: Parameter): Description | undefined => {
        if (parameter.description) {
          return {
            name: parameter.name,
            text: StringUtil.addStarsToNewline(parameter.description),
          };
        }
      };

      return parameters.map(extractDescription).filter(Boolean) as Description[];
    }

    return undefined;
  }

  private parameterIsReference(parameter: Reference | Parameter): parameter is Reference {
    return !!(parameter as Reference).$ref;
  }

  private getSchemaFromRef(ref: string): Schema | undefined {
    if (!ref.startsWith('#/definitions')) {
      console.warn(`Invalid reference "${ref}".`);
      return;
    }
    if (!this.spec.definitions) {
      console.warn(`No reference found for "${ref}".`);
      return;
    }
    const definitionString = ref.replace('#/definitions', '');
    const definition = this.spec.definitions[definitionString];
    return definition.$ref ? this.getSchemaFromRef(definition.$ref) : definition;
  }

  private buildBodyParameters(parameters?: (Parameter | Reference)[]): BodyParameter[] | undefined {
    if (!parameters || !parameters.length) {
      return;
    }

    return parameters
      .map(parameter => {
        if (this.parameterIsReference(parameter)) {
          const definition = this.getSchemaFromRef(parameter.$ref);
          if (definition) {
            return this.buildBodyParameters([definition] as Parameter[]);
          }
          return;
        }

        if (parameter.in === 'path') {
          return undefined;
        }

        if (parameter.in !== 'body') {
          console.warn(
            `Skipping parameter "${parameter.name}" because it's located in "${parameter.in}", which is not supported yet.`
          );
          return undefined;
        }

        const type = parameter.schema ? this.buildType(parameter.schema, parameter.name) : TypeScriptType.EMPTY_OBJECT;

        return {
          name: parameter.name,
          type,
        };
      })
      .filter(Boolean) as BodyParameter[];
  }

  private buildType(schema: Schema, schemaName: string): string {
    let {required: requiredProperties, properties, type: schemaType} = schema;
    const {allOf: multipleSchemas, enum: enumType} = schema;

    if (multipleSchemas) {
      return multipleSchemas.map(includedSchema => this.buildType(includedSchema, schemaName)).join('|');
    }

    if (enumType) {
      return `"${enumType.join('" | "')}"`;
    }

    if (schema.$ref) {
      if (!schema.$ref.startsWith('#/definitions')) {
        console.warn(`Invalid reference "${schema.$ref}".`);
        return TypeScriptType.EMPTY_OBJECT;
      }
      if (!this.spec.definitions) {
        console.warn(`No reference found for "${schema.$ref}".`);
        return TypeScriptType.EMPTY_OBJECT;
      }
      const definition = schema.$ref.replace('#/definitions', '');
      requiredProperties = this.spec.definitions[definition].required;
      properties = this.spec.definitions[definition].properties;
      schemaType = this.spec.definitions[definition].type;
    }

    schemaType = schemaType || SwaggerType.OBJECT;

    switch (schemaType.toLowerCase()) {
      case SwaggerType.STRING: {
        return TypeScriptType.STRING;
      }
      case SwaggerType.NUMBER:
      case SwaggerType.INTEGER: {
        return TypeScriptType.NUMBER;
      }
      case SwaggerType.OBJECT: {
        if (!properties) {
          console.warn(`Schema type for "${schemaName}" is "object" but has no properties.`);
          return TypeScriptType.EMPTY_OBJECT;
        }

        const schema: Record<string, string> = {};

        for (const property of Object.keys(properties)) {
          const propertyName = requiredProperties && !requiredProperties.includes(property) ? `${property}?` : property;
          schema[propertyName] = this.buildType(properties[property], `${schemaName}/${property}`);
        }

        return inspect(schema, {breakLength: Infinity})
          .replace(/'/gm, '')
          .replace(',', ';')
          .replace(new RegExp('\\n', 'g'), '');
      }
      case SwaggerType.ARRAY: {
        if (!schema.items) {
          console.warn(`Schema type for "${schemaName}" is "array" but has no items.`);
          return `${TypeScriptType.ARRAY}<${TypeScriptType.ANY}>`;
        }

        if (!(schema.items instanceof Array)) {
          const itemType = this.buildType(schema.items, schemaName);
          return `${TypeScriptType.ARRAY}<${itemType}>`;
        }

        const schemes = schema.items
          .map((itemSchema, index) => this.buildType(itemSchema, `${schemaName}[${index}]`))
          .join('|');
        return `${TypeScriptType.ARRAY}<${schemes}>`;
      }
      default: {
        return TypeScriptType.EMPTY_OBJECT;
      }
    }
  }

  private buildResponseSchema(): string {
    const response200 = this.responses['200'] as Response;
    const response201 = this.responses['201'] as Response;

    const response200Schema =
      response200 && response200.schema ? this.buildType(response200.schema, `${this.url}/${this.method}/200`) : '';
    const response201Schema =
      response201 && response201.schema ? this.buildType(response201.schema, `${this.url}/${this.method}/201`) : '';

    const responseSchema =
      response200Schema && response201Schema
        ? `${response200Schema} | ${response201Schema}`
        : response200Schema || response201Schema;

    if (!responseSchema) {
      console.warn(`No schema for code 200/201 on URL "${this.url}" or schema has no definitions.`);
      return TypeScriptType.EMPTY_OBJECT;
    }

    return responseSchema;
  }
}
