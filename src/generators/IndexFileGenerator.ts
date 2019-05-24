import fs from 'fs-extra';
import path from 'path';

import {TemplateGenerator} from './TemplateGenerator';

export class IndexFileGenerator extends TemplateGenerator {
  private readonly exportFiles: string[];
  private readonly outputDirectory: string;
  protected readonly name: string;
  protected readonly templateFile: string;

  constructor(exportFiles: string[], outputDirectory: string) {
    super();
    this.name = 'index';
    this.exportFiles = exportFiles;
    this.outputDirectory = outputDirectory;
    this.templateFile = `${this.name}.hbs`;
  }

  async write(): Promise<void> {
    const renderedIndex = await this.toString();
    const outputFile = path.join(this.outputDirectory, this.filePath);
    return fs.outputFile(outputFile, renderedIndex, 'utf-8');
  }

  // tslint:disable-next-line:typedef
  protected async getContext() {
    return {
      exports: this.exportFiles.map(fileName => `./${fileName}`),
    };
  }
}
