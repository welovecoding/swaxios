import {Path, Spec} from 'swagger-schema-official';
import {RequestMethod} from './RequestMethod';
import {SwaxiosGenerator} from './SwaxiosGenerator';

class ParsedResource implements SwaxiosGenerator {
  public directory: string;
  public methods: RequestMethod[] = [];
  public name: string;

  constructor(fullyQualifiedName: string, resourceDefinitions: {[pathName: string]: Path} = {}, spec: Spec) {
    const stopIndex = fullyQualifiedName.lastIndexOf('/');

    if (stopIndex > -1) {
      this.directory = fullyQualifiedName.substr(0, stopIndex);
      this.name = fullyQualifiedName.substr(stopIndex + 1);
    } else {
      this.directory = '/';
      this.name = fullyQualifiedName;
    }

    Object.entries(resourceDefinitions).forEach(([url, definition]) => {
      for (const [method, data] of Object.entries(definition)) {
        const methodDefinition = new RequestMethod(url, method, data.responses, spec);
        this.methods.push(methodDefinition);
      }
    });
  }

  get fullyQualifiedName(): string {
    return `${this.directory}/${this.name}`;
  }

  get filePath(): string {
    return `${this.directory}/${this.name}.ts`;
  }

  async getContext() {
    return {
      methods: this.methods,
      name: this.name,
    };
  }
}

export {ParsedResource};
