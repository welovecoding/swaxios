import {OpenAPIV2} from 'openapi-types';
import {camelCase} from '../util/StringUtil';
import {HttpMethod, MethodGenerator} from './MethodGenerator';
import {GeneratorContext, TemplateGenerator} from './TemplateGenerator';

interface Context extends GeneratorContext {
  imports: {path: string; list: string[]};
  methods: MethodGenerator[];
  name: string;
}

export class ResourceGenerator extends TemplateGenerator {
  private readonly directory: string;
  private readonly methods: MethodGenerator[] = [];
  protected readonly name: string;
  protected readonly templateFile: string;
  readonly fullyQualifiedName: string;
  readonly imports: {path: string; list: string[]};

  constructor(fullyQualifiedName: string, resources: Record<string, OpenAPIV2.PathsObject>, spec: OpenAPIV2.Document) {
    super();
    const directories = fullyQualifiedName.split('/');

    if (directories.length > 2) {
      this.name = camelCase(directories.slice(-1), true);
      directories.pop();
      this.directory = directories.join('/');
    } else if (directories.length > 1) {
      this.name = directories.pop()!;
      this.directory = directories.join('/');
    } else {
      this.directory = '/';
      this.name = fullyQualifiedName;
    }

    const interfacesDir = this.directory.replace(/[^\/]+/g, '..');

    this.imports = {
      list: [],
      path: `${interfacesDir}/interfaces/`,
    };

    for (const [url, definition] of Object.entries(resources)) {
      for (const [method, data] of Object.entries(definition)) {
        const methodDefinition = new MethodGenerator(url, method as HttpMethod, data, spec);
        this.methods.push(methodDefinition);
        for (const importValue of methodDefinition.imports) {
          if (!this.imports.list.includes(importValue)) {
            this.imports.list.push(importValue);
          }
        }
      }
    }

    this.fullyQualifiedName = `${this.directory}/${this.name}`;
    this.templateFile = 'Resource.hbs';
  }

  protected async getContext(): Promise<Context> {
    return {
      imports: this.imports,
      methods: this.methods,
      name: this.name,
    };
  }

  get filePath(): string {
    return `${this.directory}/${this.name}.ts`;
  }
}
