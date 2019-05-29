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
      path.resolve(__dirname, './test/snapshots/1-query-param-description.ts'),
      'utf-8'
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
