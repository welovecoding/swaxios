import {StringUtil} from "../util/StringUtil";
import {RequestMethod} from "./RequestMethod";

class ParsedResource {
  public name: string;
  public url: string;
  public directory: string;
  public methods: RequestMethod[] = [];

  constructor(url: string, methodDefinitions: { [index: string]: any }) {
    this.url = url;

    const urlParts = url.split('/');
    const lastUrlPart = urlParts[urlParts.length - 1];
    const resourceName = lastUrlPart ? lastUrlPart : 'Root';
    this.name = StringUtil.pascalCase([resourceName, 'service']);

    const urlPath = url.substr(0, url.lastIndexOf('/'));
    this.directory = urlPath;

    for (const [key, value] of Object.entries(methodDefinitions)) {
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
      name: this.name
    };
  }
}

export {ParsedResource};
