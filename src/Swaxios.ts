import axios from 'axios';
import {isCI} from 'ci-info';
import {getYesNo} from 'cli-interact';
import fs from 'fs-extra';
import initializeHelpers from 'handlebars-helpers';
import path from 'path';
import yaml from 'yamljs';

import {OpenAPIV2} from 'openapi-types';
import {APIClientGenerator, IndexFileGenerator, ResourceGenerator} from './generators';
import {InterfaceGenerator} from './generators/InterfaceGenerator';
import {DirEntry, generateFileIndex} from './util/FileUtil';
import * as StringUtil from './util/StringUtil';
import {validateConfig} from './validator/SwaggerValidator';

initializeHelpers(['comparison']);

export async function exportServices(swaggerJson: OpenAPIV2.Document): Promise<ResourceGenerator[]> {
  const resources: ResourceGenerator[] = [];
  const recordedUrls: Record<string, Record<string, OpenAPIV2.PathsObject>> = {};

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
  const filesAndDirs = Object.keys(fileIndex.files).concat(Object.keys(fileIndex.directories).map(dir => `${dir}/`));
  await new IndexFileGenerator(filesAndDirs, fileIndex.fullPath).write();

  for (const dir of Object.values(fileIndex.directories)) {
    await buildIndexFiles(dir);
  }
}

export async function generateClient(swaggerJson: OpenAPIV2.Document, outputDirectory: string): Promise<void> {
  const resources = await exportServices(swaggerJson);

  for (const restResource of resources) {
    const renderedResource = await restResource.toString();
    await fs.outputFile(path.join(outputDirectory, restResource.filePath), renderedResource, 'utf-8');
  }

  const fileIndex = await generateFileIndex(outputDirectory);

  await new APIClientGenerator(fileIndex, outputDirectory, swaggerJson).write();

  fileIndex.files.APIClient = {
    alternativeName: null,
    fullPath: path.resolve(outputDirectory, 'APIClient'),
    name: 'APIClient',
  };

  fileIndex.directories.interfaces = {
    directories: {},
    files: {},
    fullPath: path.resolve(outputDirectory, 'interfaces'),
    name: 'interfaces',
  };

  await buildIndexFiles(fileIndex);
  await generateInterfaces(swaggerJson, outputDirectory);
}

async function generateInterfaces(spec: OpenAPIV2.Document, outputDirectory: string): Promise<void> {
  if (!spec.definitions) {
    console.info('Spec has no definitions.');
    return;
  }

  const interfaceDirectory = path.join(outputDirectory, 'interfaces');

  for (const [definitionName, definition] of Object.entries(spec.definitions)) {
    await new InterfaceGenerator(definitionName, definition, spec, interfaceDirectory).write();
  }

  await new IndexFileGenerator(Object.keys(spec.definitions), interfaceDirectory).write();
}

function parseInputFile(inputFile: string): OpenAPIV2.Document {
  try {
    return JSON.parse(inputFile);
  } catch (error) {
    try {
      return yaml.parse(inputFile);
    } catch (error) {
      throw new Error(`Input file "${inputFile}" is neither valid JSON nor valid YAML.`);
    }
  }
}

async function readInputFile(inputFile: string): Promise<OpenAPIV2.Document> {
  console.log(`Reading OpenAPI specification from file "${inputFile}" ...`);

  try {
    const data = await fs.readFile(inputFile, 'utf-8');
    return parseInputFile(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Input file "${inputFile}" could not be found or is not readable`);
    }
    throw error;
  }
}

async function readInputURL(inputUrl: string): Promise<OpenAPIV2.Document> {
  console.log(`Reading OpenAPI specification from URL "${inputUrl}" ...`);
  try {
    const {data} = await axios.get<string>(inputUrl, {transformResponse: data => data});
    return parseInputFile(data);
  } catch (error) {
    throw new Error(error.message);
  }
}

async function checkOutputDirectory(outputDirectory: string, forceDeletion?: boolean): Promise<void> {
  const directoryExists = await fs.pathExists(outputDirectory);
  function shouldDelete(): boolean {
    const question = `The output directory "${outputDirectory}" exists already. Would you like to delete it?\nNOTE: Without deletion, Swaxios can generate unexpected results.`;
    return forceDeletion || (!isCI && getYesNo(question));
  }

  if (directoryExists) {
    if (shouldDelete()) {
      console.info(`Deleting "${outputDirectory}" ...`);
      await fs.remove(outputDirectory);
      return;
    }

    if (isCI) {
      throw new Error(`Output directory "${outputDirectory}" exists already`);
    }
  }
}

export async function writeClient(inputFile: string, outputDirectory: string, forceDeletion?: boolean): Promise<void> {
  await checkOutputDirectory(outputDirectory, forceDeletion);
  const isUrl = /^(https?|ftps?):\/\//.test(inputFile);
  const swaggerJson = isUrl ? await readInputURL(inputFile) : await readInputFile(inputFile);
  await validateConfig(swaggerJson);
  return generateClient(swaggerJson, outputDirectory);
}
