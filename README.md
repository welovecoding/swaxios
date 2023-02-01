![Swaxios](https://github.com/welovecoding/swaxios/raw/main/logo.png)

# Swaxios

A [Swagger](https://swagger.io/) API client generator based on [axios](https://github.com/axios/axios) and written in [TypeScript](https://www.typescriptlang.org/).

## Motivation

Swaxios automates the generation of an API client for TypeScript applications, which can be used in browser and Node.js environments. At the time of writing this code, the [Swagger Codegen project](https://github.com/swagger-api/swagger-codegen) only provided separate SDK generators (`typescript-fetch` for browsers and `typescript-node` for Node.js). Unfortunately, the `typescript-fetch` generator cannot be used with all Node.js applications as the `fetch` API only became globally available as an [experimental fetch API](https://nodejs.org/de/blog/announcements/v18-release-announce/#fetch-experimental) in Node.js 18.

## Installation

You can install Swaxios globally (`npm i -g swaxios`) or add it to your [devDependencies](https://docs.npmjs.com/files/package.json#devdependencies).

Your targeted project must also have a recent version of axios and TypeScript:

```
npm i axios
npm i -D typescript
```

## Usage

Display all CLI options:

```
swaxios --help
```

If you pass an [OpenAPI Specification (OAS)](https://swagger.io/docs/specification/2-0/basic-structure/) (v2.0; JSON or YAML) to Swaxios, then it generates an API client that uses axios under the hood and is written in TypeScript:

```
# Provide a Swagger input file (JSON or YAML)
swaxios -i ./path/to/swagger.json -o ./path/to/output/directory
swaxios -i ./path/to/swagger.yml -o ./path/to/output/directory

# Alternative: Provide a URL to a Swagger endpoint
swaxios -i http://127.0.0.1:3000/documentation-json -o ./path/to/output/directory
```

With the `-f` option, you can force Swaxios to overwrite existing files in the output path:

```
swaxios -i ./path/to/swagger.json -o ./path/to/output/directory -f
```

## Examples

You can find many examples of generated API client code in our [snapshots section](./src/test/snapshots).

Here is a basic example:

**`ExchangeService.ts`**

```ts
/* tslint:disable */

/**
 * This file was automatically generated by "Swaxios".
 * It should not be modified by hand.
 */

import {AxiosInstance, AxiosRequestConfig} from 'axios';

export class ExchangeService {
  private readonly apiClient: AxiosInstance;

  constructor(apiClient: AxiosInstance) {
    this.apiClient = apiClient;
  }

  deleteExchange = async (id: number): Promise<void> => {
    const config: AxiosRequestConfig = {
      method: 'delete',
      url: `/api/v1/exchange/${id}`,
    };
    await this.apiClient.request(config);
  };
}
```

It has been generated from the following [path](https://swagger.io/docs/specification/2-0/paths-and-operations/):

**`swagger.json`**

```jsonc
{
  // ...
  "paths": {
    "/api/v1/exchange/{id}": {
      "delete": {
        "consumes": ["application/json"],
        "operationId": "deleteExchange",
        "parameters": [
          {
            "in": "path",
            "name": "id",
            "required": true,
            "type": "number"
          }
        ],
        "produces": ["application/json"],
        "responses": {
          "200": {
            "description": ""
          }
        }
      }
    }
  }
  // ...
}
```

## Credits

This project is inspired by [swagger-codegen](https://github.com/swagger-api/swagger-codegen).

You can try if `swagger-codegen` works for your project:

> java -jar swagger-codegen-cli-3.0.24.jar generate -l typescript-axios -i swagger.json -o /api-client

- [Download Swagger Codegen 3.0.24](https://repo1.maven.org/maven2/io/swagger/codegen/v3/swagger-codegen-cli/3.0.24/swagger-codegen-cli-3.0.24.jar) ([Source Code](https://github.com/swagger-api/swagger-codegen/releases/tag/v3.0.24))
