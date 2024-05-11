#!/usr/bin/env node
import {Command} from 'commander';
import path from 'path';
import {writeClient} from './Swaxios';

const {bin, description, name, version} = require('../package.json');
const binName = Object.keys(bin)[0] || name;
const program = new Command();

program
  .name(binName)
  .description(description)
  .version(version, '-v, --version')
  .option('-i, --input <file>', 'File path (or URL) to OpenAPI Specification, i.e. swagger.json (required)')
  .option('-o, --output <directory>', 'Path to output directory for generated TypeScript code (required)')
  .option('-f, --force', 'Force deleting the output directory before generating')
  .parse(process.argv);

const input = program.getOptionValue('input');
const output = program.getOptionValue('output');
const force = program.getOptionValue('force');

if (!input || !output) {
  program.outputHelp();
  process.exit(1);
}

const outputDirectory = path.resolve(output || '.');

writeClient(input, outputDirectory, force)
  .then(() => console.log(`Created API client in "${outputDirectory}".`))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
