import {OpenAPIV2} from 'openapi-types';

import * as StringUtil from '../util/StringUtil';
import {InterfaceGenerator, SwaggerType, TypeScriptType} from './InterfaceGenerator';

interface InternalParameter {
  name: string;
  required?: boolean;
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
  readonly imports: string[];
  readonly requiresBearerAuthorization: boolean;
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
    this.method = method;
    this.normalizedUrl = StringUtil.normalizeUrl(url);
    this.formattedUrl = `'${url}'`;
    this.spec = spec;
    this.responses = operation.responses;

    this.bodyParameters = [];
    this.imports = [];
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
    this.parameterMethod = this.operation.operationId || `${this.method}${postFix}`;

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

    this.requiresBearerAuthorization =
      !!this.operation.security && this.operation.security.some(obj => Object.keys(obj).includes('Bearer'));
  }

  private includesSuccessResponse(
    responses: Record<string, OpenAPIV2.ResponseObject | OpenAPIV2.ReferenceObject>
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
        parameter => !this.parameterIsReference(parameter)
      ) as OpenAPIV2.ParameterObject[];

      const extractDescription = (parameter: OpenAPIV2.ParameterObject): Description | undefined => {
        if (parameter.description) {
          return {
            name: parameter.name,
            text: StringUtil.addStarsToNewline(parameter.description),
          };
        }
        return;
      };

      return parameters.map(extractDescription).filter(Boolean) as Description[];
    }

    return undefined;
  }

  private parameterIsReference(
    parameter: OpenAPIV2.ReferenceObject | OpenAPIV2.ParameterObject
  ): parameter is OpenAPIV2.ReferenceObject {
    return !!(parameter as OpenAPIV2.ReferenceObject).$ref;
  }

  private getSchemaFromRef(ref: string): OpenAPIV2.SchemaObject | OpenAPIV2.ParameterObject | undefined {
    if (!ref.startsWith('#/definitions')) {
      console.warn(`Invalid reference "${ref}".`);
      return;
    }
    if (!this.spec.definitions) {
      console.warn(`No reference found for "${ref}".`);
      return;
    }
    const definitionString = ref.replace('#/definitions/', '');
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
          return this.buildParameters([definition as OpenAPIV2.ParameterObject]);
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
        let type: string = TypeScriptType.EMPTY_OBJECT;

        if (parameter.schema) {
          const builtInterface = InterfaceGenerator.buildInterface(this.spec, parameter.schema, parameter.name);
          type = builtInterface.type;
          for (const interfaceImport of builtInterface.imports) {
            if (!this.imports.includes(interfaceImport)) {
              this.imports.push(interfaceImport);
            }
          }
        }

        this.bodyParameters.push({
          name: parameter.name,
          required: parameter.required,
          type,
        });
      }

      if (parameter.in === 'query' && parameter.type) {
        const type = this.buildSimpleType(parameter.type);
        this.queryParameters.push({
          name: parameter.name,
          required: parameter.required,
          type,
        });
      }
    }
  }

  private buildSimpleType(schemaType: string): TypeScriptType {
    switch (schemaType.toLowerCase()) {
      case SwaggerType.STRING: {
        return TypeScriptType.STRING;
      }
      case SwaggerType.BOOLEAN: {
        return TypeScriptType.BOOLEAN;
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

    let response200Schema = '';

    if (response200 && response200.schema) {
      const response200Interface = InterfaceGenerator.buildInterface(
        this.spec,
        response200.schema,
        `${this.url}/${this.method}/200`
      );
      response200Schema = response200Interface.type;
      this.imports.push(...response200Interface.imports);
    }

    let response201Schema = '';

    if (response201 && response201.schema) {
      const response201Interface = InterfaceGenerator.buildInterface(
        this.spec,
        response201.schema,
        `${this.url}/${this.method}/201`
      );
      response201Schema = response201Interface.type;
      this.imports.push(...response201Interface.imports);
    }

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
