import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {inspect} from 'util';

import {DirEntry} from '../util/FileUtil';
import * as StringUtil from '../util/StringUtil';
import {TemplateGenerator} from './TemplateGenerator';

interface API {
  [name: string]: string | API;
}

export class APIClientGenerator extends TemplateGenerator {
  private readonly outputDirectory: string;
  readonly name: string;
  private readonly fileIndex: DirEntry;

  constructor(fileIndex: DirEntry, outputDirectory: string) {
    super();
    this.name = 'APIClient';
    this.outputDirectory = outputDirectory;
    this.fileIndex = fileIndex;
  }

  getTemplateFile(): string {
    const templateDirectory = path.join(process.cwd(), 'src/template');
    return path.join(templateDirectory, `${this.name}.hbs`);
  }

  async generateAPI(fileIndex: DirEntry): Promise<API> {
    const api: API = {};

    for (const fileName of Object.keys(fileIndex.files)) {
      const apiName = StringUtil.camelize(fileName);
      api[apiName] = `new ${apiName}(this.httpClient)`;
    }

    for (let [directoryName, directory] of Object.entries(fileIndex.directories)) {
      directoryName = StringUtil.camelize(directoryName);
      api[directoryName] = await this.generateAPI(directory);
    }

    return api;
  }

  private generateImports(fileIndex: DirEntry): string[] {
    const bundledImports = this.bundleImports(fileIndex);
    return Object.entries(bundledImports).map(([dir, files]) => `import {${files.join(', ')}} from './${dir}'`);
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

  async getContext(): Promise<API> {
    const fileIndex = this.fileIndex;

    const API = await this.generateAPI(fileIndex);
    const apiString = inspect(API, {breakLength: Infinity}).replace(/'/gm, '');
    const imports = await this.generateImports(fileIndex);

    return {
      API: apiString,
      imports: imports.join(os.EOL),
    };
  }
}
