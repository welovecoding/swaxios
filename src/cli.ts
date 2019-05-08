#!/usr/bin/env node

import minimist from 'minimist';
import path from 'path';

import {writeClient} from './Swaxios';
const {bin, description, name, version} = require('../package.json');
const binName = Object.keys(bin)[0] || name;

const argv = minimist(process.argv.slice(1));

const usage = `Usage: ${binName} [options]

${description}

Options:
  -i, --input    Set the input file
  -o, --output   Set the output directory
  -h, --help     Output usage information
  -v, --version  Output the version number
`;

const helpArg = argv.h || argv.help;
const inputArg = argv.i || argv.input;
const outputArg = argv.o || argv.output;
const versionArg = argv.v || argv.version;

if (versionArg) {
  console.log(version);
  process.exit();
}

if (helpArg || !inputArg || !outputArg) {
  console.log(usage);
  process.exit();
}

const inputFile = path.resolve(process.cwd(), inputArg);
const outputDirectory = path.resolve(process.cwd(), outputArg);

writeClient(inputFile, outputDirectory).catch(error => {
  console.error(error);
  process.exit(1);
});
