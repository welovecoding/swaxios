import fs from 'fs-extra';
import Handlebars from 'handlebars';
import path from 'path';
import prettier from 'prettier';
import {Spec} from 'swagger-schema-official';
import {BaseClient} from './info/BaseClient';
import {ParsedResource} from './info/ParsedResource';
import {SwaxiosGenerator} from './info/SwaxiosGenerator';
import {validateConfig} from './validator/SwaggerValidator';

Handlebars.registerHelper('surroundWithCurlyBraces', text => {
  return new Handlebars.SafeString(`{${text}}`);
});

Handlebars.registerHelper('ifNotEquals', (arg1, arg2, options) => {
  //@ts-ignore
  return arg1 != arg2 ? options.fn(this) : options.inverse(this);
});

function getTemplateFile(parsedInfo: SwaxiosGenerator): string | void {
  const templateDirectory = path.join(process.cwd(), 'src/template');

  if (parsedInfo instanceof ParsedResource) {
    return path.join(templateDirectory, 'APIClass.hbs');
  } else if (parsedInfo instanceof BaseClient) {
    return path.join(templateDirectory, 'APIClient.hbs');
  }
}

function getContext(parsedInfo: SwaxiosGenerator): Promise<any> | void {
  if (parsedInfo instanceof ParsedResource || parsedInfo instanceof BaseClient) {
    return parsedInfo.getContext();
  }
}

async function renderTemplate(parsedInfo: SwaxiosGenerator): Promise<string> {
  const templateFile = getTemplateFile(parsedInfo);
  const context = await getContext(parsedInfo);
  if (templateFile && context) {
    const templateSource = await fs.readFile(templateFile, 'utf8');
    const template = Handlebars.compile(templateSource);
    return template(context);
  }
  return '';
}

async function writeTemplate(templatingClass: SwaxiosGenerator, outputFilePath: string): Promise<void> {
  const renderedTemplate = await renderTemplate(templatingClass);
  const prettified = prettier.format(renderedTemplate, {
    parser: 'typescript',
    singleQuote: true,
  });
  await fs.outputFile(outputFilePath, prettified);
}

export async function writeClient(inputFile: string, outputDirectory: string): Promise<void> {
  const swaggerJson: Spec = await fs.readJson(inputFile);
  await validateConfig(swaggerJson);
  return generateClient(swaggerJson, outputDirectory);
}

export async function generateClient(swaggerJson: Spec, outputDirectory?: string) {
  for (const url of Object.keys(swaggerJson.paths)) {
    const restResource = new ParsedResource(url, swaggerJson.paths[url], swaggerJson);
    if (outputDirectory) {
      await writeTemplate(restResource, path.join(outputDirectory, restResource.filePath));
    }
  }

  if (outputDirectory) {
    const baseClient = new BaseClient(outputDirectory);
    await writeTemplate(baseClient, path.join(outputDirectory, baseClient.filePath));
  }
}
