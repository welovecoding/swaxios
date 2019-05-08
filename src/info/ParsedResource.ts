import path from 'path';

import {Path, Spec} from 'swagger-schema-official';
import {RequestMethod} from './RequestMethod';
import {SwaxiosGenerator} from './SwaxiosGenerator';

class ParsedResource extends SwaxiosGenerator {
  directory: string;
  methods: RequestMethod[] = [];
  name: string;
  fullyQualifiedName: string;

  constructor(fullyQualifiedName: string, resourceDefinitions: Record<string, Path> = {}, spec: Spec) {
    super();
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

    this.fullyQualifiedName = `${this.directory}/${this.name}`;
  }

  getTemplateFile(): string {
    const templateDirectory = path.join(process.cwd(), 'src/template');
    return path.join(templateDirectory, 'APIClass.hbs');
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
