import {Path, Spec} from 'swagger-schema-official';
import {MethodGenerator} from './MethodGenerator';
import {TemplateGenerator} from './TemplateGenerator';

export class ResourceGenerator extends TemplateGenerator {
  private readonly directory: string;
  private readonly methods: MethodGenerator[] = [];
  protected readonly name: string;
  protected readonly templateFile: string;
  readonly fullyQualifiedName: string;

  constructor(fullyQualifiedName: string, resources: Record<string, Path>, spec: Spec) {
    super();
    const stopIndex = fullyQualifiedName.lastIndexOf('/');

    if (stopIndex > -1) {
      this.directory = fullyQualifiedName.substr(0, stopIndex);
      this.name = fullyQualifiedName.substr(stopIndex + 1);
    } else {
      this.directory = '/';
      this.name = fullyQualifiedName;
    }

    Object.entries(resources).forEach(([url, definition]) => {
      for (const [method, data] of Object.entries(definition)) {
        const methodDefinition = new MethodGenerator(url, method, data.responses, spec);
        this.methods.push(methodDefinition);
      }
    });

    this.fullyQualifiedName = `${this.directory}/${this.name}`;
    this.templateFile = 'Resource.hbs';
  }

  protected async getContext() {
    return {
      methods: this.methods,
      name: this.name,
    };
  }

  get filePath(): string {
    return `${this.directory}/${this.name}.ts`;
  }
}
