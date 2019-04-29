import fs from 'fs-extra';
import Handlebars from 'handlebars';
import path from 'path';
import prettier from 'prettier';
import {BaseClient} from './info/BaseClient';
import {ParsedResource} from './info/ParsedResource';
import {validateConfig} from './validator/SwaggerValidator';

Handlebars.registerHelper('surroundWithCurlyBraces', text => {
  return new Handlebars.SafeString(`{${text}}`);
});

function getTemplateFile(parsedInfo: any): string | undefined {
  const templateDirectory = path.join(process.cwd(), 'src', 'template');

  if (parsedInfo instanceof ParsedResource) {
    return path.join(templateDirectory, 'APIClass.hbs');
  } else if (parsedInfo instanceof BaseClient) {
    return path.join(templateDirectory, 'APIClient.hbs');
  } else {
    return undefined;
  }
}

function getContext(parsedInfo: any): {[index: string]: any} | undefined {
  if (parsedInfo instanceof ParsedResource) {
    return parsedInfo.context;
  } else if (parsedInfo instanceof BaseClient) {
    return parsedInfo.context;
  } else {
    return undefined;
  }
}

function renderTemplate(parsedInfo: any) {
  const templateFile = getTemplateFile(parsedInfo);
  const context = getContext(parsedInfo);
  if (templateFile && context) {
    const templateSource = fs.readFileSync(templateFile, 'utf8');
    const template = Handlebars.compile(templateSource);
    return template(context);
  }
}

function writeTemplate(templatingClass: any, outputFilePath: string) {
  const renderedTemplate = renderTemplate(templatingClass);
  const prettified = prettier.format(String(renderedTemplate), {
    parser: 'typescript',
    singleQuote: true,
  });
  const outputFile = path.join(outputFilePath);
  fs.outputFileSync(outputFile, prettified);
}

export async function generateClient(inputFile: string, outputDirectory: string, writeFiles: boolean = true) {
  const swaggerJson = fs.readJsonSync(inputFile);
  await validateConfig(swaggerJson);

  const urls = Object.keys(swaggerJson.paths);
  urls.forEach(url => {
    const restResource = new ParsedResource(url, swaggerJson.paths[url]);
    if (writeFiles) {
      writeTemplate(restResource, path.join(outputDirectory, restResource.filePath));
    }
  });

  if (writeFiles) {
    writeTemplate(new BaseClient(), path.join(outputDirectory, 'APIClient.ts'));
  }
}
