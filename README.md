# Swaxios

A [Swagger](https://swagger.io/) API client generator based on [axios](https://github.com/axios/axios) and written in [TypeScript](https://www.typescriptlang.org/).

## Usage

If you pass a [Swagger definition](https://swagger.io/docs/specification/2-0/basic-structure/) (v2.0; valid JSON) to Swaxios, then it will generate you an API client that uses axios under the hood and is written in TypeScript.

```
swaxios -i ./path/to/swagger.json -o ./path/to/output/directory
```
