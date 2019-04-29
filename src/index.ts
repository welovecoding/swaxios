import Handlebars from 'handlebars';
import path from 'path';
import fs from 'fs-extra';
import {validateConfig} from "./validator/SwaggerValidator";
import {ParsedResource} from "./info/ParsedResource";
import prettier from 'prettier';

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
    return parsedInfo.context;
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

export async function generateClient(inputFile: string, outputDirectory: string, writeFiles: boolean = true) {
  const swaggerJson = fs.readJsonSync(inputFile);
  await validateConfig(swaggerJson);

  const urls = Object.keys(swaggerJson.paths);
  urls.forEach(url => {
    const restResource = new ParsedResource(url, swaggerJson.paths[url]);
    const renderedTemplate = renderTemplate(restResource);
    if (writeFiles) {
      const prettified = prettier.format(String(renderedTemplate), {parser: 'typescript', singleQuote: true});
      const outputFile = path.join(outputDirectory, restResource.filePath);
      fs.outputFileSync(outputFile, prettified);
    }
  });
}
