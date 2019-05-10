![Swaxios](./logo.png)

# Swaxios

A [Swagger](https://swagger.io/) API httpClient generator based on [axios](https://github.com/axios/axios) and written in [TypeScript](https://www.typescriptlang.org/).

## Usage

If you pass a [Swagger definition](https://swagger.io/docs/specification/2-0/basic-structure/) (v2.0; valid JSON) to Swaxios, then it will generate you an API httpClient that uses axios under the hood and is written in TypeScript.

```
swaxios -i ./path/to/swagger.json -o ./path/to/output/directory
```

## Example

**APIClient.ts**

```ts
import axios, {AxiosInstance, AxiosRequestConfig} from 'axios';
import {IdentityProvidersService} from './identity-providers/';
import {FinalizeLoginService} from './sso/';

export class APIClient {
  private readonly httpClient: AxiosInstance;

  constructor(baseURL: string);
  constructor(config: AxiosRequestConfig);
  constructor(configOrBaseURL: AxiosRequestConfig | string) {
    if (typeof configOrBaseURL === 'string') {
      configOrBaseURL = {baseURL: configOrBaseURL};
    }

    this.httpClient = axios.create(configOrBaseURL);
  }

  get api() {
    return {
      identityProviders: new IdentityProvidersService(this.httpClient),
      sso: {
        FinalizeLogin: new FinalizeLoginService(this.httpClient),
      },
    };
  }

  get interceptors() {
    return this.httpClient.interceptors;
  }
}
```

**YourApp.ts**

```ts
import {APIClient} from 'swaxios';

const client = new APIClient('https://staging-nginz-https.zinfra.io');
client.interceptors.request.use(config => config);
client.api.identityProviders.getAll();
client.api.identityProviders.getById('36fd5dad-6948-4b19-83f2-86b5c4e3dcdc');
client.api.sso.FinalizeLogin.create();
```

Inspired by [swagger-codegen](https://github.com/swagger-api/swagger-codegen).
