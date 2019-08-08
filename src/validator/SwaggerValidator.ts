import {OpenAPIV2} from 'openapi-types';
import SwaggerParser from 'swagger-parser';

export async function validateConfig(swaggerJson: OpenAPIV2.Document): Promise<void> {
  // let's create a copy because swagger-parser modifies the object,
  // see https://github.com/APIDevTools/swagger-parser/issues/77
  const swaggerJsonCopy = JSON.parse(JSON.stringify(swaggerJson));
  await SwaggerParser.validate(swaggerJsonCopy);
}
