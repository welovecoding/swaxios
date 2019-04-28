import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs-extra';
import {validateConfig} from "./util/SwaggerValidator";
import {ParsedResource} from "./info/ParsedResource";

Handlebars.registerHelper('surroundWithCurlyBraces', (text) => {
  return new Handlebars.SafeString(`{${text}}`);
});

function getTemplateFile(parsedInfo: any): string | undefined {
  if (parsedInfo instanceof ParsedResource) {
    return path.join(process.cwd(), 'src', 'template', 'APIClass.hbs');
  } else {
    return undefined;
  }
}

function getContext(parsedInfo: any): { [index: string]: any } | undefined {
  if (parsedInfo instanceof ParsedResource) {
    return {
      name: parsedInfo.name
    };
  } else {
    return undefined;
  }
}

function renderTemplate(parsedInfo: any) {
  const templateFile = getTemplateFile(parsedInfo);
  const context = getContext(parsedInfo);
  if (templateFile && context) {
    const templateSource = fs.readFileSync(templateFile, 'utf8');
    const template = Handlebars.compile(templateSource);
    return template(context);
  }
}

export function generateClient(inputFile: string, outputDirectory: string, writeFiles: boolean = true) {
  const swaggerJson = fs.readJsonSync(inputFile);
  validateConfig(swaggerJson);

  const urls = Object.keys(swaggerJson.paths);
  urls.forEach(url => {
    const restResource = new ParsedResource(url);
    const renderedTemplate = renderTemplate(restResource);
    if (writeFiles) {
      const outputFile = path.join(outputDirectory, restResource.filePath);
      fs.outputFileSync(outputFile, renderedTemplate);
    }
  });
}
