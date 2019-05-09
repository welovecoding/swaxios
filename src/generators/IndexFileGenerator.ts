import fs from 'fs-extra';
import path from 'path';

import {TemplateGenerator} from './TemplateGenerator';

export class IndexFileGenerator extends TemplateGenerator {
  exportFiles: string[];
  name: string;
  outputDirectory: string;

  constructor(exportFiles: string[], outputDirectory: string) {
    super();
    this.name = 'index';
    this.exportFiles = exportFiles;
    this.outputDirectory = outputDirectory;
  }

  getTemplateFile(): string {
    const templateDirectory = path.join(process.cwd(), 'src/template');
    return path.join(templateDirectory, `${this.name}.hbs`);
  }

  async write(): Promise<void> {
    const renderedIndex = await this.toString();
    const outputFile = path.join(this.outputDirectory, this.filePath);
    return fs.outputFile(outputFile, renderedIndex, 'utf-8');
  }

  async getContext() {
    return {
      exports: this.exportFiles.map(fileName => `./${fileName}`),
    };
  }
}
