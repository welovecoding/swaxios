import {Path} from 'swagger-schema-official';
import {StringUtil} from '../util/StringUtil';
import {SwaxiosGenerator} from './SwaxiosGenerator';

class BaseClient implements SwaxiosGenerator {
  private readonly paths: Path[];

  constructor(paths: Path[]) {
    this.paths = paths;
  }

  get filePath(): string {
    return `APIClient.ts`;
  }

  get context(): Object {
    const api: Record<string, any> = {};
    for (const [url] of Object.entries(this.paths)) {
      const urlParts = url.split('/').filter(Boolean);
      const part0Camelized = StringUtil.camelize(urlParts[0]);
      console.log({urlParts, length: urlParts.length});

      if (urlParts.length === 1) {
        api[part0Camelized] = `${part0Camelized}API`;
      } else {
        const part1Camelized = StringUtil.camelize(urlParts[0]);
        if (typeof api[part0Camelized] === 'undefined') {
          api[part0Camelized] = {};
        } else if (typeof api[part0Camelized] === 'string') {
          api[part0Camelized] = {
            [api[part0Camelized].replace('API', '')]: api[part0Camelized],
          };
        }
        api[part0Camelized][part1Camelized] = `${part1Camelized}API`;
      }
    }
    console.log({api});

    return {
      api: '{}',
    };
  }
}

export {BaseClient};
