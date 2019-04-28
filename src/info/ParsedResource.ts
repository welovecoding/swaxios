import {StringUtil} from "../util/StringUtil";

class ParsedResource {
  public name: string;
  public url: string;
  public directory: string;

  constructor(url: string) {
    this.url = url;

    const urlParts = url.split('/');
    const lastUrlPart = urlParts[urlParts.length - 1];
    const resourceName = lastUrlPart ? lastUrlPart : 'Root';
    this.name = StringUtil.pascalCase([resourceName, 'service']);

    const urlPath = url.substr(0, url.lastIndexOf('/'));
    this.directory = urlPath;
  }

  get filePath(): string {
    return `${this.directory}/${this.name}.ts`;
  }
}

export {ParsedResource};
