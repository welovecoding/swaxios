const StringUtil = {
  camelCase(words: string[], isPascalCase: boolean = false): string {
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
  },

  pascalCase(words: string[]): string {
    return StringUtil.camelCase(words, true);
  },

  camelize(resourceName: string): string {
    return StringUtil.pascalCase(resourceName.split('-'));
  },

  generateServiceName(url: string): string {
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

    return StringUtil.camelize(`${resourceName}-service`);
  },
};

export {StringUtil};
