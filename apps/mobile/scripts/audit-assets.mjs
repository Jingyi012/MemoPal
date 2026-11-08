import { readdir, readFile, stat } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
async function files(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory() ? files(join(folder, entry.name)) : [join(folder, entry.name)]
      )
    )
  ).flat();
}
const references = new Set();
const missing = [];
for (const file of await files(join(root, 'src'))) {
  if (!/\.[cm]?[jt]sx?$/.test(file)) continue;
  const source = await readFile(file, 'utf8');
  for (const match of source.matchAll(
    /(?:require\(\s*|from\s*)(['"])([^'"]+\.(?:png|webp|jpe?g|gif))\1/g
  )) {
    const path = match[2].startsWith('.')
      ? resolve(dirname(file), match[2])
      : match[2].startsWith('@/')
        ? resolve(root, 'src', match[2].slice(2))
        : null;
    if (!path) continue;
    references.add(path);
    try {
      await stat(path);
    } catch {
      missing.push({ source: file.slice(root.length + 1), asset: match[2] });
    }
  }
}
for (const value of (await readFile(join(root, 'app.json'), 'utf8')).matchAll(
  /"(\.\/assets\/[^"\n]+)"/g
)) {
  references.add(resolve(root, value[1]));
  try {
    await stat(resolve(root, value[1]));
  } catch {
    missing.push({ source: 'app.json', asset: value[1] });
  }
}
const assets = (await files(join(root, 'assets'))).filter((file) =>
  /\.(png|webp|jpe?g|gif)$/.test(file)
);
const unused = assets
  .filter((file) => !references.has(file))
  .map((file) => file.slice(root.length + 1).replaceAll('\\', '/'));
let bytes = 0;
for (const file of assets) bytes += (await stat(file)).size;
console.log(
  JSON.stringify(
    {
      imageFiles: assets.length,
      imageBytes: bytes,
      unusedImages: unused,
      missingReferences: missing,
    },
    null,
    2
  )
);
if (missing.length) process.exitCode = 1;
