import * as StringUtil from './StringUtil';

describe('camelCase', () => {
  it('creates camel-cased names out of words', () => {
    const camelCased = StringUtil.camelCase(['exchange', 'service']);
    expect(camelCased).toBe('exchangeService');
  });
});

describe('pascalCase', () => {
  it('creates pascal-cased names out of words', () => {
    const camelCased = StringUtil.pascalCase(['exchange', 'service']);
    expect(camelCased).toBe('ExchangeService');
  });
});

describe('generateServiceName', () => {
  it('generates a name out of the given URL', () => {
    let name = StringUtil.generateServiceName('/');
    expect(name).toBe('RootService');

    name = StringUtil.generateServiceName('/exchange');
    expect(name).toBe('ExchangeService');

    name = StringUtil.generateServiceName('/api/v1/exchange');
    expect(name).toBe('ExchangeService');

    name = StringUtil.generateServiceName('/api/v1/identity-providers');
    expect(name).toBe('IdentityProvidersService');

    name = StringUtil.generateServiceName('/api/v1/identity-providers/{id}');
    expect(name).toBe('IdentityProvidersService');
  });
});

describe('normalizeUrl', () => {
  it('strips out variables from URLs', () => {
    const url = '/api/identity-providers/{id}';
    const normalizedUrl = StringUtil.normalizeUrl(url);
    expect(normalizedUrl).toBe('/api/identity-providers');
  });
});
