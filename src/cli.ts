import minimist from 'minimist';
import path from "path";
import {generateClient} from "./index";

const argv = minimist(process.argv.slice(1));

const inputFile = path.resolve(path.join(process.cwd(), argv.i));
const outputDirectory = path.resolve(path.join(process.cwd(), argv.o));

try {
  generateClient(inputFile, outputDirectory);
} catch (error) {
  console.error(error.message);
}

