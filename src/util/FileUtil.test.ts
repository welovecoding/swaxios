import * as FileUtil from './FileUtil';

describe('getUniqueFileName', () => {
  it('creates unique file names', () => {
    expect(FileUtil.getUniqueFileName('MyFile')).toBe(null);
    for (let i = 1; i <= 10; i++) {
      expect(FileUtil.getUniqueFileName('MyFile')).toBe(`MyFile${i}`);
    }
  });
});
