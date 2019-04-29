import fs from 'fs-extra';
import Handlebars from 'handlebars';
import path from 'path';
import prettier from 'prettier';
import {BaseClient} from './info/BaseClient';
import {ParsedResource} from './info/ParsedResource';
import {SwaxiosGenerator} from './info/SwaxiosGenerator';
import {validateConfig} from './validator/SwaggerValidator';

Handlebars.registerHelper('surroundWithCurlyBraces', text => {
  return new Handlebars.SafeString(`{${text}}`);
});

function getTemplateFile(parsedInfo: SwaxiosGenerator): string | void {
  const templateDirectory = path.join(process.cwd(), 'src/template');

  if (parsedInfo instanceof ParsedResource) {
    return path.join(templateDirectory, 'APIClass.hbs');
  } else if (parsedInfo instanceof BaseClient) {
    return path.join(templateDirectory, 'APIClient.hbs');
  }
}

function getContext(parsedInfo: SwaxiosGenerator): Record<string, any> | void {
  if (parsedInfo instanceof ParsedResource || parsedInfo instanceof BaseClient) {
    return parsedInfo.context;
  }
}

async function renderTemplate(parsedInfo: SwaxiosGenerator): Promise<string | void> {
  const templateFile = getTemplateFile(parsedInfo);
  const context = getContext(parsedInfo);
  if (templateFile && context) {
    const templateSource = await fs.readFile(templateFile, 'utf8');
    const template = Handlebars.compile(templateSource);
    return template(context);
  }
}

async function writeTemplate(templatingClass: SwaxiosGenerator, outputFilePath: string): Promise<void> {
  const renderedTemplate = await renderTemplate(templatingClass);
  const prettified = prettier.format(String(renderedTemplate), {
    parser: 'typescript',
    singleQuote: true,
  });
  await fs.outputFile(outputFilePath, prettified);
}

export async function generateClient(
  inputFile: string,
  outputDirectory: string,
  writeFiles: boolean = true
): Promise<void> {
  const swaggerJson = await fs.readJson(inputFile);
  await validateConfig(swaggerJson);

  for (const url of Object.keys(swaggerJson.paths)) {
    const restResource = new ParsedResource(url, swaggerJson.paths[url]);
    if (writeFiles) {
      await writeTemplate(restResource, path.join(outputDirectory, restResource.filePath));
    }
  }

  if (writeFiles) {
    const baseClient = new BaseClient(swaggerJson.paths);
    await writeTemplate(baseClient, path.join(outputDirectory, baseClient.filePath));
  }
}
