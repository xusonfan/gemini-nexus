import { readFile, writeFile } from 'node:fs/promises';

const files = {
  packageJson: new URL('../package.json', import.meta.url),
  packageLock: new URL('../package-lock.json', import.meta.url),
  manifest: new URL('../manifest.json', import.meta.url),
};

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

async function writeJson(file, data) {
  await writeFile(file, `${JSON.stringify(data, null, 2)}\n`);
}

const packageJson = await readJson(files.packageJson);
const version = packageJson.version;

if (!/^\d+\.\d+\.\d+(?:\.\d+)?$/.test(version)) {
  throw new Error(`Chrome extension manifest requires a numeric version, got "${version}".`);
}

const manifestSource = await readFile(files.manifest, 'utf8');
const manifest = JSON.parse(manifestSource);
manifest.version = version;
const nextManifestSource = manifestSource.replace(
  /("version"\s*:\s*")[^"]+(")/,
  `$1${version}$2`,
);
if (nextManifestSource === manifestSource && JSON.parse(nextManifestSource).version !== version) {
  throw new Error('Unable to update manifest.json version.');
}
await writeFile(files.manifest, nextManifestSource);

const packageLock = await readJson(files.packageLock);
packageLock.version = version;
if (packageLock.packages?.['']) {
  packageLock.packages[''].version = version;
}
await writeJson(files.packageLock, packageLock);

console.log(`Synced release version ${version} to manifest.json and package-lock.json.`);
