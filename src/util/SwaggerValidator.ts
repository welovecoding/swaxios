export function validateConfig(swaggerJson: { [index: string]: any }): void {
  if (!swaggerJson.paths) {
    throw new Error('The "paths" attribute is missing.');
  }

  if (!swaggerJson.swagger || !swaggerJson.swagger.startsWith('2.')) {
    throw new Error('Only Swagger v2.x is supported.');
  }
}
