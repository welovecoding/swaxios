import {OpenAPIV2} from 'openapi-types';
import SwaggerParser from 'swagger-parser';

export async function validateConfig(swaggerJson: OpenAPIV2.Document): Promise<void> {
  await SwaggerParser.validate(swaggerJson);
}
