import * as FileUtil from './FileUtil';

describe('getUniqueFileName', () => {
  it('creates unique file names', () => {
    const fileName = FileUtil.getUniqueFileName('MyFile');
    const fileName1 = FileUtil.getUniqueFileName('MyFile');
    const fileName2 = FileUtil.getUniqueFileName('MyFile');
    expect(fileName).toBe(null);
    expect(fileName1).toBe('MyFile1');
    expect(fileName2).toBe('MyFile2');
  });
});
