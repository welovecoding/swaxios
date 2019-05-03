import fs from 'fs-extra';
import Handlebars from 'handlebars';
import path from 'path';
import prettier from 'prettier';
import {Path, Spec} from 'swagger-schema-official';
import {BaseClient} from './info/BaseClient';
import {ParsedResource} from './info/ParsedResource';
import {SwaxiosGenerator} from './info/SwaxiosGenerator';
import {StringUtil} from './util/StringUtil';
import {validateConfig} from './validator/SwaggerValidator';

require('handlebars-helpers')();

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

export async function exportServices(swaggerJson: Spec): Promise<ParsedResource[]> {
  const resources: ParsedResource[] = [];
  const recordedUrls: Record<string, {[pathName: string]: Path}> = {};

  for (const url of Object.keys(swaggerJson.paths)) {
    const normalizedUrl = StringUtil.normalizeUrl(url);
    const directory = normalizedUrl.substr(0, normalizedUrl.lastIndexOf('/'));
    const serviceName = StringUtil.generateServiceName(normalizedUrl);
    const fullyQualifiedName = `${directory}/${serviceName}`;

    recordedUrls[fullyQualifiedName] = {
      ...recordedUrls[fullyQualifiedName],

      [url]: swaggerJson.paths[url],
    };
  }
  for (const [fullyQualifiedName, resourceDefinitions] of Object.entries(recordedUrls)) {
    const restResource = new ParsedResource(fullyQualifiedName, resourceDefinitions, swaggerJson);
    resources.push(restResource);
  }

  return resources;
}

export async function generateClient(swaggerJson: Spec, outputDirectory?: string) {
  const resources = await exportServices(swaggerJson);

  for (const restResource of resources) {
    if (outputDirectory) {
      await writeTemplate(restResource, path.join(outputDirectory, restResource.filePath));
    }
  }

  if (outputDirectory) {
    const baseClient = new BaseClient(outputDirectory);
    await writeTemplate(baseClient, path.join(outputDirectory, baseClient.filePath));
  }
}
