import {StringUtil} from '../util/StringUtil';
import {RequestMethod} from './RequestMethod';
import {SwaxiosGenerator} from './SwaxiosGenerator';

class ParsedResource implements SwaxiosGenerator {
  public directory: string;
  public methods: RequestMethod[];
  public name: string;
  public url: string;

  constructor(url: string, methodDefinitions: Record<string, any> = {}) {
    this.directory = url.substr(0, url.lastIndexOf('/'));
    this.methods = [];
    this.name = StringUtil.generateServiceName(url);
    this.url = url;

    for (const key of Object.keys(methodDefinitions)) {
      const methodDefinition = new RequestMethod(url, key);
      this.methods.push(methodDefinition);
    }
  }

  get filePath(): string {
    return `${this.directory}/${this.name}.ts`;
  }

  get context(): Object {
    return {
      methods: this.methods,
      name: this.name,
    };
  }
}

export {ParsedResource};
