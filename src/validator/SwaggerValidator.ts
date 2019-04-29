import SwaggerParser from 'swagger-parser';
import {Spec} from "swagger-schema-official";

export function validateConfig(swaggerJson: Spec) {
  return SwaggerParser.validate(swaggerJson);
}
