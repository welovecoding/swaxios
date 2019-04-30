import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {inspect} from 'util';

import {StringUtil} from '../util/StringUtil';
import {SwaxiosGenerator} from './SwaxiosGenerator';

interface API {
  [name: string]: string | API;
}

interface FileEntry {
  fullPath: string;
  name: string;
}

interface DirEntry {
  directories: Record<string, DirEntry>;
  files: Record<string, FileEntry>;
  name: string;
}

class BaseClient implements SwaxiosGenerator {
  private readonly outputDirectory: string;

  constructor(outputDirectory: string) {
    this.outputDirectory = outputDirectory;
  }

  private async generateFileIndex(directory: string): Promise<DirEntry> {
    const resolvedDir = path.resolve(directory);
    const fileIndex: DirEntry = {
      directories: {},
      files: {},
      name: path.basename(resolvedDir),
    };

    try {
      const dirObjects = await fs.readdir(resolvedDir);

      const generateIndices = dirObjects.sort().map(async fileName => {
        const resolvedFile = path.join(resolvedDir, fileName);
        const lstat = await fs.lstat(resolvedFile);
        fileName = fileName.replace('.ts', '');

        if (lstat.isFile()) {
          fileIndex.files[fileName] = {
            fullPath: resolvedFile.replace('.ts', ''),
            name: fileName,
          };
        } else if (lstat.isDirectory()) {
          const deepIndex = await this.generateFileIndex(resolvedFile);
          fileIndex.directories[fileName] = deepIndex;
        }
      });

      await Promise.all(generateIndices);
    } catch (error) {
      console.error(error);
    }

    return fileIndex;
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

  async generateImports(fileIndex: DirEntry): Promise<string[]> {
    let imports = [];

    for (const [fileName, file] of Object.entries(fileIndex.files)) {
      const apiName = StringUtil.camelize(fileName);
      const relativePath = path.relative(this.outputDirectory, file.fullPath).replace(/\\/g, '/');
      imports.push(`import {${apiName}} from './${relativePath}'`);
    }

    for (const directory of Object.values(fileIndex.directories)) {
      imports = imports.concat(await this.generateImports(directory));
    }

    return imports;
  }

  get filePath(): string {
    return `APIClient.ts`;
  }

  async getContext(): Promise<API> {
    const fileIndex = await this.generateFileIndex(this.outputDirectory);
    // FIXME: The file shouldn't exist in the first place!
    delete fileIndex.files[this.filePath];

    const API = await this.generateAPI(fileIndex);
    const apiString = inspect(API).replace(/'/gm, '');
    const imports = await this.generateImports(fileIndex);

    return {
      api: apiString,
      imports: imports.join(os.EOL),
    };
  }
}

export {BaseClient};
