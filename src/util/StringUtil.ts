export function camelCase(words: string[], isPascalCase: boolean = false): string {
  const casedWords = words.map(
    word =>
      word
        .toLowerCase()
        .charAt(0)
        .toUpperCase() + word.slice(1)
  );
  if (!isPascalCase) {
    casedWords[0] = casedWords[0].toLowerCase();
  }
  return casedWords.join('');
}

export function pascalCase(words: string[]): string {
  return camelCase(words, true);
}

export function camelize(resourceName: string, isPascalCase = false): string {
  return camelCase(resourceName.split('-'), isPascalCase);
}

export function generateServiceName(url: string): string {
  const urlPartFilter = (part: string) => {
    if (part.length === 0) {
      return false;
    }

    if (part.startsWith('{')) {
      return false;
    }

    return true;
  };

  const urlParts = url.split('/').filter(urlPartFilter);
  const lastUrlPart = urlParts[urlParts.length - 1];
  const resourceName = lastUrlPart ? lastUrlPart : 'Root';

  return camelize(`${resourceName}-service`, true);
}

export function normalizeUrl(url: string): string {
  return url.replace(/\/\{.*\}/g, '');
}

export function addStarsToNewline(text?: string): string {
  return text ? text.replace(/([\r\n])/g, '$1   * ') : '';
}
