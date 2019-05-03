import {Path, Spec} from 'swagger-schema-official';
import {StringUtil} from '../util/StringUtil';
import {RequestMethod} from './RequestMethod';
import {SwaxiosGenerator} from './SwaxiosGenerator';

class ParsedResource implements SwaxiosGenerator {
  public directory: string;
  public methods: RequestMethod[];
  public name: string;

  constructor(url: string, methodDefinitions: Path = {}, spec: Spec) {
    this.directory = url.substr(0, url.lastIndexOf('/'));
    this.methods = [];
    this.name = StringUtil.generateServiceName(url);

    for (const [method, data] of Object.entries(methodDefinitions)) {
      const methodDefinition = new RequestMethod(url, method, data.responses, spec);
      this.methods.push(methodDefinition);
    }
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
