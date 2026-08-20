import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const assetsDirectory = path.join(root, "dist", "client", "assets");
const manifestPaths = [
  path.join(root, "dist", "server", "__vite_rsc_assets_manifest.js"),
  path.join(root, "dist", "server", "ssr", "__vite_rsc_assets_manifest.js"),
];

const cssFiles = (await readdir(assetsDirectory)).filter((file) => file.endsWith(".css"));

for (const cssFile of cssFiles) {
  const css = await readFile(path.join(assetsDirectory, cssFile));
  const version = createHash("sha256").update(css).digest("hex").slice(0, 12);
  const assetPath = `/assets/${cssFile}`;
  const versionedPath = `${assetPath}?v=${version}`;

  for (const manifestPath of manifestPaths) {
    const manifest = await readFile(manifestPath, "utf8");
    if (!manifest.includes(assetPath)) {
      throw new Error(`Missing ${assetPath} in ${manifestPath}`);
    }
    await writeFile(manifestPath, manifest.replaceAll(assetPath, versionedPath));
  }

  console.log(`Versioned ${assetPath} as ${versionedPath}`);
}
