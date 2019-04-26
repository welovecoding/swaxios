import swagger from './swagger.json';

const urls = Object.keys(swagger.paths);
console.log('Resources', urls.join(','));
