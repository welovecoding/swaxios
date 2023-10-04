import {DirEntry} from '../util/FileUtil';
import {API, APIClientGenerator} from './APIClientGenerator';

const WireSSO = require('../test/fixtures/wire-sso.json');

describe('ResourceGenerator', () => {
  describe('constructor', () => {
    it('creates unique service names', async () => {
      const fileIndex: DirEntry = {
        directories: {
          login: {
            directories: {},
            files: {
              AuthService: {
                alternativeName: null,
                fullPath: '/home/user/swaxios/api/login/AuthService',
                name: 'AuthService',
              },
            },
            fullPath: 'login',
            name: 'login',
          },
          post: {
            directories: {},
            files: {
              AuthService: {
                alternativeName: 'AuthService1',
                fullPath: '/home/user/swaxios/api/post/AuthService',
                name: 'AuthService',
              },
            },
            fullPath: 'post',
            name: 'post',
          },
        },
        files: {},
        fullPath: '',
        name: '',
      };

      const generator = new APIClientGenerator(fileIndex, '.', WireSSO);
      const services = (await generator.generateAPI(fileIndex)) as Record<string, API>;
      expect(services.login!.authService).not.toBe(services.post!.authService);
    });
  });
});
