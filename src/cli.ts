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
  .option('-i, --input <file>', 'Set the input file (required)')
  .option('-o, --output <directory>', 'Set the output directory (required)')
  .parse(process.argv);

if (!program.input || !program.output) {
  program.outputHelp();
  process.exit(1);
}

const inputFile = path.resolve(process.cwd(), program.input);
const outputDirectory = path.resolve(process.cwd(), program.output);

writeClient(inputFile, outputDirectory).catch(error => {
  console.error(error);
  process.exit(1);
});
