import fs from 'fs-extra';
import Handlebars from 'handlebars';
import prettier from 'prettier';

export abstract class SwaxiosGenerator {
  abstract name: string;
  abstract getTemplateFile(): string;

  private async renderTemplate(): Promise<string> {
    const templateFile = this.getTemplateFile();
    const context = await this.getContext();
    if (templateFile && context) {
      const templateSource = await fs.readFile(templateFile, 'utf8');
      const template = Handlebars.compile(templateSource);
      return template(context);
    }
    return '';
  }

  private async writeTemplate(): Promise<string> {
    const renderedTemplate = await this.renderTemplate();
    return prettier.format(renderedTemplate, {
      parser: 'typescript',
      singleQuote: true,
    });
  }

  abstract async getContext(): Promise<any>;

  get filePath(): string {
    return `${this.name}.ts`;
  }

  toString(): Promise<string> {
    return this.writeTemplate();
  }
}
