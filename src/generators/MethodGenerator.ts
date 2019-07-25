import {OpenAPIV2} from 'openapi-types';
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

interface InternalParameter {
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
  private readonly responses: Record<string, OpenAPIV2.ResponseObject | OpenAPIV2.ReferenceObject>;
  private readonly spec: OpenAPIV2.Document;
  private readonly url: string;
  private readonly operation: OpenAPIV2.OperationObject;
  readonly bodyParameters: InternalParameter[];
  readonly descriptions?: Description[];
  readonly formattedUrl: string;
  readonly method: HttpMethod;
  readonly needsDataObj: boolean;
  readonly normalizedUrl: string;
  readonly parameterMethod: string;
  readonly pathParameters: InternalParameter[];
  readonly queryParameters: InternalParameter[];
  readonly returnType: string;

  constructor(url: string, method: HttpMethod, operation: OpenAPIV2.OperationObject, spec: OpenAPIV2.Document) {
    this.url = url;
    this.operation = operation;
    this.normalizedUrl = StringUtil.normalizeUrl(url);
    this.formattedUrl = `'${url}'`;
    this.spec = spec;
    this.responses = operation.responses;

    this.bodyParameters = [];
    this.pathParameters = [];
    this.queryParameters = [];
    this.buildParameters(this.operation.parameters);
    this.descriptions = this.buildDescriptions();

    const parameterMatch = url.match(/\{([^}]+)\}/);

    if (parameterMatch) {
      if (!this.pathParameters.length) {
        this.pathParameters.push({
          name: parameterMatch[1],
          type: TypeScriptType.ANY,
        });
      }
      this.formattedUrl = this.formattedUrl.replace(/\{/g, '${').replace(/'/g, '`');
    }

    const postFix = parameterMatch ? `By${StringUtil.camelCase(parameterMatch.splice(1), true)}` : 'All';
    this.parameterMethod = `${method}${postFix}`;

    this.method = method;

    if (this.includesSuccessResponse(this.responses)) {
      this.returnType = this.buildResponseSchema();
    } else {
      this.returnType = 'void';
    }

    this.needsDataObj = !(
      this.method === HttpMethod.PATCH ||
      this.method === HttpMethod.POST ||
      this.method === HttpMethod.PUT
    );
  }

  private includesSuccessResponse(
    responses: Record<string, OpenAPIV2.ResponseObject | OpenAPIV2.ReferenceObject>,
  ): boolean {
    for (const [successCode, response] of Object.entries(responses)) {
      if (successCode.startsWith('2') && response.hasOwnProperty('schema')) {
        return true;
      }
    }
    return false;
  }

  private buildDescriptions(): Description[] | undefined {
    if (this.operation.parameters) {
      const parameters = this.operation.parameters.filter(
        parameter => !this.parameterIsReference(parameter),
      ) as OpenAPIV2.ParameterObject[];

      const extractDescription = (parameter: OpenAPIV2.ParameterObject): Description | undefined => {
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

  private parameterIsReference(
    parameter: OpenAPIV2.ReferenceObject | OpenAPIV2.ParameterObject,
  ): parameter is OpenAPIV2.ReferenceObject {
    return !!(parameter as OpenAPIV2.ReferenceObject).$ref;
  }

  private getSchemaFromRef(ref: string): any | undefined {
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

  private buildParameters(parameters?: (OpenAPIV2.ParameterObject | OpenAPIV2.ReferenceObject)[]): void {
    if (!parameters || !parameters.length) {
      return;
    }

    for (const parameter of parameters) {
      if (this.parameterIsReference(parameter)) {
        const definition = this.getSchemaFromRef(parameter.$ref);
        if (definition) {
          return this.buildParameters([definition] as OpenAPIV2.ParameterObject[]);
        }
        return;
      }

      if (parameter.in === 'path' && parameter.type) {
        const type = this.buildSimpleType(parameter.type);
        this.pathParameters.push({
          name: parameter.name,
          type,
        });
      }

      if (parameter.in === 'body') {
        const type = parameter.schema
          ? this.buildTypeFromSchema(parameter.schema, parameter.name)
          : TypeScriptType.EMPTY_OBJECT;
        this.bodyParameters.push({
          name: parameter.name,
          type,
        });
      }

      if (parameter.in === 'query' && parameter.type) {
        const type = this.buildSimpleType(parameter.type);
        this.queryParameters.push({
          name: parameter.name,
          type,
        });
      }
    }
  }

  private buildTypeFromSchema(schema: any, schemaName: string): string {
    let {required: requiredProperties, properties, type: schemaType} = schema;
    const {allOf: multipleSchemas, enum: enumType} = schema;

    if (multipleSchemas) {
      return multipleSchemas
        .map((includedSchema: any) => this.buildTypeFromSchema(includedSchema, schemaName))
        .join('|');
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
      case SwaggerType.OBJECT: {
        if (!properties) {
          console.warn(`Schema type for "${schemaName}" is "object" but has no properties.`);
          return TypeScriptType.EMPTY_OBJECT;
        }

        const schema: Record<string, string> = {};

        for (const property of Object.keys(properties)) {
          const propertyName = requiredProperties && !requiredProperties.includes(property) ? `${property}?` : property;
          schema[propertyName] = this.buildTypeFromSchema(properties[property], `${schemaName}/${property}`);
        }

        return inspect(schema, {breakLength: Infinity, depth: Infinity})
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
          const itemType = this.buildTypeFromSchema(schema.items, schemaName);
          return `${TypeScriptType.ARRAY}<${itemType}>`;
        }

        const schemes = schema.items
          .map((itemSchema: any, index: any) => this.buildTypeFromSchema(itemSchema, `${schemaName}[${index}]`))
          .join('|');
        return `${TypeScriptType.ARRAY}<${schemes}>`;
      }
      default: {
        return this.buildSimpleType(schemaType);
      }
    }
  }

  private buildSimpleType(schemaType: string): TypeScriptType {
    switch (schemaType.toLowerCase()) {
      case SwaggerType.STRING: {
        return TypeScriptType.STRING;
      }
      case SwaggerType.NUMBER:
      case SwaggerType.INTEGER: {
        return TypeScriptType.NUMBER;
      }
      default: {
        return TypeScriptType.EMPTY_OBJECT;
      }
    }
  }

  private buildResponseSchema(): string {
    // TODO: This does not cover other "success" codes such as "206", etc.
    const response200 = this.responses['200'] as OpenAPIV2.ResponseObject;
    const response201 = this.responses['201'] as OpenAPIV2.ResponseObject;

    const response200Schema =
      response200 && response200.schema
        ? this.buildTypeFromSchema(response200.schema, `${this.url}/${this.method}/200`)
        : '';
    const response201Schema =
      response201 && response201.schema
        ? this.buildTypeFromSchema(response201.schema, `${this.url}/${this.method}/201`)
        : '';

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
