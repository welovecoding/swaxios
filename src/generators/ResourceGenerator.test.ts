import {ResourceGenerator} from './ResourceGenerator';

describe('ResourceGenerator', () => {
  describe('constructor', () => {
    it('includes the service name within the file path', () => {
      const fullyQualifiedName = 'rest/sso/FinalizeLoginService';
      const resources = {};
      const spec = {
        info: {
          title: 'E2E Test Service',
          version: '1.16.1',
        },
        paths: {},
        swagger: '2.0',
      };

      const generator = new ResourceGenerator(fullyQualifiedName, resources, spec);
      expect(generator.filePath).toBe('rest/sso/FinalizeLoginService.ts');
    });
  });
});
