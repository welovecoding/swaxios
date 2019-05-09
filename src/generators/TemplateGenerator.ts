import fs from 'fs-extra';
import Handlebars from 'handlebars';
import path from 'path';
import prettier from 'prettier';

export abstract class TemplateGenerator {
  protected abstract name: string;
  protected abstract templateFile: string;
  protected abstract async getContext(): Promise<any>;

  protected getTemplateFile(): string {
    return path.resolve(__dirname, '../../src/templates', this.templateFile);
  }

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
      bracketSpacing: false,
      parser: 'typescript',
      singleQuote: true,
      trailingComma: 'es5',
    });
  }

  get filePath(): string {
    return `${this.name}.ts`;
  }

  toString(): Promise<string> {
    return this.writeTemplate();
  }
}
