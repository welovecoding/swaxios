import SwaggerParser from 'swagger-parser';
import {Spec} from 'swagger-schema-official';

export function validateConfig(swaggerJson: Spec): Promise<any> {
  return SwaggerParser.validate(swaggerJson);
}
