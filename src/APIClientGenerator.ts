import fs from 'fs-extra';
import Handlebars from 'handlebars';
import path from 'path';
import {Path, Spec} from 'swagger-schema-official';

import {BaseClient} from './info/BaseClient';
import {ParsedResource} from './info/ParsedResource';
import {StringUtil} from './util/StringUtil';
import {validateConfig} from './validator/SwaggerValidator';

require('handlebars-helpers')(['comparison']);

Handlebars.registerHelper('surroundWithCurlyBraces', text => {
  return new Handlebars.SafeString(`{${text}}`);
});

export async function writeClient(inputFile: string, outputDirectory: string): Promise<void> {
  const swaggerJson: Spec = await fs.readJson(inputFile);
  await validateConfig(swaggerJson);
  return generateClient(swaggerJson, outputDirectory);
}

export async function exportServices(swaggerJson: Spec): Promise<ParsedResource[]> {
  const resources: ParsedResource[] = [];
  const recordedUrls: Record<string, Record<string, Path>> = {};

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

export async function generateClient(swaggerJson: Spec, outputDirectory: string) {
  const resources = await exportServices(swaggerJson);

  for (const restResource of resources) {
    const rendered = await restResource.toString();
    await fs.outputFile(path.join(outputDirectory, restResource.filePath), rendered, 'utf-8');
  }

  const baseClient = new BaseClient(outputDirectory);
  const rendered = await baseClient.toString();
  await fs.outputFile(path.join(outputDirectory, baseClient.filePath), rendered, 'utf-8');
}
