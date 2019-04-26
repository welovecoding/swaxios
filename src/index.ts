import swagger from './swagger.json';
import {StringUtil} from './util/StringUtil';

const urls = Object.keys(swagger.paths);
urls.forEach(url => {
  const urlParts = url.split('/');
  const lastUrlPart = urlParts[urlParts.length - 1];
  const resourceName = lastUrlPart ? lastUrlPart : 'Root';
  const serviceName = StringUtil.pascalCase([resourceName, 'service']);
  const path = url.substr(0, url.lastIndexOf('/'));
  const filePath = `${path}/${serviceName}.ts`;
  console.log(`${filePath} => ${url}`);
});
