import * as FileUtil from './FileUtil';

describe('getUniqueFileName', () => {
  it('creates unique file names', () => {
    const fileName = FileUtil.getUniqueFileName('MyFile');
    const fileName1 = FileUtil.getUniqueFileName('MyFile1');
    const fileName2 = FileUtil.getUniqueFileName('MyFile2');
    expect(fileName).toBe(null);
    expect(fileName1).toBe('MyFile1');
    expect(fileName2).toBe('MyFile2');
  });
});
