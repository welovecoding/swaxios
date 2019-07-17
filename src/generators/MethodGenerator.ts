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
  private readonly responses: Record<string, Response | Reference>;
  private readonly spec: Spec;
  private readonly url: string;
  private readonly operation: Operation;
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

  constructor(url: string, method: HttpMethod, operation: Operation, spec: Spec) {
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

    if (this.method === HttpMethod.DELETE || this.method === HttpMethod.HEAD) {
      // TODO: Check if DELETE has "responses" with "schema", if yes then DON'T render 'void'
      this.returnType = 'void';
    } else {
      this.returnType = this.buildResponseSchema();
    }

    this.needsDataObj = !(
      this.method === HttpMethod.PATCH ||
      this.method === HttpMethod.POST ||
      this.method === HttpMethod.PUT
    );
  }

  private buildDescriptions(): Description[] | undefined {
    if (this.operation.parameters) {
      const parameters = this.operation.parameters.filter(
        parameter => !this.parameterIsReference(parameter),
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

  private buildParameters(parameters?: (Parameter | Reference)[]): void {
    if (!parameters || !parameters.length) {
      return;
    }

    for (const parameter of parameters) {
      if (this.parameterIsReference(parameter)) {
        const definition = this.getSchemaFromRef(parameter.$ref);
        if (definition) {
          return this.buildParameters([definition] as Parameter[]);
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

  private buildTypeFromSchema(schema: Schema, schemaName: string): string {
    let {required: requiredProperties, properties, type: schemaType} = schema;
    const {allOf: multipleSchemas, enum: enumType} = schema;

    if (multipleSchemas) {
      return multipleSchemas.map(includedSchema => this.buildTypeFromSchema(includedSchema, schemaName)).join('|');
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
          .map((itemSchema, index) => this.buildTypeFromSchema(itemSchema, `${schemaName}[${index}]`))
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
    const response200 = this.responses['200'] as Response;
    const response201 = this.responses['201'] as Response;

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
