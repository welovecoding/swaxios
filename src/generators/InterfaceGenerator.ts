import fs from 'fs-extra';
import {OpenAPIV2} from 'openapi-types';
import path from 'path';
import {inspect} from 'util';

import {GeneratorContext, TemplateGenerator} from './TemplateGenerator';

export enum SwaggerType {
  ARRAY = 'array',
  BOOLEAN = 'boolean',
  INTEGER = 'integer',
  NUMBER = 'number',
  OBJECT = 'object',
  STRING = 'string',
}

export enum TypeScriptType {
  ANY = 'any',
  ARRAY = 'Array',
  BOOLEAN = 'boolean',
  EMPTY_OBJECT = '{}',
  NUMBER = 'number',
  STRING = 'string',
  INTERFACE = 'interface',
  TYPE = 'type',
}

interface SwaxiosInterface {
  basicType?: TypeScriptType;
  type: string;
  imports: string[];
}

interface Context extends GeneratorContext {
  basicType?: string;
  imports: string[];
  name: string;
  typeData: string;
}

export class InterfaceGenerator extends TemplateGenerator {
  protected readonly name: string;
  protected readonly templateFile: string;
  private readonly spec: OpenAPIV2.Document;
  private readonly definition: OpenAPIV2.Schema;
  private readonly outputDirectory: string;

  constructor(definitionName: string, definition: OpenAPIV2.Schema, spec: OpenAPIV2.Document, outputDirectory: string) {
    super();
    this.name = definitionName;
    this.templateFile = 'Interface.hbs';
    this.spec = spec;
    this.definition = definition;
    this.outputDirectory = outputDirectory;

    fs.ensureDirSync(this.outputDirectory);
  }

  public static buildInterface(
    spec: OpenAPIV2.Document,
    schema: OpenAPIV2.SchemaObject | OpenAPIV2.ReferenceObject,
    schemaName: string,
    imports: string[] = [],
    basicType: TypeScriptType = TypeScriptType.TYPE,
  ): SwaxiosInterface {
    const reference = (schema as OpenAPIV2.ReferenceObject).$ref;

    if (reference && reference.startsWith('#/definitions')) {
      if (!spec.definitions) {
        console.info('Spec has no definitions.');
        return {type: TypeScriptType.EMPTY_OBJECT, imports};
      }
      const definition = reference.replace('#/definitions/', '');
      if (!imports.includes(definition)) {
        imports.push(definition);
      }
      return {type: definition, imports};
    }

    const schemaObject = schema as OpenAPIV2.SchemaObject;
    const {required: requiredProperties, properties} = schemaObject;

    let schemaType = schemaObject.type || SwaggerType.OBJECT;

    if (Array.isArray(schemaType)) {
      schemaType = schemaType[0];
    }

    switch (schemaType.toLowerCase()) {
      case SwaggerType.BOOLEAN: {
        return {basicType, type: TypeScriptType.BOOLEAN, imports};
      }
      case SwaggerType.STRING: {
        return {basicType, type: TypeScriptType.STRING, imports};
      }
      case SwaggerType.NUMBER:
      case SwaggerType.INTEGER: {
        return {basicType, type: TypeScriptType.NUMBER, imports};
      }
      case SwaggerType.OBJECT: {
        if (!properties) {
          console.info(`Schema type for "${schemaName}" is "object" but has no properties.`);
          return {basicType: TypeScriptType.INTERFACE, type: TypeScriptType.EMPTY_OBJECT, imports};
        }

        const schema: Record<string, string> = {};

        for (const property in properties) {
          const propertyName = requiredProperties && !requiredProperties.includes(property) ? `${property}?` : property;
          const {type: propertyType, imports: propertyImports} = InterfaceGenerator.buildInterface(
            spec,
            properties[property],
            property,
            imports,
          );
          schema[propertyName] = propertyType;
          for (const propertyImport of propertyImports) {
            if (!imports.includes(propertyImport)) {
              imports.push(propertyImport);
            }
          }
        }

        const type = inspect(schema, {breakLength: Infinity})
          .replace(/'/gm, '')
          .replace(',', ';')
          .replace(new RegExp('\\n', 'g'), '');
        return {basicType: TypeScriptType.INTERFACE, type, imports};
      }
      case SwaggerType.ARRAY: {
        if (!schemaObject.items) {
          console.info(`Schema type for "${schemaName}" is "array" but has no items.`);
          return {basicType, type: `${TypeScriptType.ARRAY}<${TypeScriptType.ANY}>`, imports};
        }

        if (!(schemaObject.items instanceof Array)) {
          const {imports: itemImports, type: itemType} = InterfaceGenerator.buildInterface(
            spec,
            schemaObject.items,
            schemaName,
            imports,
          );
          for (const itemImport of itemImports) {
            if (!imports.includes(itemImport)) {
              imports.push(itemImport);
            }
          }
          return {basicType, type: `${TypeScriptType.ARRAY}<${itemType}>`, imports};
        }

        const itemTypes = schemaObject.items.map(itemSchema =>
          InterfaceGenerator.buildInterface(spec, itemSchema, schemaName, imports, basicType),
        );

        const schemes = itemTypes.map(item => item.type).join('|');
        for (const itemType of itemTypes) {
          for (const itemImport of itemType.imports) {
            if (!imports.includes(itemImport)) {
              imports.push(itemImport);
            }
          }
        }
        return {basicType, type: `${TypeScriptType.ARRAY}<${schemes}>`, imports};
      }
      default: {
        return {basicType, type: TypeScriptType.EMPTY_OBJECT, imports};
      }
    }
  }

  generateInterface(): SwaxiosInterface {
    return InterfaceGenerator.buildInterface(this.spec, this.definition, this.name);
  }

  async write(): Promise<void> {
    const renderedIndex = await this.toString();
    const outputFile = path.join(this.outputDirectory, this.filePath);
    return fs.outputFile(outputFile, renderedIndex, 'utf-8');
  }

  protected async getContext(): Promise<Context> {
    const {basicType, imports, type: typeData} = this.generateInterface();

    return {
      basicType: basicType || '',
      imports,
      name: this.name,
      typeData,
    };
  }
}
