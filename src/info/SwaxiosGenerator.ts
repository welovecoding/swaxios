export abstract class SwaxiosGenerator {
  abstract get filePath(): string;
  abstract async getContext(): Promise<any>;
}
