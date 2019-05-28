import axios from 'axios';
import {getYesNo} from 'cli-interact';
import fs from 'fs-extra';
import initializeHelpers from 'handlebars-helpers';
import path from 'path';
import {Path, Spec} from 'swagger-schema-official';
import url from 'url';
import yaml from 'yamljs';
const {isCI} = require('ci-info');

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
    const fullyQualifiedName = `rest${directory}/${serviceName}`;

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
    alternativeName: null,
    fullPath: path.resolve(outputDirectory, 'APIClient'),
    name: 'APIClient',
  };

  await buildIndexFiles(fileIndex);
}

async function readInputURL(inputURL: string): Promise<Spec> {
  console.log(`Reading OpenAPI specification from URL "${inputURL}" ...`);
  const response = await axios.get<Spec>(inputURL);
  return response.data;
}

async function readInputFile(inputFile: string): Promise<Spec> {
  let swaggerJson: Spec;

  console.log(`Reading OpenAPI specification from file "${inputFile}" ...`);

  try {
    await fs.access(inputFile);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Input file "${inputFile}" could not be found or is not readable`);
    }
    throw error;
  }

  try {
    swaggerJson = await fs.readJson(inputFile);
  } catch (error) {
    try {
      swaggerJson = yaml.load(inputFile);
    } catch (error) {
      throw new Error(`Input file "${inputFile}" is neither valid JSON nor valid YAML.`);
    }
  }

  return swaggerJson;
}

async function checkOutputDirectory(outputDirectory: string, forceDeletion?: boolean): Promise<void> {
  const shouldDelete = () =>
    forceDeletion ||
    (!isCI && getYesNo(`The output directory "${outputDirectory}" exists already. Would you like to delete it?`));
  const directoryExists = await fs.pathExists(outputDirectory);

  if (directoryExists) {
    if (shouldDelete()) {
      console.info(`Deleting "${outputDirectory}" ...`);
      await fs.remove(outputDirectory);
      return;
    }

    throw new Error(`Output directory "${outputDirectory}" exists already`);
  }
}

export async function writeClient(inputFile: string, outputDirectory: string, forceDeletion?: boolean): Promise<void> {
  await checkOutputDirectory(outputDirectory, forceDeletion);
  const parsedInput = url.parse(inputFile);
  const swaggerJson = parsedInput.protocol ? await readInputURL(inputFile) : await readInputFile(inputFile);
  await validateConfig(swaggerJson);
  return generateClient(swaggerJson, outputDirectory);
}
