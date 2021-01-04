import SwaggerParser from '@apidevtools/swagger-parser';
import {OpenAPIV2} from 'openapi-types';

export async function validateConfig(swaggerJson: OpenAPIV2.Document): Promise<void> {
  // let's create a copy because swagger-parser modifies the object,
  // see https://github.com/APIDevTools/swagger-parser/issues/77
  const swaggerJsonCopy = JSON.parse(JSON.stringify(swaggerJson));
  const {openapi: openApiVersion} = swaggerJsonCopy;
  if (openApiVersion) {
    throw new Error(`Swaxios can only handle Swagger 2.x definitions: OpenAPI v${openApiVersion} is not supported.`);
  }
  await SwaggerParser.validate(swaggerJsonCopy);
}
