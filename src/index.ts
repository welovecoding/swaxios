import {StringUtil} from './util/StringUtil';
import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs-extra';
import {validateConfig} from "./util/SwaggerValidator";

Handlebars.registerHelper('surroundWithCurlyBraces', (text) => {
  return new Handlebars.SafeString(`{${text}}`);
});

export function generateClient(inputFile: string, outputDirectory: string) {
  const swaggerJson = fs.readJsonSync(inputFile);
  validateConfig(swaggerJson);

  const urls = Object.keys(swaggerJson.paths);
  urls.forEach(url => {
    const urlParts = url.split('/');
    const lastUrlPart = urlParts[urlParts.length - 1];
    const resourceName = lastUrlPart ? lastUrlPart : 'Root';
    const serviceName = StringUtil.pascalCase([resourceName, 'service']);
    const urlPath = url.substr(0, url.lastIndexOf('/'));
    const filePath = `${urlPath}/${serviceName}.ts`;
    console.log(`${filePath} => ${url}`);

    const templateFile = path.join(process.cwd(), 'src', 'template', 'APIClass.hbs');
    const templateSource = fs.readFileSync(templateFile, 'utf8');
    const template = Handlebars.compile(templateSource);
    const renderedTemplate = template({name: serviceName});

    const outputFile = path.join(outputDirectory, filePath);
    fs.outputFileSync(outputFile, renderedTemplate);
  });
}
