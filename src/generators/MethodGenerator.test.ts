import {Operation} from 'swagger-schema-official';
import {MethodGenerator} from './MethodGenerator';

const WireSSO = require('../test/fixtures/wire-sso.json');

describe('MethodGenerator', () => {
  describe('constructor', () => {
    it('constructs a RESTful method name', () => {
      const url = '/identity-providers';
      const method = 'post';
      const operation: Operation = {
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
        },
      };

      const methodDefinition = new MethodGenerator(url, method, operation, WireSSO);

      expect(methodDefinition.formattedUrl).toBe("'/identity-providers'");
      expect(methodDefinition.method).toBe('post');
      expect(methodDefinition.normalizedUrl).toBe('/identity-providers');
      expect(methodDefinition.parameterMethod).toBe('postAll');
      expect(methodDefinition.parameterName).toBeUndefined();
      expect(methodDefinition.returnType).toBe(
        '{ extraInfo: string; id: string, metadata: { certAuthnResponse: Array<string>; issuer: string, requestURI: string } }'
      );
    });

    it('recognizes URL variables', () => {
      const url = '/identity-providers/{id}';
      const method = 'delete';
      const operation: Operation = {responses: {'204': {description: ''}, '404': {description: '`id` not found'}}};

      const methodDefinition = new MethodGenerator(url, method, operation, WireSSO);

      expect(methodDefinition.method).toBe('delete');
      expect(methodDefinition.normalizedUrl).toBe('/identity-providers');
      expect(methodDefinition.parameterMethod).toBe('deleteById');
      expect(methodDefinition.parameterName).toBe('id');
    });

    it('builds body parameters', () => {
      const url = '/identity-providers/{id}';
      const method = 'post';
      const operation: Operation = {
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
        responses: {'200': {description: ''}, '404': {description: '`id` not found'}},
      };

      const methodDefinition = new MethodGenerator(url, method, operation, WireSSO);

      expect(methodDefinition.method).toBe('post');
      expect(methodDefinition.normalizedUrl).toBe('/identity-providers');
      expect(methodDefinition.parameterMethod).toBe('postById');
      expect(methodDefinition.parameterName).toBe('id');
      expect(methodDefinition.bodyParameters![0]).toEqual({name: 'body', type: '{ user: string }'});
    });
  });
});
