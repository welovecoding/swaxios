import {OpenAPIV2} from 'openapi-types';
import {HttpMethod, MethodGenerator} from './MethodGenerator';

const WireSSO = require('../test/fixtures/wire-sso.json');

describe('MethodGenerator', () => {
  describe('constructor', () => {
    it('constructs a RESTful method name', () => {
      const url = '/identity-providers';
      const method = HttpMethod.POST;
      const operation: OpenAPIV2.OperationObject = {
        responses: {
          '201': {
            description: '',
            schema: {
              properties: {
                extraInfo: {
                  example: '00000000-0000-0000-0000-000000000000',
                  format: 'uuid',
                  type: 'string',
                },
                id: {
                  example: '00000000-0000-0000-0000-000000000000',
                  format: 'uuid',
                  type: 'string',
                },
                metadata: {
                  properties: {
                    certAuthnResponse: {
                      items: {
                        type: 'string',
                      },
                      minItems: 1,
                      type: 'array',
                    },
                    issuer: {
                      type: 'string',
                    },
                    requestURI: {
                      type: 'string',
                    },
                  },
                  required: ['issuer', 'requestURI', 'certAuthnResponse'],
                  type: 'object',
                },
              },
              required: ['id', 'metadata', 'extraInfo'],
              type: 'object',
            },
          },
          '400': {
            description: 'Invalid `body`',
          },
          default: {
            $ref: '',
          },
        },
      };

      const methodDefinition = new MethodGenerator(url, method, operation, WireSSO);

      expect(methodDefinition.formattedUrl).toBe("'/identity-providers'");
      expect(methodDefinition.method).toBe('post');
      expect(methodDefinition.normalizedUrl).toBe('/identity-providers');
      expect(methodDefinition.parameterMethod).toBe('postAll');
      expect(methodDefinition.pathParameters).toEqual([]);
      expect(methodDefinition.returnType).toBe(
        '{ extraInfo: string; id: string, metadata: { certAuthnResponse: Array<string>; issuer: string, requestURI: string } }'
      );
    });

    it('recognizes URL variables', () => {
      const url = '/identity-providers/{id}';
      const method = HttpMethod.DELETE;
      const operation: OpenAPIV2.OperationObject = {
        responses: {
          '204': {description: ''},
          '404': {description: '`id` not found'},
          default: {
            $ref: '',
          },
        },
      };

      const methodDefinition = new MethodGenerator(url, method, operation, WireSSO);

      expect(methodDefinition.method).toBe('delete');
      expect(methodDefinition.normalizedUrl).toBe('/identity-providers');
      expect(methodDefinition.parameterMethod).toBe('deleteById');
      expect(methodDefinition.pathParameters![0]).toEqual({name: 'id', type: 'any'});
    });

    it('builds body parameters', () => {
      const url = '/identity-providers/{id}';
      const method = HttpMethod.POST;
      const operation: OpenAPIV2.OperationObject = {
        parameters: [
          {
            in: 'body',
            name: 'body',
            required: false,
            schema: {
              properties: {
                user: {
                  type: 'string',
                },
              },
            },
          },
        ],
        responses: {
          '200': {description: ''},
          '404': {description: '`id` not found'},
          default: {
            $ref: '',
          },
        },
      };

      const methodDefinition = new MethodGenerator(url, method, operation, WireSSO);

      expect(methodDefinition.method).toBe('post');
      expect(methodDefinition.normalizedUrl).toBe('/identity-providers');
      expect(methodDefinition.parameterMethod).toBe('postById');
      expect(methodDefinition.pathParameters[0]).toEqual({name: 'id', type: 'any'});
      expect(methodDefinition.bodyParameters[0]).toEqual({name: 'body', required: false, type: '{ user?: string }'});
    });
  });
});
