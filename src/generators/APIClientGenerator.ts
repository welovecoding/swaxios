import fs from 'fs-extra';
import path from 'path';
import {inspect} from 'util';

import {OpenAPIV2} from 'openapi-types';
import {DirEntry, FileEntry} from '../util/FileUtil';
import * as StringUtil from '../util/StringUtil';
import {GeneratorContext, TemplateGenerator} from './TemplateGenerator';

export interface API {
  [name: string]: string | API;
}

interface Import {
  dir: string;
  files: FileEntry[];
}

interface Context extends GeneratorContext {
  API: string;
  description?: string;
  imports: Import[];
}

export class APIClientGenerator extends TemplateGenerator {
  private readonly fileIndex: DirEntry;
  private readonly outputDirectory: string;
  protected readonly description?: string;
  protected readonly name: string;
  protected readonly templateFile: string;

  constructor(fileIndex: DirEntry, outputDirectory: string, spec: OpenAPIV2.Document) {
    super();
    this.name = 'APIClient';
    this.outputDirectory = outputDirectory;
    this.fileIndex = fileIndex;
    this.templateFile = `${this.name}.hbs`;
    this.description = StringUtil.addStarsToNewline(spec.info.description);
  }

  async generateAPI(fileIndex: DirEntry): Promise<API> {
    const api: API = {};

    for (const {alternativeName, name} of Object.values(fileIndex.files)) {
      const fileName = alternativeName || name;
      const objectName = `${name.charAt(0).toLowerCase()}${name.slice(1)}`;
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

  private bundleImports(fileIndex: DirEntry): Record<string, FileEntry[]> {
    let bundledImports: Record<string, FileEntry[]> = {};

    for (const file of Object.values(fileIndex.files)) {
      const relativePath = path.dirname(path.relative(this.outputDirectory, file.fullPath)).replace(/\\/g, '/');

      bundledImports[relativePath] = bundledImports[relativePath] || [];
      bundledImports[relativePath]?.push(file);
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
    const API = await this.generateAPI(this.fileIndex.directories.rest!);
    const apiString = inspect(API, {breakLength: Infinity, depth: Infinity}).replace(/'/gm, '');
    const imports = this.generateImports(this.fileIndex);

    return {
      API: apiString,
      description: this.description,
      imports,
    };
  }
}
