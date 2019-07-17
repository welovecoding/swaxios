import fs from 'fs-extra';
import os from 'os';
import path from 'path';
import {Spec} from 'swagger-schema-official';

import {exportServices, writeClient} from './Swaxios';

let tempDir: string;

function createTempDir(prefix: string = 'Swaxios'): Promise<string> {
  const osTmpDir = os.tmpdir();
  const fullPath = path.join(osTmpDir, prefix);
  return fs.mkdtemp(fullPath);
}

beforeEach(async () => (tempDir = await createTempDir()));

afterEach(() => fs.remove(tempDir));

describe('writeClient', () => {
  it('generates descriptions', async () => {
    const inputFile = path.resolve(__dirname, './test/snapshots/1-query-param-description.json');
    await writeClient(inputFile, tempDir, true);
    const actual = await fs.readFile(path.join(tempDir, 'rest/instance/ArchiveService.ts'), 'utf-8');
    const expected = await fs.readFile(
      path.resolve(__dirname, './test/snapshots/1-query-param-description.ts.fixture'),
      'utf-8',
    );
    expect(actual).toBe(expected);
  });

  it('resolves deep nested endpoints', async () => {
    const inputFile = path.resolve(__dirname, './test/snapshots/2-deep-nested-endpoints.json');
    await writeClient(inputFile, tempDir, true);
    const actual = await fs.readFile(path.join(tempDir, 'APIClient.ts'), 'utf-8');
    const expected = await fs.readFile(
      path.resolve(__dirname, './test/snapshots/2-deep-nested-endpoints.ts.fixture'),
      'utf-8',
    );
    expect(actual).toBe(expected);
  });

  it('resolves types for query parameters', async () => {
    const inputFile = path.resolve(__dirname, './test/snapshots/3-delete-by-id-number.json');
    await writeClient(inputFile, tempDir, true);
    const actual = await fs.readFile(path.join(tempDir, 'rest/api/v1/ExchangeService.ts'), 'utf-8');
    const expected = await fs.readFile(
      path.resolve(__dirname, './test/snapshots/3-delete-by-id-number.ts.fixture'),
      'utf-8',
    );
    expect(actual).toBe(expected);
  });

  it('supports response types on DELETE requests', async () => {
    const inputFile = path.resolve(__dirname, './test/snapshots/4-delete-by-id-number-with-response.json');
    await writeClient(inputFile, tempDir, true);
    const actual = await fs.readFile(path.join(tempDir, 'rest/api/v1/ExchangeService.ts'), 'utf-8');
    const expected = await fs.readFile(
      path.resolve(__dirname, './test/snapshots/4-delete-by-id-number-with-response.ts.fixture'),
      'utf-8',
    );
    expect(actual).toBe(expected);
  });
});

describe('exportServices', () => {
  it('merges resources if they belong to the same service', async () => {
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
