import { readFile, access } from "node:fs/promises";

const manifest = JSON.parse(await readFile("manifest.json", "utf8"));
if (manifest.manifest_version !== 3) throw new Error("manifest_version must be 3");
if (manifest.version !== JSON.parse(await readFile("package.json", "utf8")).version) throw new Error("Version mismatch");
if ((manifest.permissions || []).length || (manifest.host_permissions || []).length) throw new Error("The local converter should not request permissions");

const required = ["background.js", "app.html", "app.css", "app.js", "lib/eml.js", ...Object.values(manifest.icons)];
await Promise.all(required.map((file) => access(file)));
console.log(`Validated ${manifest.name} v${manifest.version} (${required.length} files).`);
