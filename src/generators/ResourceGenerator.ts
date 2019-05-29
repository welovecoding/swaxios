import {Path, Spec} from 'swagger-schema-official';
import {camelCase} from '../util/StringUtil';
import {HttpMethod, MethodGenerator} from './MethodGenerator';
import {GeneratorContext, TemplateGenerator} from './TemplateGenerator';

interface Context extends GeneratorContext {
  methods: MethodGenerator[];
  name: string;
}

export class ResourceGenerator extends TemplateGenerator {
  private readonly directory: string;
  private readonly methods: MethodGenerator[] = [];
  protected readonly name: string;
  protected readonly templateFile: string;
  readonly fullyQualifiedName: string;

  constructor(fullyQualifiedName: string, resources: Record<string, Path>, spec: Spec) {
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

    Object.entries(resources).forEach(([url, definition]) => {
      for (const [method, data] of Object.entries(definition)) {
        const methodDefinition = new MethodGenerator(url, method as HttpMethod, data, spec);
        this.methods.push(methodDefinition);
      }
    });

    this.fullyQualifiedName = `${this.directory}/${this.name}`;
    this.templateFile = 'Resource.hbs';
  }

  protected async getContext(): Promise<Context> {
    return {
      methods: this.methods,
      name: this.name,
    };
  }

  get filePath(): string {
    return `${this.directory}/${this.name}.ts`;
  }
}
