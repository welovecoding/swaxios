import fs from 'fs-extra';
import path from 'path';

export interface FileEntry {
  alternativeName: string | null;
  fullPath: string;
  name: string;
}

export interface DirEntry {
  directories: Record<string, DirEntry>;
  fullPath: string;
  files: Record<string, FileEntry>;
  name: string;
}

const fileNames: string[] = [];

function getUniqueFileName(fileName: string, fileNames: string[]): string | null {
  if (!fileNames.includes(fileName)) {
    fileNames.push(fileName);
    return null;
  }

  const indexAndExtension = fileName.match(/(\d+)\.(\w+)$/);
  const indexNumber = indexAndExtension ? parseInt(indexAndExtension[0], 10) + 1 : 1;
  const alternativeFilename = `${fileName}${indexNumber}`;
  fileNames.push(alternativeFilename);
  return alternativeFilename;
}

export async function generateFileIndex(directory: string): Promise<DirEntry> {
  const resolvedDir = path.resolve(directory);
  const fileIndex: DirEntry = {
    directories: {},
    files: {},
    fullPath: resolvedDir,
    name: path.basename(resolvedDir),
  };

  try {
    const dirObjects = await fs.readdir(resolvedDir);

    const generateIndices = dirObjects.sort().map(async fileName => {
      const resolvedFile = path.join(resolvedDir, fileName);
      const lstat = await fs.lstat(resolvedFile);
      fileName = fileName.replace('.ts', '');

      if (lstat.isFile()) {
        fileIndex.files[fileName] = {
          alternativeName: getUniqueFileName(fileName, fileNames),
          fullPath: resolvedFile.replace('.ts', ''),
          name: fileName,
        };
      } else if (lstat.isDirectory()) {
        const deepIndex = await generateFileIndex(resolvedFile);
        fileIndex.directories[fileName] = deepIndex;
      }
    });

    await Promise.all(generateIndices);
  } catch (error) {
    console.error(error);
  }

  return fileIndex;
}
