class StringUtil {
  static camelCase(words: string[], isPascalCase: boolean = false) {
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

  static pascalCase(words: string[]) {
    return StringUtil.camelCase(words, true);
  }

  static generateServiceName(url: string) {
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

    return StringUtil.pascalCase(resourceName.split('-').concat(['service']));
  }
}

export {StringUtil};
