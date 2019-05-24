import fs from 'fs-extra';
import path from 'path';
import {inspect} from 'util';

import {DirEntry} from '../util/FileUtil';
import * as StringUtil from '../util/StringUtil';
import {GeneratorContext, TemplateGenerator} from './TemplateGenerator';

interface API {
  [name: string]: string | API;
}

interface Import {
  dir: string;
  files: string[];
}

interface Context extends GeneratorContext {
  API: string;
  imports: Import[];
}

export class APIClientGenerator extends TemplateGenerator {
  private readonly fileIndex: DirEntry;
  private readonly outputDirectory: string;
  protected readonly name: string;
  protected readonly templateFile: string;

  constructor(fileIndex: DirEntry, outputDirectory: string) {
    super();
    this.name = 'APIClient';
    this.outputDirectory = outputDirectory;
    this.fileIndex = fileIndex;
    this.templateFile = `${this.name}.hbs`;
  }

  async generateAPI(fileIndex: DirEntry): Promise<API> {
    const api: API = {};

    for (const fileName of Object.keys(fileIndex.files)) {
      const objectName = `${fileName.charAt(0).toLowerCase()}${fileName.slice(1)}`;
      api[objectName] = `new ${fileName}(this.httpClient)`;
    }

    for (let [directoryName, directory] of Object.entries(fileIndex.directories)) {
      directoryName = StringUtil.camelize(directoryName);
      api[directoryName] = await this.generateAPI(directory);
    }

    return api;
  }

  private generateImports(fileIndex: DirEntry): Import[] {
    const bundledImports = this.bundleImports(fileIndex);
    return Object.entries(bundledImports).map(([dir, files]) => ({dir, files}));
  }

  private bundleImports(fileIndex: DirEntry): Record<string, string[]> {
    let bundledImports: Record<string, string[]> = {};

    for (const [fileName, file] of Object.entries(fileIndex.files)) {
      const relativePath = path.dirname(path.relative(this.outputDirectory, file.fullPath)).replace(/\\/g, '/');

      bundledImports[relativePath] = bundledImports[relativePath] || [];
      bundledImports[relativePath].push(fileName);
    }

    for (const directory of Object.values(fileIndex.directories)) {
      bundledImports = {
        ...bundledImports,
        ...this.bundleImports(directory),
      };
    }

    return bundledImports;
  }

  async write(): Promise<void> {
    const renderedClient = await this.toString();
    return fs.outputFile(path.join(this.outputDirectory, this.filePath), renderedClient, 'utf-8');
  }

  protected async getContext(): Promise<Context> {
    const API = await this.generateAPI(this.fileIndex.directories.api);
    const apiString = inspect(API, {breakLength: Infinity}).replace(/'/gm, '');
    const imports = this.generateImports(this.fileIndex);

    return {
      API: apiString,
      imports,
    };
  }
}
