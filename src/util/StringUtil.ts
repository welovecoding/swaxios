class StringUtil {
  static camelCase(words: string[], isPascalCase: boolean = false) {
    const casedWords = words.map(word => word.toLowerCase().charAt(0).toUpperCase() + word.slice(1));
    if (!isPascalCase) {
      casedWords[0] = casedWords[0].toLowerCase();
    }
    return casedWords.join('');
  }

  static pascalCase(words: string[]) {
    return StringUtil.camelCase(words, true);
  }
}

export {StringUtil};
