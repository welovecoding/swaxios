import {StringUtil} from "../util/StringUtil";
import {RequestMethod} from "./RequestMethod";

class ParsedResource {
  public directory: string;
  public methods: RequestMethod[];
  public name: string;
  public url: string;

  constructor(url: string, methodDefinitions: { [index: string]: any } = {}) {
    this.directory = url.substr(0, url.lastIndexOf('/'));
    this.methods = [];
    this.name = StringUtil.generateServiceName(url);
    this.url = url;

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