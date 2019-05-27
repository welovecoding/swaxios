#!/usr/bin/env node

import program from 'commander';
import path from 'path';

import {writeClient} from './Swaxios';

const {bin, description, name, version} = require('../package.json');
const binName = Object.keys(bin)[0] || name;

program
  .name(binName)
  .description(description)
  .version(version, '-v, --version')
  .option('-i, --input <file>', 'File path (or URL) to OpenAPI Specification, i.e. swagger.json (required)')
  .option('-o, --output <directory>', 'Path to output directory for generated TypeScript code (required)')
  .parse(process.argv);

if (!program.input || !program.output) {
  program.outputHelp();
  process.exit(1);
}

const outputDirectory = path.resolve(process.cwd(), program.output);

writeClient(program.input, outputDirectory)
  .then(() => {
    console.log(`Created API client in "${outputDirectory}".`);
  })
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
