import fs from 'fs-extra';
import initializeHelpers from 'handlebars-helpers';
import path from 'path';
import {Path, Spec} from 'swagger-schema-official';

import {APIClientGenerator, IndexFileGenerator, ResourceGenerator} from './generators';
import {DirEntry, generateFileIndex} from './util/FileUtil';
import * as StringUtil from './util/StringUtil';
import {validateConfig} from './validator/SwaggerValidator';

initializeHelpers(['comparison']);

export async function exportServices(swaggerJson: Spec): Promise<ResourceGenerator[]> {
  const resources: ResourceGenerator[] = [];
  const recordedUrls: Record<string, Record<string, Path>> = {};

  for (const url of Object.keys(swaggerJson.paths)) {
    const normalizedUrl = StringUtil.normalizeUrl(url);
    const directory = normalizedUrl.substr(0, normalizedUrl.lastIndexOf('/'));
    const serviceName = StringUtil.generateServiceName(normalizedUrl);
    const fullyQualifiedName = `api${directory}/${serviceName}`;

    recordedUrls[fullyQualifiedName] = {
      ...recordedUrls[fullyQualifiedName],
      [url]: swaggerJson.paths[url],
    };
  }

  for (const [fullyQualifiedName, resourceDefinitions] of Object.entries(recordedUrls)) {
    const restResource = new ResourceGenerator(fullyQualifiedName, resourceDefinitions, swaggerJson);
    resources.push(restResource);
  }

  return resources;
}

async function buildIndexFiles(fileIndex: DirEntry): Promise<void> {
  await new IndexFileGenerator(Object.keys(fileIndex.files), fileIndex.fullPath).write();

  for (const dir of Object.values(fileIndex.directories)) {
    await buildIndexFiles(dir);
  }
}

async function generateClient(swaggerJson: Spec, outputDirectory: string): Promise<void> {
  const resources = await exportServices(swaggerJson);

  for (const restResource of resources) {
    const renderedResource = await restResource.toString();
    await fs.outputFile(path.join(outputDirectory, restResource.filePath), renderedResource, 'utf-8');
  }

  const fileIndex = await generateFileIndex(outputDirectory);

  await new APIClientGenerator(fileIndex, outputDirectory).write();

  fileIndex.files['APIClient'] = {
    fullPath: path.resolve(outputDirectory, 'APIClient'),
    name: 'APIClient',
  };

  await buildIndexFiles(fileIndex);
}

export async function writeClient(inputFile: string, outputDirectory: string): Promise<void> {
  const swaggerJson: Spec = await fs.readJson(inputFile);
  await validateConfig(swaggerJson);
  return generateClient(swaggerJson, outputDirectory);
}
