import {Spec} from 'swagger-schema-official';
import {exportServices} from './APIClientGenerator';

describe('exportServices', () => {
  it('merges resources if their belong to the same service', async () => {
    const swaggerJson: Spec = {
      info: {
        description: '',
        title: '',
        version: '',
      },
      paths: {
        '/api/identity-providers': {
          get: {
            produces: ['application/json;charset=utf-8'],
            responses: {
              '200': {
                description: '',
                schema: {
                  $ref: '#/definitions/IdPList',
                },
              },
            },
          },
        },
        '/api/identity-providers/{id}': {
          delete: {
            parameters: [
              {
                format: 'uuid',
                in: 'path',
                name: 'id',
                required: true,
                type: 'string',
              },
            ],
            produces: ['application/json;charset=utf-8'],
            responses: {
              '204': {
                description: '',
              },
              '404': {
                description: '`id` not found',
              },
            },
          },
        },
      },
      swagger: '2.0',
    };
    const services = await exportServices(swaggerJson);
    expect(services.length).toBe(1);
  });
});
