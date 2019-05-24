import SwaggerParser from 'swagger-parser';
import {Spec} from 'swagger-schema-official';

export async function validateConfig(swaggerJson: Spec): Promise<void> {
  await SwaggerParser.validate(swaggerJson);
}
