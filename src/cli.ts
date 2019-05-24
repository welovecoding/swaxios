#!/usr/bin/env node

import program from 'caporal';
import path from 'path';

import {writeClient} from './Swaxios';
const {bin, description, name, version} = require('../package.json');
const binName = Object.keys(bin)[0] || name;

program
  .name(`${name[0].toUpperCase()}${name.substring(1)}`)
  .bin(binName)
  .description(description)
  .version(version)
  .option('-i, --input <file>', 'Set the input file', undefined, undefined, true)
  .option('-o, --output <directory>', 'Set the output directory', undefined, undefined, true)
  .action((args, options) => {
    const inputFile = path.resolve(process.cwd(), options.input);
    const outputDirectory = path.resolve(process.cwd(), options.output);

    writeClient(inputFile, outputDirectory).catch(error => {
      console.error(error);
      process.exit(1);
    });
  })
  .parse(process.argv);
